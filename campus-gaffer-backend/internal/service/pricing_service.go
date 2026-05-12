package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"context"
	"fmt"
	"log"
	"math"

	"github.com/google/uuid"
)

type PlayerPriceService interface {
	RecalculateValue(ctx context.Context, gameweek int) error
}

type playerPriceService struct {
	gamePointRepo repository.PlayerGamePointRepo
	priceRepo repository.PlayerPriceRepository
	playerRepo repository.PlayerRepository
	weightVer string
}

const (
	PriceMin = 4.0
	PriceMax = 10.0
)

func NewPlayerPricingService(
	gamePointRepo repository.PlayerGamePointRepo,
	priceRepo repository.PlayerPriceRepository,
	playerRepo repository.PlayerRepository,
) PlayerPriceService {
	return &playerPriceService{
		gamePointRepo: gamePointRepo,
		priceRepo: priceRepo,
		playerRepo: playerRepo,
		weightVer: WeightVerV1,
	}
}

func (svc *playerPriceService) RecalculateValue(ctx context.Context, gameweek int) error {
	players, err := svc.playerRepo.FindAll(ctx)
	if err != nil {
		return fmt.Errorf("RecalculatePrices: failed to retrieve all players %w\n", err)
	}
	type playerScore struct {
		id uuid.UUID
		avgPts float64
	}

	maxAvg := math.Inf(-1)
	// Hold the avg point tally for all players in the scores slice
	scores := make([]playerScore, 0, len(players))
	for _, p := range players {
		player_pts, err := svc.gamePointRepo.FindByPlayerIdUpTo(ctx, p.Id, svc.weightVer, gameweek)
		if err != nil {
			log.Printf("RecalculatePrices: skipping player %s %w\n", p.Id,  err)
			continue
		}

		if len(player_pts) == 0 {
			// No games played (start of season or brand-new player)
			// append zero score and skip subsequent computation
			scores = append(scores, playerScore{id: p.Id, avgPts: 0})
			continue
		}

		total_pts := 0
		for _, record := range player_pts {
			total_pts += record.Points
		}
		// if err != nil {
		// 	log.Printf("RecalculatePrices: couldn't compute point total for player %s %w\n", p.Id, err)
		// 	// Manual point computation path given that we have all points records anyway
		// 	total_pts = sum
		// }
		avgPts := float64(total_pts) / float64(len(player_pts))
		maxAvg = max(maxAvg, avgPts)
		// Add this player's avg points to the slice
		scores = append(scores, playerScore{id: p.Id, avgPts: avgPts})
	}
	
	// Normalization pass
	written := 0
	skipped := 0
	for _, score := range scores {
		var normalised float64
		if maxAvg > 0 {
			normalised = score.avgPts / maxAvg
		}
		price := PriceMin + normalised * (PriceMax - PriceMin)
		if score.id.String() == "a17481fb-1841-46a1-b0f5-b2f742f4c54d" {
			log.Printf("Useful data: MAX AVERAGE: %.f\n", maxAvg)
			log.Printf("My average score up to GW %d is %.3f. Normalized to: %.3f\n", gameweek, score.avgPts, price)
		}
		record := &models.PlayerPrice{
			PlayerId: score.id,
			Gameweek: gameweek,
			Price: price,
		}

		if _, err := svc.priceRepo.Upsert(ctx, record); err != nil {
			log.Printf("Failed to upsert price record for player %s %w\n", score.id, err)
			skipped++
			continue
		}
		written++
	}
	log.Printf("RecalculatePrices: gameweek %d. Wrote %d prices, skipped %d", gameweek, written, skipped)
	return nil
}