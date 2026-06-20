package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
)

// --- fakes ---

type fakeSquadRepo struct {
	squads              map[uuid.UUID]*models.Squad
	players             map[uuid.UUID][]models.SquadPlayer
	err                 error
	totalPointsOverride map[uuid.UUID]int
	leaderboardRows     []repository.LeaderboardRow
	leaderboardTotal    int
	leaderboardErr      error
}

func newFakeSquadRepo() *fakeSquadRepo {
	return &fakeSquadRepo{
		squads:  make(map[uuid.UUID]*models.Squad),
		players: make(map[uuid.UUID][]models.SquadPlayer),
	}
}

func (f *fakeSquadRepo) Create(_ context.Context, squad *models.Squad, players []models.SquadPlayer) error {
	if f.err != nil {
		return f.err
	}
	if squad.Id == uuid.Nil {
		squad.Id = uuid.New()
	}
	s := *squad
	cp := make([]models.SquadPlayer, len(players))
	for i, p := range players {
		p.SquadId = squad.Id
		if p.Id == uuid.Nil {
			p.Id = uuid.New()
		}
		cp[i] = p
	}
	f.squads[squad.Id] = &s
	f.players[squad.Id] = cp
	return nil
}

func (f *fakeSquadRepo) FindByID(_ context.Context, id uuid.UUID) (*models.Squad, []models.SquadPlayer, error) {
	if f.err != nil {
		return nil, nil, f.err
	}
	squad, ok := f.squads[id]
	if !ok {
		return nil, nil, nil
	}
	return squad, f.players[id], nil
}

func (f *fakeSquadRepo) FindByUserID(_ context.Context, userID string) (*models.Squad, error) {
	if f.err != nil {
		return nil, f.err
	}
	for _, s := range f.squads {
		if s.UserID == userID {
			return s, nil
		}
	}
	return nil, nil
}

func (f *fakeSquadRepo) TotalPointsByPlayerIDs(_ context.Context, _ []uuid.UUID, _ string) (map[uuid.UUID]int, error) {
	if f.err != nil {
		return nil, f.err
	}
	if f.totalPointsOverride != nil {
		return f.totalPointsOverride, nil
	}
	return map[uuid.UUID]int{}, nil
}

func (f *fakeSquadRepo) Leaderboard(_ context.Context, limit, offset int, _, _ time.Time) ([]repository.LeaderboardRow, int, error) {
	if f.leaderboardErr != nil {
		return nil, 0, f.leaderboardErr
	}
	if offset >= len(f.leaderboardRows) {
		return []repository.LeaderboardRow{}, f.leaderboardTotal, nil
	}

	end := limit + offset
	if end > len(f.leaderboardRows) {
		end = len(f.leaderboardRows)
	}
	return f.leaderboardRows[offset:end], f.leaderboardTotal, nil
}

type fakeSquadPriceRepo struct {
	prices map[uuid.UUID]float64
	err    error
}

func (f *fakeSquadPriceRepo) Upsert(context.Context, *models.PlayerPrice) (*models.PlayerPrice, error) {
	return nil, nil
}
func (f *fakeSquadPriceRepo) InsertBatch(context.Context, []models.PlayerPrice) (int, error) {
	return 0, nil
}
func (f *fakeSquadPriceRepo) MaxPricedGameweek(context.Context) (int, error) { return 0, nil }
func (f *fakeSquadPriceRepo) GetEffectivePrice(_ context.Context, playerID uuid.UUID, _ int) (float64, error) {
	if f.err != nil {
		return 0, f.err
	}
	if p, ok := f.prices[playerID]; ok {
		return p, nil
	}
	return repository.PriceFloor, nil
}

// fakeGameRepoForSquad only implements FindRegularSeason; all other methods are no-ops.
type fakeGameRepoForSquad struct {
	games []models.Game
}

func (f *fakeGameRepoForSquad) FindRegularSeason(_ context.Context) ([]models.Game, error) {
	return f.games, nil
}
func (f *fakeGameRepoForSquad) Upsert(_ context.Context, g *models.Game) (*models.Game, error) {
	return g, nil
}
func (f *fakeGameRepoForSquad) FindByExternalId(_ context.Context, _, _ string) (*models.Game, error) {
	return nil, nil
}
func (f *fakeGameRepoForSquad) FindUnscraped(_ context.Context) ([]models.Game, error) {
	return nil, nil
}
func (f *fakeGameRepoForSquad) FindScraped(_ context.Context) ([]models.Game, error) {
	return nil, nil
}
func (f *fakeGameRepoForSquad) MarkScraped(_ context.Context, _ uuid.UUID) error { return nil }

// gameAtKickoff builds a minimal regular-season Game for schedule derivation.
func gameAtKickoff(t time.Time) models.Game {
	return models.Game{
		Id:               uuid.New(),
		ExternalGameId:   uuid.NewString(),
		ExternalSource:   "imleagues",
		ExternalGameType: 0,
		KickoffTime:      &t,
		Status:           "Completed",
	}
}

// futureGameRepo returns a schedule where GW1 cutoff is 30 days away.
func futureGameRepo() *fakeGameRepoForSquad {
	k := time.Now().Add(30 * 24 * time.Hour)
	return &fakeGameRepoForSquad{games: []models.Game{gameAtKickoff(k)}}
}

// pastGameRepo returns a schedule where GW1 cutoff has already elapsed.
func pastGameRepo() *fakeGameRepoForSquad {
	k := time.Now().Add(-30 * 24 * time.Hour)
	return &fakeGameRepoForSquad{games: []models.Game{gameAtKickoff(k)}}
}

// --- helpers ---

func makeIDs(n int) []uuid.UUID {
	ids := make([]uuid.UUID, n)
	for i := range ids {
		ids[i] = uuid.New()
	}
	return ids
}

func newSquadSvc(sr *fakeSquadRepo, pr *fakeSquadPriceRepo, gr repository.GameRepository) SquadService {
	return &squadService{squadRepo: sr, priceRepo: pr, gameRepo: gr, loc: time.UTC}
}


func validReq(starters, bench []uuid.UUID) CreateSquadRequest {
	return CreateSquadRequest{UserID: "user_test1", Gameweek: 1, Starters: starters, Bench: bench}
}

// --- tests ---

func TestCreateSquad_Valid_Succeeds(t *testing.T) {
	starters := makeIDs(OnFieldCount)
	bench := makeIDs(BenchCount)
	svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{}, futureGameRepo())

	squad, players, err := svc.CreateSquad(context.Background(), validReq(starters, bench))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if squad == nil {
		t.Fatal("expected squad, got nil")
	}
	if len(players) != OnFieldCount+BenchCount {
		t.Errorf("player count = %d, want %d", len(players), OnFieldCount+BenchCount)
	}
	starterCount, benchCount := 0, 0
	for _, p := range players {
		if p.IsBench {
			benchCount++
		} else {
			starterCount++
		}
	}
	if starterCount != OnFieldCount {
		t.Errorf("starters = %d, want %d", starterCount, OnFieldCount)
	}
	if benchCount != BenchCount {
		t.Errorf("bench = %d, want %d", benchCount, BenchCount)
	}
}

func TestCreateSquad_WrongStarterCount_Rejected(t *testing.T) {
	for _, n := range []int{0, 5, 7} {
		svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{}, futureGameRepo())
		_, _, err := svc.CreateSquad(context.Background(), validReq(makeIDs(n), makeIDs(BenchCount)))
		if err != ErrWrongStarterCount {
			t.Errorf("starters=%d: got %v, want ErrWrongStarterCount", n, err)
		}
	}
}

func TestCreateSquad_WrongBenchCount_Rejected(t *testing.T) {
	for _, n := range []int{0, 3, 5} {
		svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{}, futureGameRepo())
		_, _, err := svc.CreateSquad(context.Background(), validReq(makeIDs(OnFieldCount), makeIDs(n)))
		if err != ErrWrongBenchCount {
			t.Errorf("bench=%d: got %v, want ErrWrongBenchCount", n, err)
		}
	}
}

func TestCreateSquad_DuplicatePlayer_Rejected(t *testing.T) {
	starters := makeIDs(OnFieldCount)
	bench := makeIDs(BenchCount)
	bench[0] = starters[0] // same player on field and bench
	svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{}, futureGameRepo())
	_, _, err := svc.CreateSquad(context.Background(), validReq(starters, bench))
	if err != ErrDuplicatePlayer {
		t.Errorf("got %v, want ErrDuplicatePlayer", err)
	}
}

func TestCreateSquad_AfterDeadline_Rejected(t *testing.T) {
	svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{}, pastGameRepo())
	_, _, err := svc.CreateSquad(context.Background(), validReq(makeIDs(OnFieldCount), makeIDs(BenchCount)))
	if err != ErrDeadlinePassed {
		t.Errorf("got %v, want ErrDeadlinePassed", err)
	}
}

func TestCreateSquad_GameweekNotInSchedule_Rejected(t *testing.T) {
	// Gameweek 99 doesn't exist in a single-game schedule (only GW1 exists).
	req := CreateSquadRequest{UserID: "user_test1", Gameweek: 99, Starters: makeIDs(OnFieldCount), Bench: makeIDs(BenchCount)}
	svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{}, futureGameRepo())
	_, _, err := svc.CreateSquad(context.Background(), req)
	if err != ErrGameweekNotFound {
		t.Errorf("got %v, want ErrGameweekNotFound", err)
	}
}

func TestCreateSquad_BudgetExceeded_Rejected(t *testing.T) {
	starters := makeIDs(OnFieldCount)
	bench := makeIDs(BenchCount)
	prices := make(map[uuid.UUID]float64, len(starters)+len(bench))
	for _, id := range append(starters, bench...) {
		prices[id] = PriceMax // 10 × 10 = 100 > 65
	}
	svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{prices: prices}, futureGameRepo())
	_, _, err := svc.CreateSquad(context.Background(), validReq(starters, bench))
	if err != ErrBudgetExceeded {
		t.Errorf("got %v, want ErrBudgetExceeded", err)
	}
}

func TestCreateSquad_UserAlreadyHasSquad_Rejected(t *testing.T) {
	userID := "user_42"
	sr := newFakeSquadRepo()
	svc := newSquadSvc(sr, &fakeSquadPriceRepo{}, futureGameRepo())

	req1 := CreateSquadRequest{UserID: userID, Gameweek: 1, Starters: makeIDs(OnFieldCount), Bench: makeIDs(BenchCount)}
	if _, _, err := svc.CreateSquad(context.Background(), req1); err != nil {
		t.Fatalf("first draft failed: %v", err)
	}

	req2 := CreateSquadRequest{UserID: userID, Gameweek: 1, Starters: makeIDs(OnFieldCount), Bench: makeIDs(BenchCount)}
	_, _, err := svc.CreateSquad(context.Background(), req2)
	if err != ErrSquadExists {
		t.Errorf("got %v, want ErrSquadExists", err)
	}
}

func TestCreateSquad_BudgetSpent_RecordedCorrectly(t *testing.T) {
	starters := makeIDs(OnFieldCount)
	bench := makeIDs(BenchCount)
	prices := make(map[uuid.UUID]float64)
	for _, id := range starters {
		prices[id] = 5.0
	}
	for _, id := range bench {
		prices[id] = 4.0
	}
	sr := newFakeSquadRepo()
	svc := newSquadSvc(sr, &fakeSquadPriceRepo{prices: prices}, futureGameRepo())

	squad, _, err := svc.CreateSquad(context.Background(), validReq(starters, bench))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := float64(OnFieldCount)*5.0 + float64(BenchCount)*4.0
	if squad.BudgetSpent != want {
		t.Errorf("budget_spent = %.1f, want %.1f", squad.BudgetSpent, want)
	}
}

func TestGetSquad_NotFound_ReturnsError(t *testing.T) {
	svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{}, futureGameRepo())
	_, _, err := svc.GetSquad(context.Background(), uuid.New(), "user_test1")
	if err != ErrSquadNotFound {
		t.Errorf("got %v, want ErrSquadNotFound", err)
	}
}

func TestGetSquadPoints_StartersOnlyCountToTotal(t *testing.T) {
	starters := makeIDs(OnFieldCount)
	bench := makeIDs(BenchCount)
	sr := newFakeSquadRepo()
	svc := newSquadSvc(sr, &fakeSquadPriceRepo{}, futureGameRepo())

	squad, _, err := svc.CreateSquad(context.Background(), validReq(starters, bench))
	if err != nil {
		t.Fatalf("create squad: %v", err)
	}

	overrides := make(map[uuid.UUID]int)
	for _, id := range starters {
		overrides[id] = 10
	}
	for _, id := range bench {
		overrides[id] = 5 // bench points must not count toward total
	}
	sr.totalPointsOverride = overrides

	resp, err := svc.GetSquadPoints(context.Background(), squad.Id, "user_test1")
	if err != nil {
		t.Fatalf("get points: %v", err)
	}
	want := OnFieldCount * 10
	if resp.TotalPoints != want {
		t.Errorf("total_points = %d, want %d (starters only)", resp.TotalPoints, want)
	}
	if len(resp.Players) != OnFieldCount+BenchCount {
		t.Errorf("players in response = %d, want %d", len(resp.Players), OnFieldCount+BenchCount)
	}
}

func TestGetSquad_WrongOwner_ReturnsForbidden(t *testing.T) {
	starters := makeIDs(OnFieldCount)
	bench := makeIDs(BenchCount)
	sr := newFakeSquadRepo()
	svc := newSquadSvc(sr, &fakeSquadPriceRepo{}, futureGameRepo())
	created, _, err := svc.CreateSquad(context.Background(), validReq(starters, bench))
	if err != nil {
		t.Fatalf("create squad: %v", err)
	}
	_, _, err = svc.GetSquad(context.Background(), created.Id, "someone_else")
	if err != ErrForbidden {
		t.Errorf("got %v, want ErrForbidden", err)
	}
}

func TestGetSquadPoints_WrongOwner_ReturnsForbidden(t *testing.T) {
	starters := makeIDs(OnFieldCount)
	bench := makeIDs(BenchCount)
	sr := newFakeSquadRepo()
	svc := newSquadSvc(sr, &fakeSquadPriceRepo{}, futureGameRepo())
	created, _, err := svc.CreateSquad(context.Background(), validReq(starters, bench))
	if err != nil {
		t.Fatalf("create squad: %v", err)
	}
	_, err = svc.GetSquadPoints(context.Background(), created.Id, "someone_else")
	if err != ErrForbidden {
		t.Errorf("got %v, want ErrForbidden", err)
	}
}

func TestGetSquadPoints_NotFound_ReturnsError(t *testing.T) {
	svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{}, futureGameRepo())
	_, err := svc.GetSquadPoints(context.Background(), uuid.New(), "user_test1")
	if err != ErrSquadNotFound {
		t.Errorf("got %v, want ErrSquadNotFound", err)
	}
}

// TestHotPath_CreateGetPoints exercises the complete happy path:
// draft a valid squad within deadline → fetch it → fetch points.
func TestHotPath_CreateGetPoints(t *testing.T) {
	starters := makeIDs(OnFieldCount)
	bench := makeIDs(BenchCount)
	sr := newFakeSquadRepo()
	svc := newSquadSvc(sr, &fakeSquadPriceRepo{}, futureGameRepo())

	// Create
	created, players, err := svc.CreateSquad(context.Background(), validReq(starters, bench))
	if err != nil {
		t.Fatalf("CreateSquad: %v", err)
	}
	if created.LockedAt == nil {
		t.Error("squad should be locked immediately on creation")
	}

	// Fetch
	fetched, fetchedPlayers, err := svc.GetSquad(context.Background(), created.Id, "user_test1")
	if err != nil {
		t.Fatalf("GetSquad: %v", err)
	}
	if fetched.Id != created.Id {
		t.Errorf("fetched squad id = %s, want %s", fetched.Id, created.Id)
	}
	if len(fetchedPlayers) != len(players) {
		t.Errorf("fetched %d players, want %d", len(fetchedPlayers), len(players))
	}

	// Points (no games scored yet → all zeros, total = 0)
	resp, err := svc.GetSquadPoints(context.Background(), created.Id, "user_test1")
	if err != nil {
		t.Fatalf("GetSquadPoints: %v", err)
	}
	if resp.SquadID != created.Id {
		t.Errorf("points squad_id = %s, want %s", resp.SquadID, created.Id)
	}
	if resp.TotalPoints != 0 {
		t.Errorf("total_points = %d, want 0 (no games scored)", resp.TotalPoints)
	}
	if len(resp.Players) != OnFieldCount+BenchCount {
		t.Errorf("points has %d player entries, want %d", len(resp.Players), OnFieldCount+BenchCount)
	}
}

// TestLeaderboard_PreSeason_ZeroPointsAppear is the regression test for the
// INNER JOIN bug: squad owners with no game points yet must still appear.
func TestLeaderboard_PreSeason_ZeroPointsAppear(t *testing.T) {
    sr := newFakeSquadRepo()
    sr.leaderboardRows = []repository.LeaderboardRow{
        {UserID: "user_alice", Username: "alice", TotalPoints: 0, Rank: 1},
    }
    sr.leaderboardTotal = 1

    rows, total, err := sr.Leaderboard(context.Background(), 50, 0, time.Time{}, time.Time{})
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
    if total != 1 {
        t.Errorf("total = %d, want 1", total)
    }
    if len(rows) != 1 {
        t.Fatalf("rows = %d, want 1 (squad owner with 0 points must appear)", len(rows))
    }
    if rows[0].TotalPoints != 0 {
        t.Errorf("total_points = %d, want 0", rows[0].TotalPoints)
    }
}

func TestLeaderboard_WithPoints_RankedDescending(t *testing.T) {
    sr := newFakeSquadRepo()
    sr.leaderboardRows = []repository.LeaderboardRow{
        {UserID: "user_alice", Username: "alice", TotalPoints: 80, Rank: 1},
        {UserID: "user_bob",   Username: "bob",   TotalPoints: 60, Rank: 2},
        {UserID: "user_carol", Username: "carol", TotalPoints: 0,  Rank: 3},
    }
    sr.leaderboardTotal = 3

    rows, _, err := sr.Leaderboard(context.Background(), 50, 0, time.Time{}, time.Time{})
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
    for i := 1; i < len(rows); i++ {
        if rows[i].TotalPoints > rows[i-1].TotalPoints {
            t.Errorf("row %d (%d pts) outranks row %d (%d pts): not descending",
                i, rows[i].TotalPoints, i-1, rows[i-1].TotalPoints)
        }
    }
}

func TestLeaderboard_Pagination_HonorsLimitOffset(t *testing.T) {
    sr := newFakeSquadRepo()
	num_squads := 5
    for i := range num_squads {
        sr.leaderboardRows = append(sr.leaderboardRows, repository.LeaderboardRow{
            UserID: fmt.Sprintf("user_%d", i), Username: "user", TotalPoints: (num_squads - i) * 10, Rank: i + 1,
        })
    }
    sr.leaderboardTotal = num_squads

    rows, total, err := sr.Leaderboard(context.Background(), 2, 1, time.Time{}, time.Time{})
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
    if total != num_squads {
        t.Errorf("total = %d, want %d", total, num_squads)
    }
    if len(rows) != 2 {
        t.Errorf("rows = %d, want 2 (limit=2 offset=1)", len(rows))
    }
}