package scraper

import (
	"context"
	"fmt"
	"log"
)

type Result struct {
	Players []ScrapedPlayerData
	Score   string
}

type Scraper interface {
	Name() string
	Scrape(ctx context.Context) (*Result, error)
	GetCurrentSeasonGames(ctx context.Context) ([]ScrapedGameItem, error)
	GetGameData(ctx context.Context, game ScrapedGameItem) (*Result, error)
	GetPlayerData(ctx context.Context, playerId string) (*ScrapedPlayerInfo, error)
}

func RunAll(ctx context.Context, scrapers []Scraper) {
	var result *Result
	num_players := 0
	for _, s := range scrapers {
		log.Printf("running scraper: %s", s.Name())
		res, err := s.GetCurrentSeasonGames(ctx)
		if err != nil {
			log.Printf("scraper %s failed: %v", s.Name(), err)
			continue
		}

		for _, game := range res {
			log.Println("Retrieving game data from", game.GameUrl)
			result, err = s.GetGameData(ctx, game)
			if err != nil || result == nil {
				log.Println(result)
			}
			num_players += len(result.Players)
		}

		// TODO: persist result using internal/database
	}

	if result != nil {
		fmt.Printf("[%s] scraped %d players\n", "IMLeagueScraper", num_players)
	}

}
