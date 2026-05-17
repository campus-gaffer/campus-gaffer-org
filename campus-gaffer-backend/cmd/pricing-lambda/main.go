package main

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"campus-gaffer-backend/internal/config"
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/season"
	"campus-gaffer-backend/internal/service"

	"github.com/aws/aws-lambda-go/lambda"
)


var (
	gameRepo  repository.GameRepository
	priceRepo repository.PlayerPriceRepository
	pricer    service.PlayerPriceService
	leagueLoc *time.Location

	initOnce sync.Once
	initErr  error
)

// setup runs once on the first warm invocation. Lazy by design so that
// initialisation errors surface in CloudWatch as handler failures rather
// than as opaque container-startup timeouts (same pattern as the scraper
// lambda at cmd/lambda).
func setup(ctx context.Context) error {
	cfg, err := config.LoadFromSSM(ctx)
	if err != nil {
		log.Fatalf("unable to load SDK config: %v", err)
	}

	initOnce.Do(func() {
		log.Println("pricing-lambda setup: loading timezone")
		loc, err := time.LoadLocation(cfg.LeagueTz)
		if err != nil {
			initErr = fmt.Errorf("load timezone %q: %w", cfg.LeagueTz, err)
			return
		}
		leagueLoc = loc

		log.Println("pricing-lambda setup: fetching config from SSM")
		cfg, err := config.LoadFromSSM(ctx)
		if err != nil {
			initErr = err
			return
		}

		log.Println("pricing-lambda setup: connecting to database")
		db := database.Connect(cfg.DBUri)

		gameRepo = repository.NewGameRepo(db)
		priceRepo = repository.NewPlayerPriceRepo(db)
		pricer = service.NewPlayerPricingService(
			repository.NewPlayerGamePointRepo(db),
			priceRepo,
		)
		log.Println("pricing-lambda setup: ready")
	})
	return initErr
}

// handler is the catch-up loop: price every closed gameweek that hasn't
// been priced yet. Insert-once at the repo layer makes this idempotent,
// but we skip already-priced weeks via MaxPricedGameweek to avoid
// running the aggregate on rows we know are frozen.
func handler(ctx context.Context) error {
	if err := setup(ctx); err != nil {
		return err
	}

	games, err := gameRepo.FindRegularSeason(ctx)
	if err != nil {
		return fmt.Errorf("load regular-season games: %w", err)
	}
	schedule := season.RegularGameweeks(games, leagueLoc)
	if len(schedule) == 0 {
		log.Println("pricing-lambda: no regular-season games in DB; nothing to price")
		return nil
	}

	maxPriced, err := priceRepo.MaxPricedGameweek(ctx)
	if err != nil {
		return fmt.Errorf("max priced gameweek: %w", err)
	}

	now := time.Now()
	processed := 0
	for _, gw := range schedule {
		if gw.Number <= maxPriced {
			continue
		}
		if gw.Cutoff.After(now) {
			break // chronological — nothing after this is closed either
		}
		log.Printf("pricing-lambda: computing GW%d (cutoff %s)", gw.Number, gw.Cutoff.Format(time.RFC3339))
		if err := pricer.ComputeGameweekPrices(ctx, gw.Number, gw.Cutoff); err != nil {
			return fmt.Errorf("GW%d: %w", gw.Number, err)
		}
		processed++
	}
	log.Printf("pricing-lambda: %d gameweek(s) processed", processed)
	return nil
}

func main() {
	lambda.Start(handler)
}
