package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/season"
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// FeaturedMatch is the single most exciting fixture in a gameweek: the one
// with the most combined goals. Ties broken by lowest games.id (earliest
// insertion order).
type FeaturedMatch struct {
	Home      string `json:"home"`
	Away      string `json:"away"`
	HomeScore int    `json:"home_score"`
	AwayScore int    `json:"away_score"`
}

// TopScorer is the highest single-player point haul across all games in the
// gameweek. Global — not user-scoped — so the response is fully cacheable.
type TopScorer struct {
	Name   string `json:"name"`
	Team   string `json:"team"`
	Points int    `json:"points"`
}

// GameweekResults is the payload returned by both /gameweeks/last/results
// and /gameweeks/:n/results.
//
//	Gameweek == nil  ⇒ pre-GW1 (no completed gameweeks yet).
//	Match    == nil  ⇒ no games found in the GW window (shouldn't happen
//	                   after Gameweek is populated, but defensive).
//	TopScorer == nil ⇒ GW has games but no scored performances yet (e.g.
//	                   scraper has run but scoring service hasn't).
type GameweekResults struct {
	Gameweek  *int           `json:"gameweek"`
	Match     *FeaturedMatch `json:"match"`
	TopScorer *TopScorer     `json:"top_scorer"`
}

// GameweekResultsService assembles the "GW results" card payload from the
// already-persisted game + performance + points tables. No scraper calls.
// Team names are joined in by the repository queries, so no separate team
// lookup is needed.
type GameweekResultsService struct {
	gameRepo  repository.GameRepository
	perfRepo  repository.PerformanceRepository
	pointRepo repository.PlayerGamePointRepo
	loc       *time.Location
	weightVer string
}

func NewGameweekResultsService(
	gameRepo repository.GameRepository,
	perfRepo repository.PerformanceRepository,
	pointRepo repository.PlayerGamePointRepo,
	loc *time.Location,
) *GameweekResultsService {
	if loc == nil {
		loc = time.UTC
	}
	return &GameweekResultsService{
		gameRepo:  gameRepo,
		perfRepo:  perfRepo,
		pointRepo: pointRepo,
		loc:       loc,
		weightVer: WeightVerV1,
	}
}

// GetLastCompletedResults resolves the most recent gameweek whose cutoff has
// passed (league-local time) and assembles the results payload for it.
// Returns an empty GameweekResults (all fields nil) if no GW has completed.
func (s *GameweekResultsService) GetLastCompletedResults(ctx context.Context) (*GameweekResults, error) {
	games, err := s.gameRepo.FindRegularSeason(ctx)
	if err != nil {
		return nil, fmt.Errorf("GetLastCompletedResults: find regular season: %w", err)
	}
	gws := season.RegularGameweeks(games, s.loc)
	if len(gws) == 0 {
		return &GameweekResults{}, nil
	}

	now := time.Now().In(s.loc)
	var chosen *season.Gameweek
	for i := range gws {
		gw := gws[i]
		if gw.Cutoff.Before(now) {
			chosen = &gw
		}
	}
	if chosen == nil {
		return &GameweekResults{}, nil
	}
	return s.assembleForGW(ctx, games, *chosen)
}

// GetResultsForGW assembles the payload for a specific gameweek number.
// Returns ErrGameweekNotFound when n is outside the derived schedule.
func (s *GameweekResultsService) GetResultsForGW(ctx context.Context, n int) (*GameweekResults, error) {
	games, err := s.gameRepo.FindRegularSeason(ctx)
	if err != nil {
		return nil, fmt.Errorf("GetResultsForGW: find regular season: %w", err)
	}
	gws := season.RegularGameweeks(games, s.loc)
	if len(gws) == 0 {
		return nil, ErrGameweekNotFound
	}
	for _, gw := range gws {
		if gw.Number == n {
			return s.assembleForGW(ctx, games, gw)
		}
	}
	return nil, ErrGameweekNotFound
}

func (s *GameweekResultsService) assembleForGW(ctx context.Context, allGames []models.Game, gw season.Gameweek) (*GameweekResults, error) {
	// Games whose kickoff falls inside the GW window (league-local).
	weekGames := make([]models.Game, 0)
	for _, g := range allGames {
		if g.KickoffTime == nil {
			continue
		}
		local := g.KickoffTime.In(s.loc)
		if (local.Equal(gw.Start) || local.After(gw.Start)) && (local.Equal(gw.Cutoff) || local.Before(gw.Cutoff)) {
			weekGames = append(weekGames, g)
		}
	}

	n := gw.Number
	out := &GameweekResults{Gameweek: &n}

	if len(weekGames) == 0 {
		return out, nil
	}

	gameIDs := make([]uuid.UUID, len(weekGames))
	for i, g := range weekGames {
		gameIDs[i] = g.Id
	}

	goalRows, err := s.perfRepo.GoalsByGameAndTeam(ctx, gameIDs)
	if err != nil {
		return nil, fmt.Errorf("assembleForGW: goal aggregation: %w", err)
	}

	out.Match = pickFeaturedMatch(weekGames, goalRows)

	top, err := s.pointRepo.TopScorerInGames(ctx, gameIDs, s.weightVer)
	if err != nil {
		return nil, fmt.Errorf("assembleForGW: top scorer: %w", err)
	}
	if top != nil {
		out.TopScorer = &TopScorer{
			Name:   top.PlayerName,
			Team:   top.TeamName,
			Points: top.Points,
		}
	}

	return out, nil
}

// pickFeaturedMatch picks the game with the most combined goals among
// weekGames. Tie-break: lowest games.id lexicographic order (a stable proxy
// for earliest UUID insertion). All-zero windows fall back to the first
// game with both teams resolved, or the first game outright.
func pickFeaturedMatch(weekGames []models.Game, goalRows []repository.GameTeamGoals) *FeaturedMatch {
	// game_id → external_team_id → (name, goals)
	type sideEntry struct {
		Name  string
		Goals int
	}
	byGame := map[uuid.UUID]map[string]sideEntry{}
	for _, r := range goalRows {
		side, ok := byGame[r.GameID]
		if !ok {
			side = map[string]sideEntry{}
			byGame[r.GameID] = side
		}
		side[r.TeamExternalID] = sideEntry{Name: r.TeamName, Goals: r.Goals}
	}

	var (
		bestIdx    = -1
		bestTotal  = -1
		bestGameID uuid.UUID
	)
	for i, g := range weekGames {
		side := byGame[g.Id]
		homeGoals := side[g.HomeTeamExternalId].Goals
		awayGoals := side[g.AwayTeamExternalId].Goals
		total := homeGoals + awayGoals

		better := false
		switch {
		case bestIdx == -1:
			better = true
		case total > bestTotal:
			better = true
		case total == bestTotal && g.Id.String() < bestGameID.String():
			better = true
		}
		if better {
			bestIdx = i
			bestTotal = total
			bestGameID = g.Id
		}
	}
	if bestIdx == -1 {
		return nil
	}

	chosen := weekGames[bestIdx]
	side := byGame[chosen.Id]
	home := side[chosen.HomeTeamExternalId]
	away := side[chosen.AwayTeamExternalId]

	// If no perf rows for either side, names are empty — return empty
	// match rather than fabricate names.
	return &FeaturedMatch{
		Home:      home.Name,
		Away:      away.Name,
		HomeScore: home.Goals,
		AwayScore: away.Goals,
	}
}

// ---------------------------------------------------------------------------
// In-process cache wrapper.
// ---------------------------------------------------------------------------

const gwResultsCacheTTL = 5 * time.Minute

// lastGWCacheKey is the sentinel cache key for "last completed GW". Real GW
// numbers are 1-indexed so -1 cannot collide.
const lastGWCacheKey = -1

type gwResultsCacheEntry struct {
	value     *GameweekResults
	expiresAt time.Time
}

// CachedGameweekResultsService wraps GameweekResultsService with a 5-minute
// in-process cache. Safe for concurrent use. No coalescing — at TTL boundary
// up to N callers may each fire one query; acceptable for this read path.
type CachedGameweekResultsService struct {
	inner *GameweekResultsService
	mu    sync.RWMutex
	cache map[int]gwResultsCacheEntry
}

func NewCachedGameweekResultsService(inner *GameweekResultsService) *CachedGameweekResultsService {
	return &CachedGameweekResultsService{
		inner: inner,
		cache: map[int]gwResultsCacheEntry{},
	}
}

func (c *CachedGameweekResultsService) GetLastCompletedResults(ctx context.Context) (*GameweekResults, error) {
	if v, ok := c.read(lastGWCacheKey); ok {
		return v, nil
	}
	v, err := c.inner.GetLastCompletedResults(ctx)
	if err != nil {
		return nil, err
	}
	c.write(lastGWCacheKey, v)
	// Also populate the numeric key when we know which GW was returned, so
	// /gameweeks/:n/results hits warm cache.
	if v != nil && v.Gameweek != nil {
		c.write(*v.Gameweek, v)
	}
	return v, nil
}

func (c *CachedGameweekResultsService) GetResultsForGW(ctx context.Context, n int) (*GameweekResults, error) {
	if v, ok := c.read(n); ok {
		return v, nil
	}
	v, err := c.inner.GetResultsForGW(ctx, n)
	if err != nil {
		return nil, err
	}
	c.write(n, v)
	return v, nil
}

func (c *CachedGameweekResultsService) read(key int) (*GameweekResults, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, ok := c.cache[key]
	if !ok || time.Now().After(entry.expiresAt) {
		return nil, false
	}
	return entry.value, true
}

func (c *CachedGameweekResultsService) write(key int, v *GameweekResults) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cache[key] = gwResultsCacheEntry{value: v, expiresAt: time.Now().Add(gwResultsCacheTTL)}
}
