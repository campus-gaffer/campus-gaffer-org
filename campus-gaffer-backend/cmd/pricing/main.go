package main

import (
	"campus-gaffer-backend/internal/config"
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/service"
	"context"
	"flag"
	"log"
	"time"
)

func main() {
	gameweek := flag.Int("gameweek", 0, "Gameweek number to price (required, >= 1)")
	cutoffStr := flag.String("cutoff", "", "Kickoff cutoff as RFC3339 (e.g. 2026-05-11T23:59:59Z). Defaults to now.")
	flag.Parse()

	if *gameweek < 1 {
		log.Fatal("pricing: -gameweek must be >= 1")
	}

	cutoff := time.Now().UTC()
	if *cutoffStr != "" {
		t, err := time.Parse(time.RFC3339, *cutoffStr)
		if err != nil {
			log.Fatalf("pricing: -cutoff must be RFC3339: %v", err)
		}
		cutoff = t
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("pricing: config load: %v", err)
	}
	db := database.Connect(cfg.DBUri)

	svc := service.NewPlayerPricingService(
		repository.NewPlayerGamePointRepo(db),
		repository.NewPlayerPriceRepo(db),
	)

	ctx := context.Background()
	if err := svc.ComputeGameweekPrices(ctx, *gameweek, cutoff); err != nil {
		log.Fatalf("pricing: %v", err)
	}
}
