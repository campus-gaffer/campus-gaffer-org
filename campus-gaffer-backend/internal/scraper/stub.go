package scraper

import (
	"campus-gaffer-backend/internal/models"
	"context"
)

// StubScraper is a fake implementation for development and testing.
// Replace this with a real scraper (e.g., IMLeaguesScraper) once
// you identify the target site and its HTML structure.
type StubScraper struct{}

func (s *StubScraper) Name() string {
	return "stub"
}

func (s *StubScraper) Scrape(ctx context.Context) (*Result, error) {
	// Return fake data so you can build the pipeline end-to-end
	// before worrying about real HTTP requests and HTML parsing.
	return &Result{
		Players: []models.PlayerData{
			{Name: "Alice", Team: "Floor 3", Sport: "Basketball"},
			{Name: "Bob", Team: "CS Majors", Sport: "Soccer"},
			{Name: "Charlie", Team: "Floor 3", Sport: "Basketball"},
		},
	}, nil
}
