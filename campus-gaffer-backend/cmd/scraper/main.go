package main

import (
	"campus-gaffer-backend/internal/config"
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/scraper"
	"campus-gaffer-backend/internal/service"
	"context"
	"log"
)

func main() {
	log.Println("starting campus gaffer scraper")
	ctx := context.Background()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}
	db := database.Connect(cfg.DBUri)
	s := scraper.NewIMLeagueScraper(cfg.Cookies)
	svc := service.NewGameService(
		s, s,
		repository.NewGameRepo(db),
		repository.NewPlayerPerfRepo(db),
		repository.NewPlayerRepo(db),
		repository.NewTeamRepo(db),
	)
	teams, err := s.GetLeagueTeams(ctx)
	if err != nil {
		log.Fatal(err)
	}
	for _, team := range teams {
		games, err := s.GetCurrentSeasonGames(ctx, team.TeamId)
		if err != nil {
			log.Fatal(err)
		}

		if err := svc.SyncGames(ctx, games); err != nil {
			log.Fatal(err)
		}
	}

	if err := svc.ProcessCompletedGames(ctx); err != nil {
		log.Fatal(err)
	}

	log.Println("scraping complete")
}
