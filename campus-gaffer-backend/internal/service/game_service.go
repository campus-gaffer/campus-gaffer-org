package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/scraper"
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type GameService interface {
	SyncGames(ctx context.Context, scraped []scraper.ScrapedGameSummary) error
	ProcessCompletedGames(ctx context.Context) error
}

type gameService struct {
	discovery  scraper.DiscoveryScraper
	stats      scraper.StatsScraper
	gameRepo   repository.GameRepository
	perfRepo   repository.PerformanceRepository
	playerRepo repository.PlayerRepository
	teamRepo   repository.TeamRepository
}

func NewGameService(
	discovery scraper.DiscoveryScraper,
	stats scraper.StatsScraper,
	gameRepo repository.GameRepository,
	perfRepo repository.PerformanceRepository,
	playerRepo repository.PlayerRepository,
	teamRepo repository.TeamRepository,
) GameService {
	return &gameService{
		discovery:  discovery,
		stats:      stats,
		gameRepo:   gameRepo,
		perfRepo:   perfRepo,
		playerRepo: playerRepo,
		teamRepo:   teamRepo,
	}
}

func normaliseStatus(gameResultScore string) string {
	if gameResultScore == "" {
		return "Scheduled"
	}
	return "Completed"
}

func parseDate(dateStr string) *datatypes.Date {
	// The date is in MM/DD/YYYY format, e.g. "09/15/1998"
	layout := "1/2/2006"
	parsed, err := time.Parse(layout, dateStr)
	if err != nil {
		// return nil, fmt.Errorf("parseDate: parse %s: %w", dateStr, err)
		log.Printf("Failed to parse date %s: %v", dateStr, err)
		return nil
	}
	d := datatypes.Date(parsed)
	return &d
}

func toGame(game scraper.ScrapedGameSummary) models.Game {
	return models.Game{
		ExternalGameId:     game.ExternalId,
		ExternalSource:     game.ExternalSource,
		ExternalGameType:   int16(game.GameType),
		ExternalLeagueId:   game.LeagueId,
		HomeTeamExternalId: game.HomeTeamId,
		AwayTeamExternalId: game.OpponentTeamId,
		Status:             normaliseStatus(game.GameResultScore),
		IsScraped:          false,
	}
}

func toPlayer(player scraper.ScrapedPlayerInfo) models.Player {
	return models.Player{
		ExternalPlayerId: player.ExternalId,
		ExternalSource:   player.ExternalSource,
		Name:             player.PlayerName,
		IsPrivate:        false,
		BirthDate:        parseDate(player.BirthDate),
		Gender:           &player.Gender,
		YearOfStudy:      &player.YearOfStudy,
		GraduationYear:   &player.GraduationYear,
	}
}

func toPerformance(
	s scraper.ScrapedPlayerStat,
	gameID uuid.UUID,
	playerId uuid.UUID,
	teamID *uuid.UUID,
) models.PlayerPerformance {
	return models.PlayerPerformance{
		PlayerId:   playerId,
		GameId:     gameID,
		TeamId:     teamID,
		Goals:      s.Goals,
		GamePlayed: s.GamePlayed,
		IsMVP:      s.IsMVP,
	}
}

func toTeam(externaId, externalSource, name string) models.Team {
	return models.Team{
		ExternalTeamId: externaId,
		ExternalSource: externalSource,
		Name:           name,
	}
}

func (svc *gameService) SyncGames(ctx context.Context, scraped []scraper.ScrapedGameSummary) error {
	// Deduplicate the scraped payload and upsert each unique game.
	// Upserts are idempotent, so we don't need to query the database.
	// Map is per-call so it doesn't accumulate across runs.
	processed := make(map[string]struct{})
	inserted := 0
	skipped := 0

	for _, game := range scraped {
		if game.ExternalId == "" {
			// skip malformed entries
			skipped++
			continue
		}

		// Avoid processing duplicates inside the scraped payload.
		if _, ok := processed[game.ExternalId]; ok {
			skipped++
			continue
		}
		processed[game.ExternalId] = struct{}{}

		mappedGame := toGame(game)
		if _, err := svc.gameRepo.Upsert(ctx, &mappedGame); err != nil {
			return fmt.Errorf("SyncGames: upsert game %s: %w", game.ExternalId, err)
		}
		inserted++
	}
	log.Printf("SyncGames: inserted %d new games, skipped %d (malformed or duplicates)\n", inserted, skipped)
	return nil
}

func (svc *gameService) ProcessCompletedGames(ctx context.Context) error {
	unscraped, err := svc.gameRepo.FindUnscraped(ctx)
	if err != nil {
		return fmt.Errorf("ProcessCompletedGames: find unscraped %w", err)
	}
	skipped := 0
	for _, game := range unscraped {
		ref := scraper.GameRef{
			ExternalId:     game.ExternalGameId,
			ExternalSource: game.ExternalSource,
			GameType:       game.ExternalGameType,
			LeagueId:       game.ExternalLeagueId,
		}
		scraped, err := svc.stats.GetGameData(ctx, ref)
		if err != nil {
			log.Printf("Failed to fetch stats for %s, %v", game.ExternalGameId, err)
			skipped++
			continue
		}

		homeTeam := toTeam(scraped.HomeTeamId, scraped.ExternalSource, scraped.HomeTeamName)
		savedHome, err := svc.teamRepo.Upsert(ctx, &homeTeam)
		if err != nil {
			return fmt.Errorf("ProcessCompletedGames: upsert home team %s: %w", homeTeam.ExternalTeamId, err)
		}

		awayTeam := toTeam(scraped.AwayTeamId, scraped.ExternalSource, scraped.AwayTeamName)
		savedAway, err := svc.teamRepo.Upsert(ctx, &awayTeam)
		if err != nil {
			return fmt.Errorf("ProcessCompletedGames: upsert away team %s: %w", awayTeam.ExternalTeamId, err)
		}

		kickoff := scraped.KickoffTime
		game.KickoffTime = &kickoff

		if _, err := svc.gameRepo.Upsert(ctx, &game); err != nil {
			log.Printf("Failed to update kickoff time for game %s, %v", game.ExternalGameId, err)
			return fmt.Errorf("ProcessCompletedGames: update game kickoff %s: %w", game.ExternalGameId, err)
		}

		// Resolve which team UUID corresponds to each given player
		teamIdFor := func(externalId string) *uuid.UUID {
			switch externalId {
			case scraped.HomeTeamId:
				return &savedHome.Id
			case scraped.AwayTeamId:
				return &savedAway.Id
			default:
				return nil
			}
		}

		for _, stat := range scraped.Players {
			if stat.ExternalPlayerID == "" {
				log.Printf("Skipping %s in game %s due to missing ExternalPlayerID", stat.Name, game.ExternalGameId)
				continue // skip players with no external ID - we won't be able to link them to performances
			}

			var savedPlayer *models.Player
			existing := svc.playerRepo.FindByExternalID(ctx, stat.ExternalPlayerID)

			if existing != nil {
				// Cache hit: skip enrichment entirely. Idempotent — re-runs
				// don't burn API quota on players we've already seen.
				savedPlayer = existing
			} else {
				// New player: try enrichment, fall back to scrape context on
				// non-fatal failure so the performance row still lands.
				var player models.Player
				info, err := svc.stats.GetPlayerData(ctx, stat.ExternalPlayerID)
				switch {
				case err == nil:
					player = toPlayer(*info)
				case errors.Is(err, scraper.ErrPlayerPrivate):
					player = models.Player{
						ExternalPlayerId: stat.ExternalPlayerID,
						Name:             stat.Name,
						ExternalSource:   stat.ExternalSource,
						IsPrivate:        true,
					}
				case errors.Is(err, scraper.ErrUnauthorized), errors.Is(err, &scraper.ErrSessionExpired{}):
					return err
				default:
					// Transient enrichment failure: persist what we know so
					// the performance row isn't lost. Next run can retry the
					// enrichment because IsPrivate stays false.
					log.Printf("enrichment failed for %s, using scrape context: %v", stat.ExternalPlayerID, err)
					player = models.Player{
						ExternalPlayerId: stat.ExternalPlayerID,
						Name:             stat.Name,
						ExternalSource:   stat.ExternalSource,
					}
				}

				saved, err := svc.playerRepo.Upsert(ctx, &player)
				if err != nil {
					log.Printf("Failed to upsert player %s, %v", player.ExternalPlayerId, err)
					continue
				}
				savedPlayer = saved
			}

			// Always upsert the performance — never let player-side issues
			// silently drop a goalscorer.
			teamId := teamIdFor(stat.ExternalTeamID)
			performance := toPerformance(stat, game.Id, savedPlayer.Id, teamId)
			if _, err := svc.perfRepo.Upsert(ctx, &performance); err != nil {
				log.Printf("Failed to upsert performance for player %s in game %s, %v", savedPlayer.ExternalPlayerId, game.ExternalGameId, err)
				continue
			}
		}
		log.Printf("info: skipped %d players in game %s", skipped, game.ExternalGameId)
		if skipped == 0 {
			if err := svc.gameRepo.MarkScraped(ctx, game.Id); err != nil {
				return fmt.Errorf("ProcessCompletedGames: mark scraped %w", err)
			}
		}
		log.Printf("info: processed game %s (%s vs %s)", game.ExternalGameId, scraped.HomeTeamName, scraped.AwayTeamName)
	}
	return nil
}
