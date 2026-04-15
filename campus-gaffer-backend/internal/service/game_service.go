package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/scraper"
	"context"
	"log"
	"time"

	"github.com/google/uuid"
)

type GameService interface {
	SyncGames(ctx context.Context, scraped []scraper.ScrapedGame) error
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

func toGame(game scraper.ScrapedGame) models.Game {
	return models.Game{
		ExternalGameId:     game.ExternalId,
		ExternalSource:     game.ExternalSource,
		HomeTeamExternalId: game.HomeTeamId,
		AwayTeamExternalId: game.OpponentTeamId,
		Status:             normaliseStatus(game.GameResultScore),
		IsScraped:          false,
	}
}

func toPlayer(player scraper.ScrapedPlayerStat) models.Player {
	return models.Player{
		ExternalId:     player.ExternalPlayerID,
		ExternalSource: player.ExternalSource,
		Name:           player.Name,
		// BirthDate:      &player.BirthDate,
		// Age:            player.Age,
		// Gender:         &player.Gender,
		// YearOfStudy:    &player.YearOfStudy,
		// GraduationYear: &player.GraduationYear,
	}
}

func toPerformance(
	s scraper.ScrapedPlayerStat,
	gameID uuid.UUID,
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

func toTeam(externaId, name string) models.Team {
	return models.Team{
		ExternalTeamId: externaId,
		ExternalSource: scraper.EXTERNAL_SOURCE,
		Name:           name,
	}
}

func (svc *gameService) SyncGames(ctx context.Context, scraped []scraper.ScrapedGame) error {
	for _, game := range scraped {
		mappedGame := toGame(game)
		existing, err := svc.gameRepo.FindByExternalId(ctx, mappedGame.ExternalGameId, mappedGame.ExternalSource)
		if err != nil {
			return err
		}

		if existing == nil {
			_, err := svc.gameRepo.Upsert(ctx, &mappedGame)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func (svc *gameService) ProcessCompletedGames(ctx context.Context) error {
	unscraped, err := svc.gameRepo.FindUnscraped(ctx)
	if err != nil {
		return err
	}

	for _, game := range unscraped {
		results, err := svc.stats.GetGameData(ctx, game.ExternalGameId)
		if err != nil {
			log.Printf("Failed to fetch stats for %s, %v", game.ExternalGameId, err)
			continue
		}

		homeTeam := toTeam(scraped.HomeTeamId, scraped.HomeTeamName)
		savedHome, err := svc.teamRepo.Upsert(ctx, &homeTeam)
		if err != nil {
			return fmt.Errorf("ProcessCompletedGames: upsert home team %s: %w", homeTeam.ExternalTeamId, err)
		}

		awayTeam := toTeam(scraped.AwayTeamId, scraped.AwayTeamName)
		savedAway, err := svc.teamRepo.Upsert(ctx, &awayTeam)
		if err != nil {
			return fmt.Errorf("ProcessCompletedGames: upsert away team %s: %w", awayTeam.ExternalTeamId, err)
		}

		kickoff := scraped.KickoffTime
		game.KickoffTime = &kickoff

		if _, err := svc.gameRepo.Upsert(ctx, &game); err != nil {
			fmt.Printf("Failed to update kickoff time for game %s, %v", game.ExternalGameId, err)
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
				continue // skip players with no external ID - we won't be able to link them to performances
			}
			info, err := svc.stats.GetPlayerData(ctx, stat.ExternalPlayerID)
			if err != nil {
				log.Printf("Failed to fetch player info for %s, %v", stat.ExternalPlayerID, err)
				continue
			}

			player := toPlayer(*info)
			savedPlayer, err := svc.playerRepo.Upsert(ctx, &player)

			if err != nil {
				log.Printf("Failed to upsert player %s, %v", player.ExternalPlayerId, err)
				continue
			}

			teamId := teamIdFor(stat.ExternalTeamID)
			performance := toPerformance(stat, game.Id, savedPlayer.Id, teamId)
			if _, err := svc.perfRepo.Upsert(ctx, &performance); err != nil {
				log.Printf("Failed to upsert performance for player %s in game %s, %v", player.ExternalPlayerId, game.ExternalGameId, err)
				continue
			}
		}
		
		if err := svc.gameRepo.MarkScraped(ctx, game.Id); err != nil {
			return fmt.Errorf("ProcessCompletedGames: mark scraped %w", err)
		}
		log.Printf("info: processed game %s (%s vs %s)", game.ExternalGameId, scraped.HomeTeamName, scraped.AwayTeamName)
	}
	return nil
}
