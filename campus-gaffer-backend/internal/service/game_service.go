package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/scraper"
	"context"
	"log"
)

type GameService interface {
	SyncGames(ctx context.Context, scraped []scraper.ScrapedGame) error
	ProcessCompletedGames(ctx context.Context) error
}

type gameService struct {
	discovery scraper.DiscoveryScraper
	stats scraper.StatsScraper
	gameRepo repository.GameRepository
}


func NewGameService(
	discovery scraper.DiscoveryScraper,
	stats scraper.StatsScraper,
	gameRepo repository.GameRepository,
) GameService {
	return &gameService{
		discovery: discovery,
		stats: stats,
		gameRepo: gameRepo,
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
		Status: normaliseStatus(game.GameResultScore),
		IsScraped: false,
		KickoffTime: &game.KickoffTime,
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
		_, err := svc.stats.GetGameData(ctx, game.ExternalGameId)
		if err != nil {
			log.Printf("Failed to fetch stats for %s, %v", game.ExternalGameId, err)
			continue
		}
		//TODO: persist result using player perf repository
		
		if err := svc.gameRepo.MarkScraped(ctx, game.Id); err != nil {
			return err
		}
	}
	return nil
}