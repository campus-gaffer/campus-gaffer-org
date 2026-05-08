package main

import (
	"context"
	"log"

	"campus-gaffer-backend/internal/config"
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/pipeline"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/scraper"
	"campus-gaffer-backend/internal/service"

	"github.com/aws/aws-lambda-go/lambda"
)

var runner *pipeline.Runner

func init() {
	ctx := context.Background()

	cfg, err := config.LoadFromSSM(ctx)
	if err != nil {
		log.Fatalf("lambda init: load config: %v", err)
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
	runner = pipeline.NewRunner(s, svc)
}

func handler(ctx context.Context) error {
	log.Println("lambda: pipeline run starting")
	if err := runner.Run(ctx); err != nil {
		return err
	}
	log.Println("lambda: pipeline run complete")
	return nil
}

func main() {
	lambda.Start(handler)
}
