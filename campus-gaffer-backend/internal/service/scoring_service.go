package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
)

// Weights captures the v1.0 fantasy scoring weights.
type Weights struct {
	Appearance int
	Goal       int
	MVP        int
	Win        int
	Draw       int
}

// WeightsV1 are the locked v1.0 weights. To change weights, bump WeightVer
// and re-run the scoring service over historical PlayerPerformance rows.
var WeightsV1 = Weights{
	Appearance: 2,
	Goal:       4,
	MVP:        3,
	Win:        2,
	Draw:       1,
}

const WeightVerV1 = "v1.0"

// Outcome represents a team's result for a single game. Derived at scoring
// time from SUM(player_performances.goals) per team, no home/away
// distinction is needed because Win/Draw/Loss bonuses don't depend on it.
type Outcome int

const (
	OutcomeUnknown Outcome = iota
	OutcomeWin
	OutcomeDraw
	OutcomeLoss
)

// score is the pure scoring function, trivially testable.
func score(perf models.PlayerPerformance, outcome Outcome, w Weights) int {
	if !perf.GamePlayed {
		return 0
	}
	pts := w.Appearance + perf.Goals*w.Goal
	if perf.IsMVP {
		pts += w.MVP
	}
	switch outcome {
	case OutcomeWin:
		pts += w.Win
	case OutcomeDraw:
		pts += w.Draw
	}
	return pts
}

// outcomesByTeam derives Win/Draw/Loss for each team in a game from the
// player performances. Returns a map of team_id → Outcome. Performances
// with a nil TeamId are excluded from the goal sum (we can't attribute
// them to a side).
//
// If only one team has performances or both teams have the same goal
// total, both teams (or the lone team) get OutcomeDraw, neither side
// wins outright.
func outcomesByTeam(perfs []models.PlayerPerformance) map[uuid.UUID]Outcome {
	goals := make(map[uuid.UUID]int)
	for _, p := range perfs {
		if p.TeamId == nil {
			continue
		}
		goals[*p.TeamId] += p.Goals
	}

	out := make(map[uuid.UUID]Outcome, len(goals))
	switch len(goals) {
	case 0:
		// no team-attributed perfs; nothing to outcome
	case 1:
		// single team
		for tid := range goals {
			out[tid] = OutcomeDraw
		}
	default:
		// 2+ teams
		var maxGoals int
		for _, g := range goals {
			if g > maxGoals {
				maxGoals = g
			}
		}
		// count teams at max to detect a draw
		atMax := 0
		for _, g := range goals {
			if g == maxGoals {
				atMax++
			}
		}
		for tid, g := range goals {
			switch {
			case atMax > 1:
				out[tid] = OutcomeDraw
			case g == maxGoals:
				out[tid] = OutcomeWin
			default:
				out[tid] = OutcomeLoss
			}
		}
	}
	return out
}

// ScoringService computes per-player fantasy points for completed,
// scraped games and persists them to player_game_points.
type ScoringService interface {
	ScoreCompletedGames(ctx context.Context) error
}

type scoringService struct {
	gameRepo   repository.GameRepository
	perfRepo   repository.PerformanceRepository
	pointsRepo repository.PlayerGamePointRepo
	weights    Weights
	weightVer  string
}

func NewScoringService(
	gameRepo repository.GameRepository,
	perfRepo repository.PerformanceRepository,
	pointsRepo repository.PlayerGamePointRepo,
) ScoringService {
	return &scoringService{
		gameRepo:   gameRepo,
		perfRepo:   perfRepo,
		pointsRepo: pointsRepo,
		weights:    WeightsV1,
		weightVer:  WeightVerV1,
	}
}

// ScoreCompletedGames iterates every completed-and-scraped game and
// upserts a PlayerGamePoint row per performance. Re-running after a weight bump produces a new set of rows
// keyed on the new weight_ver, leaving historical scores untouched.
//
// Per-game failures are logged and skipped. One bad game shouldn't poison
// the rest of the season's scoring.
func (s *scoringService) ScoreCompletedGames(ctx context.Context) error {
	games, err := s.gameRepo.FindScraped(ctx)
	if err != nil {
		return fmt.Errorf("ScoreCompletedGames: find scraped games: %w", err)
	}

	scored := 0
	skipped := 0
	for _, game := range games {
		if err := s.scoreGame(ctx, game); err != nil {
			log.Printf("ScoreCompletedGames: skip game %s: %v", game.Id, err)
			skipped++
			continue
		}
		scored++
	}
	log.Printf("ScoreCompletedGames: scored %d games, skipped %d", scored, skipped)
	return nil
}

func (s *scoringService) scoreGame(ctx context.Context, game models.Game) error {
	perfs, err := s.perfRepo.FindByGameId(ctx, game.Id)
	if err != nil {
		return fmt.Errorf("find perfs: %w", err)
	}
	if len(perfs) == 0 {
		return nil // nothing to score
	}

	// If Game.ForfeitedBy is set, every roster
	// member on both teams scores 0 for this game, regardless of any
	// other field. No actual contest happened.
	forfeited := game.ForfeitedBy != nil
	outcomes := map[uuid.UUID]Outcome{}
	if !forfeited {
		outcomes = outcomesByTeam(perfs)
	}

	for _, perf := range perfs {
		var pts int
		if !forfeited {
			outcome := OutcomeUnknown
			if perf.TeamId != nil {
				outcome = outcomes[*perf.TeamId]
			}
			pts = score(perf, outcome, s.weights)
		}
		// forfeited: pts stays 0

		record := &models.PlayerGamePoint{
			PlayerId:  perf.PlayerId,
			GameId:    game.Id,
			Points:    pts,
			WeightVer: s.weightVer,
		}
		if _, err := s.pointsRepo.Upsert(ctx, record); err != nil {
			return fmt.Errorf("upsert points for player %s: %w", perf.PlayerId, err)
		}
	}
	return nil
}
