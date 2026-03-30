package scraper

import (
	"context"
)



type Scraper interface {
	Name() string
	// GetCurrentSeasonGames(ctx context.Context) ([]ScrapedGameItem, error)
	// GetGameData(ctx context.Context, externalId string) (*ScrapedGame, error)
	// GetPlayerData(ctx context.Context, playerId string) (*ScrapedPlayerInfo, error)
}


type DiscoveryScraper interface {
    GetCurrentSeasonGames(ctx context.Context) ([]ScrapedGame, error)
}

type StatsScraper interface {
    GetGameData(ctx context.Context, externalId string) (*ScrapedGame, error)
}

