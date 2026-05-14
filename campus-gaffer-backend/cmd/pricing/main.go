package main

import (
	"campus-gaffer-backend/internal/config"
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/season"
	"campus-gaffer-backend/internal/service"
	"context"
	"flag"
	"log"
	"time"
)

// LeagueTZ is the timezone used to bucket games into gameweeks. Will
// move to per-league config when we host more than one league.
const LeagueTZ = "America/Winnipeg"

func main() {
	gameweek := flag.Int("gameweek", 0, "Gameweek number to price (required, >= 1)")
	flag.Parse()

	if *gameweek < 1 {
		log.Fatal("pricing: -gameweek must be >= 1")
	}

	loc, err := time.LoadLocation(LeagueTZ)
	if err != nil {
		log.Fatalf("pricing: load timezone %q: %v", LeagueTZ, err)
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("pricing: config load: %v", err)
	}
	db := database.Connect(cfg.DBUri)
	ctx := context.Background()

	games, err := repository.NewGameRepo(db).FindRegularSeason(ctx)
	if err != nil {
		log.Fatalf("pricing: load regular-season games: %v", err)
	}
	schedule := season.RegularGameweeks(games, loc)
	if len(schedule) == 0 {
		log.Fatal("pricing: no regular-season games found; schedule is empty")
	}

	var gw season.Gameweek
	for _, candidate := range schedule {
		if candidate.Number == *gameweek {
			gw = candidate
			break
		}
	}
	if gw.Number == 0 {
		log.Fatalf("pricing: gameweek %d is not in the schedule (have GW1..GW%d)", *gameweek, schedule[len(schedule)-1].Number)
	}
	log.Printf("pricing: GW%d cutoff %s", gw.Number, gw.Cutoff.Format(time.RFC3339))

	svc := service.NewPlayerPricingService(
		repository.NewPlayerGamePointRepo(db),
		repository.NewPlayerPriceRepo(db),
	)
	if err := svc.ComputeGameweekPrices(ctx, gw.Number, gw.Cutoff); err != nil {
		log.Fatalf("pricing: %v", err)
	}
}
