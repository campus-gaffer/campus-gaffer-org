package scraper

import (
	"campus-gaffer-backend/internal/models"
	"context"
	"fmt"
	"log"
	"os"
)

type Result struct {
	Players []models.PlayerData
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
	for _, s := range scrapers {
		log.Printf("running scraper: %s", s.Name())
		res, err := s.GetCurrentSeasonGames(ctx)
		if err != nil {
			log.Printf("scraper %s failed: %v", s.Name(), err)
			continue
		}
		os.Exit(1)
		for _, game := range res {
			log.Println("Retrieving game data from", game.GameUrl)
			result, err = s.GetGameData(ctx, game)
			if err != nil || result == nil {
				log.Println(result)
			}
		}

		//result, err := s.Scrape(ctx)
		//if err != nil {
		//	log.Printf("scraper %s failed: %v", s.Name(), err)
		//	continue
		//}
		//
		//team := result.Players[0].Team
		// for _, p := range result.Players {
		// 	if p.Team != team {
		// 		fmt.Printf("\n  - %s | %s | %s\n", p.Name, p.Team, p.Sport)
		// 	} else {
		// 		fmt.Printf("  - %s | %s | %s\n", p.Name, p.Team, p.Sport)
		// 	}
		// 	team = p.Team
		// }
		// TODO: persist result using internal/database
	}

	if result != nil {
		fmt.Printf("[%s] scraped %d players\n", "IMLeagueScraper", len(result.Players))
	}

}
