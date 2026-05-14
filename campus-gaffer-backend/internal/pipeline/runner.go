// Package pipeline orchestrates the scraper ingest flow. It is target-agnostic:
// the same Runner.Run drives the CLI binary and the future Lambda handler.
package pipeline

import (
	"campus-gaffer-backend/internal/scraper"
	"campus-gaffer-backend/internal/service"
	"context"
	"errors"
	"fmt"
	"log"
)

type Runner struct {
	discovery scraper.DiscoveryScraper
	games     service.GameService
	scoring   service.ScoringService
}

func NewRunner(discovery scraper.DiscoveryScraper, games service.GameService, scoring service.ScoringService) *Runner {
	return &Runner{discovery: discovery, games: games, scoring: scoring}
}

// Run executes the full ingest: discover teams, fetch each team's season,
// sync the deduped batch, process completed games, then score them.
//
// Per-team discovery failures are logged and aggregated rather than aborting
// the run, one team's outage shouldn't poison the rest of the league.
func (r *Runner) Run(ctx context.Context) error {
	teams, err := r.discovery.GetLeagueTeams(ctx)
	if err != nil {
		return fmt.Errorf("pipeline: get league teams: %w", err)
	}
	if len(teams) == 0 {
		log.Println("pipeline: no teams returned, nothing to do")
		return nil
	}

	// Each fixture appears in both the home and away team's feed; SyncGames
	// dedupes intra-call, so we collect across teams and call once.
	var all []scraper.ScrapedGameSummary
	var teamErrs []error
	for _, t := range teams {
		games, err := r.discovery.GetCurrentSeasonGames(ctx, t.TeamId)
		if err != nil {
			log.Printf("pipeline: discover games for team %s (%s): %v", t.TeamId, t.TeamName, err)
			teamErrs = append(teamErrs, fmt.Errorf("team %s: %w", t.TeamId, err))
			continue
		}
		all = append(all, games...)
	}

	if len(teamErrs) == len(teams) {
		return fmt.Errorf("pipeline: all %d teams failed discovery: %w", len(teams), errors.Join(teamErrs...))
	}
	if len(teamErrs) > 0 {
		log.Printf("pipeline: %d/%d teams failed discovery, continuing with partial batch", len(teamErrs), len(teams))
	}

	if err := r.games.SyncGames(ctx, all); err != nil {
		return fmt.Errorf("pipeline: sync games: %w", err)
	}
	if err := r.games.ProcessCompletedGames(ctx); err != nil {
		return fmt.Errorf("pipeline: process completed games: %w", err)
	}
	if err := r.scoring.ScoreCompletedGames(ctx); err != nil {
		// Non-fatal: stats are persisted; scoring is recomputable.
		log.Printf("pipeline: scoring failed: %v", err)
	}
	return nil
}
