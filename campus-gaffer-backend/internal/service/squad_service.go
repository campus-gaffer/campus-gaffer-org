package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/season"
	"context"
	"errors"
	"fmt"
	"log"
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
	UserID   string      `json:"user_id"`
	Gameweek int         `json:"gameweek"`
	Starters []uuid.UUID `json:"starters"`
	Bench    []uuid.UUID `json:"bench"`
}

type PointBreakdown struct {
	AppearancePts int `json:"appearance_pts"`
	Goals         int `json:"goals"`
	GoalPts       int `json:"goal_pts"`
	WinPts        int `json:"win_pts"`
	DrawPts       int `json:"draw_pts"`
	MvpPts        int `json:"mvp_pts"`
}

type PlayerPointEntry struct {
	PlayerID  uuid.UUID       `json:"player_id"`
	Name      string          `json:"name"`
	Team      string          `json:"team"`
	IsBench   bool            `json:"is_bench"`
	Points    int             `json:"points"`
	Breakdown *PointBreakdown `json:"breakdown,omitempty"`
}

type SquadPointsResponse struct {
	SquadID     uuid.UUID          `json:"squad_id"`
	TotalPoints int                `json:"total_points"`
	Players     []PlayerPointEntry `json:"players"`
}

type SquadService interface {
	CreateSquad(ctx context.Context, req CreateSquadRequest) (*models.Squad, []models.SquadPlayer, error)
	GetSquad(ctx context.Context, id uuid.UUID) (*models.Squad, []models.SquadPlayer, error)
	GetSquadByUserID(ctx context.Context, userID string) (*models.Squad, error)
	GetSquadPoints(ctx context.Context, squadID uuid.UUID) (*SquadPointsResponse, error)
}

type squadService struct {
	squadRepo  repository.SquadRepository
	priceRepo  repository.PlayerPriceRepository
	gameRepo   repository.GameRepository
	playerRepo repository.PlayerRepository
	perfRepo   repository.PerformanceRepository
	loc        *time.Location
}

func NewSquadService(
	squadRepo repository.SquadRepository,
	priceRepo repository.PlayerPriceRepository,
	gameRepo repository.GameRepository,
	playerRepo repository.PlayerRepository,
	perfRepo repository.PerformanceRepository,
	loc *time.Location,
) SquadService {
	if loc == nil {
		loc = time.UTC
	}
	return &squadService{squadRepo: squadRepo, priceRepo: priceRepo, gameRepo: gameRepo, playerRepo: playerRepo, perfRepo: perfRepo, loc: loc}
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

	// if err := s.checkDeadline(ctx, req.Gameweek); err != nil {
	// 	return nil, nil, err
	// }

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

func (s *squadService) GetSquadByUserID(ctx context.Context, userID string) (*models.Squad, error) {
	squad, err := s.squadRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("GetSquadByUserID: %w", err)
	}
	if squad == nil {
		return nil, ErrSquadNotFound
	}
	return squad, nil
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

	// Resolve display name and primary team per player. Both are non-fatal:
	// on error the entry just carries an empty name/team rather than failing
	// the whole points request.
	nameByID := map[uuid.UUID]string{}
	if s.playerRepo != nil {
		if all, perr := s.playerRepo.FindAll(ctx); perr == nil {
			for _, pl := range all {
				nameByID[pl.Id] = pl.Name
			}
		} else {
			log.Printf("GetSquadPoints: resolve names: %v", perr)
		}
	}
	teamByID := map[uuid.UUID]string{}
	if s.playerRepo != nil {
		if t, terr := s.playerRepo.PrimaryTeams(ctx); terr == nil {
			teamByID = t
		} else {
			log.Printf("GetSquadPoints: resolve teams: %v", terr)
		}
	}

	breakdownByPlayer := map[uuid.UUID]*PointBreakdown{}
	if s.perfRepo != nil {
		perfs, perr := s.perfRepo.FindByPlayerIDs(ctx, playerIDs)
		if perr != nil {
			log.Printf("GetSquadPoints: fetch performances: %v", perr)
		} else {
			// Collect unique game IDs so we can resolve outcomes per game.
			gameIDSet := map[uuid.UUID]struct{}{}
			for _, pf := range perfs {
				gameIDSet[pf.GameId] = struct{}{}
			}
			// outcomes[gameId][teamId] = Outcome
			outcomes := map[uuid.UUID]map[uuid.UUID]Outcome{}
			for gid := range gameIDSet {
				full, ferr := s.perfRepo.FindByGameId(ctx, gid)
				if ferr != nil {
					log.Printf("GetSquadPoints: fetch game perfs %s: %v", gid, ferr)
					continue
				}
				outcomes[gid] = outcomesByTeam(full)
			}
			for _, pf := range perfs {
				bd := breakdownByPlayer[pf.PlayerId]
				if bd == nil {
					bd = &PointBreakdown{}
					breakdownByPlayer[pf.PlayerId] = bd
				}
				if !pf.GamePlayed {
					continue
				}
				bd.AppearancePts += WeightsV1.Appearance
				bd.Goals += pf.Goals
				bd.GoalPts += pf.Goals * WeightsV1.Goal
				if pf.IsMVP {
					bd.MvpPts += WeightsV1.MVP
				}
				if pf.TeamId != nil {
					if gameOutcomes, ok := outcomes[pf.GameId]; ok {
						switch gameOutcomes[*pf.TeamId] {
						case OutcomeWin:
							bd.WinPts += WeightsV1.Win
						case OutcomeDraw:
							bd.DrawPts += WeightsV1.Draw
						}
					}
				}
			}
		}
	}

	entries := make([]PlayerPointEntry, len(players))
	starterTotal := 0
	for i, p := range players {
		pts := totals[p.PlayerId]
		entries[i] = PlayerPointEntry{
			PlayerID:  p.PlayerId,
			Name:      nameByID[p.PlayerId],
			Team:      teamByID[p.PlayerId],
			IsBench:   p.IsBench,
			Points:    pts,
			Breakdown: breakdownByPlayer[p.PlayerId],
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
