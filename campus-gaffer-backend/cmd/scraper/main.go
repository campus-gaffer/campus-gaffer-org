package main

import (
	"campus-gaffer-backend/internal/scraper"
	"context"
	"log"
)

func main() {
	log.Println("starting campus gaffer scraper")

	// Register all scrapers here. Swap StubScraper for real
	// implementations as you build them.
	scrapers := []scraper.Scraper{
		//&scraper.StubScraper{},
		scraper.NewIMLeagueScraper(),
	}

	ctx := context.Background()
	scraper.RunAll(ctx, scrapers)

	log.Println("scraping complete")
}
