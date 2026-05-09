package main

import (
	"context"
	"log"
	"sync"

	"campus-gaffer-backend/internal/config"
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/pipeline"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/scraper"
	"campus-gaffer-backend/internal/service"

	"github.com/aws/aws-lambda-go/lambda"
)

// Heavy setup runs lazily on the first invocation rather than in init() so
// the binary reaches lambda.Start() fast and any setup error surfaces in
// CloudWatch instead of as an opaque container-startup timeout.
var (
	runner   *pipeline.Runner
	initOnce sync.Once
	initErr  error
)

func setup(ctx context.Context) error {
	initOnce.Do(func() {
		log.Println("lambda setup: fetching config from SSM")
		cfg, err := config.LoadFromSSM(ctx)
		if err != nil {
			initErr = err
			return
		}

		log.Println("lambda setup: connecting to database")
		db := database.Connect(cfg.DBUri)

		log.Println("lambda setup: building pipeline")
		s := scraper.NewIMLeagueScraper(cfg.Cookies)
		svc := service.NewGameService(
			s, s,
			repository.NewGameRepo(db),
			repository.NewPlayerPerfRepo(db),
			repository.NewPlayerRepo(db),
			repository.NewTeamRepo(db),
		)
		runner = pipeline.NewRunner(s, svc)
		log.Println("lambda setup: ready")
	})
	return initErr
}

func handler(ctx context.Context) error {
	if err := setup(ctx); err != nil {
		return err
	}
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
