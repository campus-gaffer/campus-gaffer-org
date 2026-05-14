package main

import (
	"campus-gaffer-backend/internal/config"
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/pipeline"
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
	gameRepo := repository.NewGameRepo(db)
	perfRepo := repository.NewPlayerPerfRepo(db)
	pointsRepo := repository.NewPlayerGamePointRepo(db)
	svc := service.NewGameService(
		s, s,
		gameRepo,
		perfRepo,
		repository.NewPlayerRepo(db),
		repository.NewTeamRepo(db),
	)
	scoring := service.NewScoringService(gameRepo, perfRepo, pointsRepo)

	if err := pipeline.NewRunner(s, svc, scoring).Run(ctx); err != nil {
		log.Fatal(err)
	}
	log.Println("scraping complete")
}
