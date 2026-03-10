package scraper

import (
	"campus-gaffer-backend/internal/models"
	"context"
	"fmt"
	"log"
)

type Result struct {
	Players []models.PlayerData
}

type Scraper interface {
	Name() string
	Scrape(ctx context.Context) (*Result, error)
}

func RunAll(ctx context.Context, scrapers []Scraper) {
	for _, s := range scrapers {
		log.Printf("running scraper: %s", s.Name())

		result, err := s.Scrape(ctx)
		if err != nil {
			log.Printf("scraper %s failed: %v", s.Name(), err)
			continue
		}

		fmt.Printf("[%s] scraped %d players\n", s.Name(), len(result.Players))
		team := result.Players[0].Team
		for _, p := range result.Players {
			if p.Team != team {
				fmt.Printf("\n  - %s | %s | %s\n", p.Name, p.Team, p.Sport)
			} else {
				fmt.Printf("  - %s | %s | %s\n", p.Name, p.Team, p.Sport)
			}
			team = p.Team
		}

		// TODO: persist result using internal/database
	}
}
