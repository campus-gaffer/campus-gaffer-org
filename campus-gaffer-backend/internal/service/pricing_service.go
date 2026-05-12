package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"context"
	"fmt"
	"log"
	"time"
)

type PlayerPriceService interface {
	// ComputeGameweekPrices computes one price per player who has
	// at least one points row with kickoff_time <= cutoff at the current
	// weight_ver, and inserts them at the (player_id, gameweek) grain.
	// Insert-once: running again for the same gameweek is a no-op.
	ComputeGameweekPrices(ctx context.Context, gameweek int, cutoff time.Time) error
}

type playerPriceService struct {
	gamePointRepo repository.PlayerGamePointRepo
	priceRepo     repository.PlayerPriceRepository
	weightVer     string
}

const (
	PriceMin = 4.0
	PriceMax = 10.0
)

func NewPlayerPricingService(
	gamePointRepo repository.PlayerGamePointRepo,
	priceRepo repository.PlayerPriceRepository,
) PlayerPriceService {
	return &playerPriceService{
		gamePointRepo: gamePointRepo,
		priceRepo:     priceRepo,
		weightVer:     WeightVerV1,
	}
}

func (svc *playerPriceService) ComputeGameweekPrices(ctx context.Context, gameweek int, cutoff time.Time) error {
	avgs, err := svc.gamePointRepo.AvgPointsByPlayer(ctx, svc.weightVer, cutoff)
	if err != nil {
		return fmt.Errorf("ComputeGameweekPrices: aggregate failed: %w", err)
	}
	if len(avgs) == 0 {
		log.Printf("ComputeGameweekPrices: gameweek %d, no qualifying point rows; nothing written", gameweek)
		return nil
	}

	maxAvg := 0.0
	for _, a := range avgs {
		if a.AvgPts > maxAvg {
			maxAvg = a.AvgPts
		}
	}
	if maxAvg <= 0 {
		log.Printf("ComputeGameweekPrices: gameweek %d, max avg <= 0; nothing written", gameweek)
		return nil
	}

	records := make([]models.PlayerPrice, 0, len(avgs))
	for _, a := range avgs {
		price := PriceMin + (a.AvgPts/maxAvg)*(PriceMax-PriceMin)
		if price > PriceMax {
			price = PriceMax
		} else if price < PriceMin {
			price = PriceMin
		}
		records = append(records, models.PlayerPrice{
			PlayerId: a.PlayerID,
			Gameweek: gameweek,
			Price:    price,
		})
	}

	inserted, err := svc.priceRepo.InsertBatch(ctx, records)
	if err != nil {
		return fmt.Errorf("ComputeGameweekPrices: batch insert failed: %w", err)
	}
	log.Printf("ComputeGameweekPrices: gameweek %d, %d players priced, %d new rows (rest already frozen)", gameweek, len(records), inserted)
	return nil
}
