package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/season"
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

const (
	// OnFieldCount is the number of starters in a 6v6 squad.
	OnFieldCount = 6
	// BenchCount is the number of bench players in a 6v6 squad.
	BenchCount = 4
	// BudgetCap is the maximum total price at draft time.
	// Provisional: 10 players × avg £6.50. Needs product sign-off before launch.
	BudgetCap = 65.0
)

var (
	ErrWrongStarterCount = errors.New("squad must have exactly 6 starters")
	ErrWrongBenchCount   = errors.New("squad must have exactly 4 bench players")
	ErrDuplicatePlayer   = errors.New("squad contains duplicate players")
	ErrBudgetExceeded    = errors.New("squad exceeds budget cap")
	ErrSquadExists       = errors.New("user already has a squad this season")
	ErrSquadNotFound     = errors.New("squad not found")
	ErrDeadlinePassed    = errors.New("gameweek deadline has passed")
	ErrGameweekNotFound  = errors.New("gameweek not found in schedule")
)

type CreateSquadRequest struct {
	UserID   uint        `json:"user_id"`
	Gameweek int         `json:"gameweek"`
	Starters []uuid.UUID `json:"starters"`
	Bench    []uuid.UUID `json:"bench"`
}

type PlayerPointEntry struct {
	PlayerID uuid.UUID `json:"player_id"`
	IsBench  bool      `json:"is_bench"`
	Points   int       `json:"points"`
}

type SquadPointsResponse struct {
	SquadID     uuid.UUID          `json:"squad_id"`
	TotalPoints int                `json:"total_points"`
	Players     []PlayerPointEntry `json:"players"`
}

type SquadService interface {
	CreateSquad(ctx context.Context, req CreateSquadRequest) (*models.Squad, []models.SquadPlayer, error)
	GetSquad(ctx context.Context, id uuid.UUID) (*models.Squad, []models.SquadPlayer, error)
	GetSquadPoints(ctx context.Context, squadID uuid.UUID) (*SquadPointsResponse, error)
}

type squadService struct {
	squadRepo repository.SquadRepository
	priceRepo repository.PlayerPriceRepository
	gameRepo  repository.GameRepository
	loc       *time.Location
}

func NewSquadService(
	squadRepo repository.SquadRepository,
	priceRepo repository.PlayerPriceRepository,
	gameRepo repository.GameRepository,
	loc *time.Location,
) SquadService {
	if loc == nil {
		loc = time.UTC
	}
	return &squadService{squadRepo: squadRepo, priceRepo: priceRepo, gameRepo: gameRepo, loc: loc}
}

func (s *squadService) CreateSquad(ctx context.Context, req CreateSquadRequest) (*models.Squad, []models.SquadPlayer, error) {
	if len(req.Starters) != OnFieldCount {
		return nil, nil, ErrWrongStarterCount
	}
	if len(req.Bench) != BenchCount {
		return nil, nil, ErrWrongBenchCount
	}

	allPlayers := append(req.Starters, req.Bench...)
	seen := make(map[uuid.UUID]struct{}, len(allPlayers))
	for _, id := range allPlayers {
		if _, ok := seen[id]; ok {
			return nil, nil, ErrDuplicatePlayer
		}
		seen[id] = struct{}{}
	}

	if err := s.checkDeadline(ctx, req.Gameweek); err != nil {
		return nil, nil, err
	}

	existing, err := s.squadRepo.FindByUserID(ctx, req.UserID)
	if err != nil {
		return nil, nil, fmt.Errorf("CreateSquad: check existing: %w", err)
	}
	if existing != nil {
		return nil, nil, ErrSquadExists
	}

	var total float64
	for _, playerID := range allPlayers {
		price, err := s.priceRepo.GetEffectivePrice(ctx, playerID, req.Gameweek)
		if err != nil {
			return nil, nil, fmt.Errorf("CreateSquad: price lookup %s: %w", playerID, err)
		}
		total += price
	}
	if total > BudgetCap {
		return nil, nil, ErrBudgetExceeded
	}

	now := time.Now()
	squad := &models.Squad{
		UserID:      req.UserID,
		Gameweek:    req.Gameweek,
		BudgetSpent: total,
		LockedAt:    &now,
	}

	players := make([]models.SquadPlayer, 0, len(allPlayers))
	for _, id := range req.Starters {
		players = append(players, models.SquadPlayer{PlayerId: id, IsBench: false})
	}
	for _, id := range req.Bench {
		players = append(players, models.SquadPlayer{PlayerId: id, IsBench: true})
	}

	if err := s.squadRepo.Create(ctx, squad, players); err != nil {
		return nil, nil, fmt.Errorf("CreateSquad: persist: %w", err)
	}
	return squad, players, nil
}

// checkDeadline derives the cutoff for the requested gameweek from the
// regular-season schedule and returns ErrDeadlinePassed if it has elapsed.
func (s *squadService) checkDeadline(ctx context.Context, gameweekNum int) error {
	games, err := s.gameRepo.FindRegularSeason(ctx)
	if err != nil {
		return fmt.Errorf("checkDeadline: load schedule: %w", err)
	}
	schedule := season.RegularGameweeks(games, s.loc)
	for _, gw := range schedule {
		if gw.Number == gameweekNum {
			if time.Now().After(gw.Cutoff) {
				return ErrDeadlinePassed
			}
			return nil
		}
	}
	return ErrGameweekNotFound
}

func (s *squadService) GetSquad(ctx context.Context, id uuid.UUID) (*models.Squad, []models.SquadPlayer, error) {
	squad, players, err := s.squadRepo.FindByID(ctx, id)
	if err != nil {
		return nil, nil, fmt.Errorf("GetSquad: %w", err)
	}
	if squad == nil {
		return nil, nil, ErrSquadNotFound
	}
	return squad, players, nil
}

func (s *squadService) GetSquadPoints(ctx context.Context, squadID uuid.UUID) (*SquadPointsResponse, error) {
	squad, players, err := s.squadRepo.FindByID(ctx, squadID)
	if err != nil {
		return nil, fmt.Errorf("GetSquadPoints: %w", err)
	}
	if squad == nil {
		return nil, ErrSquadNotFound
	}

	playerIDs := make([]uuid.UUID, len(players))
	for i, p := range players {
		playerIDs[i] = p.PlayerId
	}

	totals, err := s.squadRepo.TotalPointsByPlayerIDs(ctx, playerIDs, WeightVerV1)
	if err != nil {
		return nil, fmt.Errorf("GetSquadPoints: fetch points: %w", err)
	}

	entries := make([]PlayerPointEntry, len(players))
	starterTotal := 0
	for i, p := range players {
		pts := totals[p.PlayerId]
		entries[i] = PlayerPointEntry{
			PlayerID: p.PlayerId,
			IsBench:  p.IsBench,
			Points:   pts,
		}
		if !p.IsBench {
			starterTotal += pts
		}
	}

	return &SquadPointsResponse{
		SquadID:     squad.Id,
		TotalPoints: starterTotal,
		Players:     entries,
	}, nil
}
