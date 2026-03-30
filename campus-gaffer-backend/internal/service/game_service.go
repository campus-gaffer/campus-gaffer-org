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
}

func NewGameService(
	discovery scraper.DiscoveryScraper,
	stats scraper.StatsScraper,
	gameRepo repository.GameRepository,
	perfRepo repository.PerformanceRepository,
	playerRepo repository.PlayerRepository,
) GameService {
	return &gameService{
		discovery:  discovery,
		stats:      stats,
		gameRepo:   gameRepo,
		perfRepo:   perfRepo,
		playerRepo: playerRepo,
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
		ExternalGameId: game.ExternalId,
		ExternalSource: game.ExternalSource,
		Status:         normaliseStatus(game.GameResultScore),
		IsScraped:      false,
		KickoffTime:    &game.KickoffTime,
		UpdatedAt:      time.Now(),
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
		ExternalPlayerId: s.ExternalPlayerID,
		ExternalSource:   scraper.EXTERNAL_SOURCE,
		TeamId:           teamID,
		GameId:           gameID,
		Goals:            uint(s.Goals),
		KickoffTime:      &s.KickoffTime,
		IsMVP:            s.IsMVP,
		PlayedGame:       s.GamePlayed,
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

		// TeamId resolution requires TeamRepository which is not yet implemented.
		// Performance rows are written with null TeamId until team resolution is added.
		var inferredTeamId *uuid.UUID

		for _, player := range results.Players {
			if player.ExternalPlayerID == "" {
				continue
			}
			p := toPlayer(player)
			_, err := svc.playerRepo.Upsert(ctx, &p)
			if err != nil {
				return err
			}

			perf := toPerformance(player, game.Id, inferredTeamId)

			if _, err := svc.perfRepo.Upsert(ctx, &perf); err != nil {
				return err
			}
		}
		
		if err := svc.gameRepo.MarkScraped(ctx, game.Id); err != nil {
			return err
		}
	}
	return nil
}
