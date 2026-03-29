package scraper

import (
	"context"
)



type Scraper interface {
	Name() string
	GetCurrentSeasonGames(ctx context.Context) ([]ScrapedGame, error)
	GetGameData(ctx context.Context, externalId string) (*ScrapedGame, error)
	GetPlayerData(ctx context.Context, playerId string) (*ScrapedPlayerInfo, error)
}


type DiscoveryScraper interface {
    GetCurrentSeasonGames(ctx context.Context) ([]ScrapedGame, error)
}

type StatsScraper interface {
    GetGameData(ctx context.Context, externalId string) (*ScrapedGame, error)
}

// func RunAll(ctx context.Context, scrapers []Scraper) {
// 	// var result *
// 	num_players := 0
// 	for _, s := range scrapers {
// 		log.Printf("running scraper: %s", s.Name())
// 		res, err := s.GetCurrentSeasonGames(ctx)
// 		if err != nil {
// 			log.Printf("scraper %s failed: %v", s.Name(), err)
// 			continue
// 		}

// 		for _, game := range res {
// 			log.Println("Retrieving game data from", game.GameUrl)
// 			result, err := s.GetGameData(ctx, game)
// 			if err != nil || result == nil {
// 				log.Println(result)
// 			}
// 			num_players += len(result.Players)
// 		}

// 		// TODO: persist result using internal/database
// 	}

// 	// if result != nil {
// 	// 	fmt.Printf("[%s] scraped %d players\n", "IMLeagueScraper", num_players)
// 	// }

// }
