package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"context"
	"errors"
	"sort"
	"testing"
	"time"

	"github.com/google/uuid"
)

// --- fakes specific to GameweekResultsService ---

type fakeGWGameRepo struct {
	games []models.Game
	err   error
}

func (f *fakeGWGameRepo) Upsert(_ context.Context, g *models.Game) (*models.Game, error) {
	return g, nil
}
func (f *fakeGWGameRepo) FindByExternalId(_ context.Context, _, _ string) (*models.Game, error) {
	return nil, nil
}
func (f *fakeGWGameRepo) FindUnscraped(_ context.Context) ([]models.Game, error) { return nil, nil }
func (f *fakeGWGameRepo) FindScraped(_ context.Context) ([]models.Game, error)   { return nil, nil }
func (f *fakeGWGameRepo) FindRegularSeason(_ context.Context) ([]models.Game, error) {
	return f.games, f.err
}
func (f *fakeGWGameRepo) MarkScraped(_ context.Context, _ uuid.UUID) error { return nil }

type fakeGWPerfRepo struct {
	byGame map[uuid.UUID][]repository.GameTeamGoals
}

func (f *fakeGWPerfRepo) Upsert(_ context.Context, p *models.PlayerPerformance) (*models.PlayerPerformance, error) {
	return p, nil
}
func (f *fakeGWPerfRepo) FindByGameIdAndPlayerId(_ context.Context, _, _ uuid.UUID) (*models.PlayerPerformance, error) {
	return nil, nil
}
func (f *fakeGWPerfRepo) FindByGameId(_ context.Context, _ uuid.UUID) ([]models.PlayerPerformance, error) {
	return nil, nil
}
func (f *fakeGWPerfRepo) FindByPlayerIDs(_ context.Context, _ []uuid.UUID) ([]models.PlayerPerformance, error) {
	return nil, nil
}
func (f *fakeGWPerfRepo) GoalsByGameAndTeam(_ context.Context, gameIDs []uuid.UUID) ([]repository.GameTeamGoals, error) {
	var rows []repository.GameTeamGoals
	for _, id := range gameIDs {
		rows = append(rows, f.byGame[id]...)
	}
	return rows, nil
}

type fakeGWPointRepo struct {
	top *repository.TopScorerRow
	err error
}

func (f *fakeGWPointRepo) Upsert(_ context.Context, r *models.PlayerGamePoint) (*models.PlayerGamePoint, error) {
	return r, nil
}
func (f *fakeGWPointRepo) FindById(_ context.Context, _ uuid.UUID) (*models.PlayerGamePoint, error) {
	return nil, nil
}
func (f *fakeGWPointRepo) AvgPointsByPlayer(_ context.Context, _ string, _ time.Time) ([]repository.PlayerAvgPoints, error) {
	return nil, nil
}
func (f *fakeGWPointRepo) TopScorerInGames(_ context.Context, _ []uuid.UUID, _ string) (*repository.TopScorerRow, error) {
	return f.top, f.err
}

// --- helpers ---

// gwGame builds a regular-season game on the given kickoff with deterministic
// home/away external ids. The Id is taken from the supplied uuid so tie-break
// tests can pin ordering.
func gwGame(id uuid.UUID, kickoff time.Time, homeExt, awayExt string) models.Game {
	return models.Game{
		Id:                 id,
		ExternalGameId:     id.String(),
		ExternalSource:     "imleagues",
		ExternalGameType:   0,
		KickoffTime:        &kickoff,
		HomeTeamExternalId: homeExt,
		AwayTeamExternalId: awayExt,
		Status:             "Completed",
	}
}

// goalRow is shorthand for assembling expected aggregation rows.
func goalRow(gameID uuid.UUID, teamExt, teamName string, goals int) repository.GameTeamGoals {
	return repository.GameTeamGoals{
		GameID:         gameID,
		TeamID:         uuid.New(),
		TeamExternalID: teamExt,
		TeamName:       teamName,
		Goals:          goals,
	}
}

// pastMonday returns a kickoff 21 days before now, snapped to Saturday so the
// derived gameweek's cutoff (Sunday end-of-day) is comfortably in the past.
func pastSaturday(weeksAgo int) time.Time {
	now := time.Now().UTC()
	day := now.AddDate(0, 0, -weeksAgo*7)
	// Snap forward to next Saturday for predictability.
	offset := (int(time.Saturday) - int(day.Weekday()) + 7) % 7
	sat := day.AddDate(0, 0, offset)
	return time.Date(sat.Year(), sat.Month(), sat.Day(), 12, 0, 0, 0, time.UTC)
}

func newGWResultsSvc(gr *fakeGWGameRepo, pr *fakeGWPerfRepo, pgr *fakeGWPointRepo) *GameweekResultsService {
	return NewGameweekResultsService(gr, pr, pgr, time.UTC)
}

// --- tests ---

func TestGetLastCompletedResults_NoGames_ReturnsEmpty(t *testing.T) {
	svc := newGWResultsSvc(&fakeGWGameRepo{}, &fakeGWPerfRepo{}, &fakeGWPointRepo{})
	res, err := svc.GetLastCompletedResults(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.Gameweek != nil || res.Match != nil || res.TopScorer != nil {
		t.Errorf("expected empty payload, got %+v", res)
	}
}

func TestGetLastCompletedResults_AllGameweeksFuture_ReturnsEmpty(t *testing.T) {
	future := time.Now().UTC().Add(30 * 24 * time.Hour)
	g := gwGame(uuid.New(), future, "home_ext", "away_ext")
	svc := newGWResultsSvc(&fakeGWGameRepo{games: []models.Game{g}}, &fakeGWPerfRepo{}, &fakeGWPointRepo{})

	res, err := svc.GetLastCompletedResults(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.Gameweek != nil {
		t.Errorf("expected nil gameweek for all-future schedule, got %d", *res.Gameweek)
	}
}

func TestGetLastCompletedResults_OneGW_OneGame_PopulatesMatchAndTopScorer(t *testing.T) {
	kickoff := pastSaturday(2)
	gameID := uuid.New()
	g := gwGame(gameID, kickoff, "home_ext", "away_ext")

	perfRepo := &fakeGWPerfRepo{
		byGame: map[uuid.UUID][]repository.GameTeamGoals{
			gameID: {
				goalRow(gameID, "home_ext", "Kings", 3),
				goalRow(gameID, "away_ext", "Trinity", 1),
			},
		},
	}
	pointRepo := &fakeGWPointRepo{top: &repository.TopScorerRow{
		PlayerID: uuid.New(), PlayerName: "Doyle", TeamName: "Kings", Points: 11,
	}}

	svc := newGWResultsSvc(&fakeGWGameRepo{games: []models.Game{g}}, perfRepo, pointRepo)
	res, err := svc.GetLastCompletedResults(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.Gameweek == nil || *res.Gameweek != 1 {
		t.Fatalf("gameweek = %v, want 1", res.Gameweek)
	}
	if res.Match == nil {
		t.Fatal("expected match, got nil")
	}
	if res.Match.Home != "Kings" || res.Match.Away != "Trinity" || res.Match.HomeScore != 3 || res.Match.AwayScore != 1 {
		t.Errorf("match = %+v, want Kings 3 – 1 Trinity", res.Match)
	}
	if res.TopScorer == nil || res.TopScorer.Name != "Doyle" || res.TopScorer.Team != "Kings" || res.TopScorer.Points != 11 {
		t.Errorf("top scorer = %+v, want Doyle/Kings/11", res.TopScorer)
	}
}

func TestGetLastCompletedResults_TwoGames_PicksHighestCombinedGoals(t *testing.T) {
	kickoff := pastSaturday(2)
	g1 := gwGame(uuid.New(), kickoff, "h1", "a1")              // 1+1 = 2
	g2 := gwGame(uuid.New(), kickoff.Add(2*time.Hour), "h2", "a2") // 4+1 = 5

	perfRepo := &fakeGWPerfRepo{
		byGame: map[uuid.UUID][]repository.GameTeamGoals{
			g1.Id: {
				goalRow(g1.Id, "h1", "H1", 1),
				goalRow(g1.Id, "a1", "A1", 1),
			},
			g2.Id: {
				goalRow(g2.Id, "h2", "H2", 4),
				goalRow(g2.Id, "a2", "A2", 1),
			},
		},
	}

	svc := newGWResultsSvc(&fakeGWGameRepo{games: []models.Game{g1, g2}}, perfRepo, &fakeGWPointRepo{})
	res, err := svc.GetLastCompletedResults(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.Match == nil || res.Match.Home != "H2" || res.Match.Away != "A2" {
		t.Errorf("expected H2 vs A2 featured, got %+v", res.Match)
	}
}

func TestGetLastCompletedResults_TieOnGoals_LowestIDWins(t *testing.T) {
	kickoff := pastSaturday(2)

	// Construct two UUIDs whose ordering is deterministic by lex sort.
	idA := uuid.MustParse("00000000-0000-4000-8000-000000000001")
	idB := uuid.MustParse("00000000-0000-4000-8000-000000000002")

	g1 := gwGame(idB, kickoff, "hB", "aB")              // total 4
	g2 := gwGame(idA, kickoff.Add(time.Hour), "hA", "aA") // total 4

	perfRepo := &fakeGWPerfRepo{
		byGame: map[uuid.UUID][]repository.GameTeamGoals{
			idB: {
				goalRow(idB, "hB", "TeamHB", 2),
				goalRow(idB, "aB", "TeamAB", 2),
			},
			idA: {
				goalRow(idA, "hA", "TeamHA", 2),
				goalRow(idA, "aA", "TeamAA", 2),
			},
		},
	}

	svc := newGWResultsSvc(&fakeGWGameRepo{games: []models.Game{g1, g2}}, perfRepo, &fakeGWPointRepo{})
	res, err := svc.GetLastCompletedResults(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.Match == nil {
		t.Fatal("expected match")
	}
	// Lowest id (idA) should win the tie.
	if res.Match.Home != "TeamHA" || res.Match.Away != "TeamAA" {
		t.Errorf("tie-break failed: expected TeamHA/TeamAA, got %+v", res.Match)
	}
}

func TestGetResultsForGW_OutOfRange_ReturnsErrGameweekNotFound(t *testing.T) {
	g := gwGame(uuid.New(), pastSaturday(2), "h", "a")
	svc := newGWResultsSvc(&fakeGWGameRepo{games: []models.Game{g}}, &fakeGWPerfRepo{}, &fakeGWPointRepo{})

	_, err := svc.GetResultsForGW(context.Background(), 99)
	if !errors.Is(err, ErrGameweekNotFound) {
		t.Errorf("err = %v, want ErrGameweekNotFound", err)
	}
}

func TestGetResultsForGW_NoGames_ReturnsErrGameweekNotFound(t *testing.T) {
	svc := newGWResultsSvc(&fakeGWGameRepo{}, &fakeGWPerfRepo{}, &fakeGWPointRepo{})
	_, err := svc.GetResultsForGW(context.Background(), 1)
	if !errors.Is(err, ErrGameweekNotFound) {
		t.Errorf("err = %v, want ErrGameweekNotFound", err)
	}
}

func TestGetResultsForGW_KnownNumber_ReturnsThatWeek(t *testing.T) {
	g1 := gwGame(uuid.New(), pastSaturday(3), "h1", "a1")
	g2 := gwGame(uuid.New(), pastSaturday(1), "h2", "a2") // newer

	// Sort by kickoff so the gameweek number assignment is predictable.
	games := []models.Game{g1, g2}
	sort.Slice(games, func(i, j int) bool { return games[i].KickoffTime.Before(*games[j].KickoffTime) })

	perfRepo := &fakeGWPerfRepo{
		byGame: map[uuid.UUID][]repository.GameTeamGoals{
			g1.Id: {goalRow(g1.Id, "h1", "Home1", 1), goalRow(g1.Id, "a1", "Away1", 0)},
			g2.Id: {goalRow(g2.Id, "h2", "Home2", 2), goalRow(g2.Id, "a2", "Away2", 2)},
		},
	}
	svc := newGWResultsSvc(&fakeGWGameRepo{games: games}, perfRepo, &fakeGWPointRepo{})

	// GW1 is the earlier game.
	res, err := svc.GetResultsForGW(context.Background(), 1)
	if err != nil {
		t.Fatalf("err: %v", err)
	}
	if res.Match == nil || res.Match.Home != "Home1" {
		t.Errorf("GW1 match home = %v, want Home1", res.Match)
	}

	// GW2 is the later game.
	res2, err := svc.GetResultsForGW(context.Background(), 2)
	if err != nil {
		t.Fatalf("err: %v", err)
	}
	if res2.Match == nil || res2.Match.Home != "Home2" {
		t.Errorf("GW2 match home = %v, want Home2", res2.Match)
	}
}

func TestGetLastCompletedResults_NoPerfRows_TopScorerNil(t *testing.T) {
	kickoff := pastSaturday(2)
	g := gwGame(uuid.New(), kickoff, "h", "a")

	// Empty goal rows, nil top scorer.
	svc := newGWResultsSvc(&fakeGWGameRepo{games: []models.Game{g}}, &fakeGWPerfRepo{}, &fakeGWPointRepo{top: nil})
	res, err := svc.GetLastCompletedResults(context.Background())
	if err != nil {
		t.Fatalf("err: %v", err)
	}
	if res.Gameweek == nil {
		t.Fatal("expected gameweek populated")
	}
	if res.TopScorer != nil {
		t.Errorf("expected nil top scorer when no perf rows, got %+v", res.TopScorer)
	}
	// Match still rendered as 0-0 with empty team names — schedule exists
	// but scrape hasn't populated perfs yet.
	if res.Match == nil {
		t.Fatal("expected match populated (possibly 0-0)")
	}
	if res.Match.HomeScore != 0 || res.Match.AwayScore != 0 {
		t.Errorf("expected 0-0 fallback, got %d-%d", res.Match.HomeScore, res.Match.AwayScore)
	}
}

func TestCachedGameweekResultsService_CachesLastResults(t *testing.T) {
	kickoff := pastSaturday(2)
	g := gwGame(uuid.New(), kickoff, "h", "a")
	gameRepo := &fakeGWGameRepo{games: []models.Game{g}}
	inner := newGWResultsSvc(gameRepo, &fakeGWPerfRepo{}, &fakeGWPointRepo{})
	cached := NewCachedGameweekResultsService(inner)

	_, err := cached.GetLastCompletedResults(context.Background())
	if err != nil {
		t.Fatalf("first call: %v", err)
	}

	// Bust the underlying repo to confirm second call doesn't hit it.
	gameRepo.err = errors.New("should not be called")

	_, err = cached.GetLastCompletedResults(context.Background())
	if err != nil {
		t.Errorf("second call should hit cache, got: %v", err)
	}
}
