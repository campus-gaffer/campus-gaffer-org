package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"context"
	"testing"

	"github.com/google/uuid"
)

// --- fakes ---

type fakeSquadRepo struct {
	squads              map[uuid.UUID]*models.Squad
	players             map[uuid.UUID][]models.SquadPlayer
	err                 error
	totalPointsOverride map[uuid.UUID]int
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

func (f *fakeSquadRepo) FindByUserID(_ context.Context, userID uuid.UUID) (*models.Squad, error) {
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

// --- helpers ---

func makeIDs(n int) []uuid.UUID {
	ids := make([]uuid.UUID, n)
	for i := range ids {
		ids[i] = uuid.New()
	}
	return ids
}

func newSquadSvc(sr *fakeSquadRepo, pr *fakeSquadPriceRepo) SquadService {
	return &squadService{squadRepo: sr, priceRepo: pr}
}

func validReq(starters, bench []uuid.UUID) CreateSquadRequest {
	return CreateSquadRequest{UserID: uuid.New(), Gameweek: 1, Starters: starters, Bench: bench}
}

// --- tests ---

func TestCreateSquad_Valid_Succeeds(t *testing.T) {
	starters := makeIDs(OnFieldCount)
	bench := makeIDs(BenchCount)
	svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{})

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
		svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{})
		_, _, err := svc.CreateSquad(context.Background(), validReq(makeIDs(n), makeIDs(BenchCount)))
		if err != ErrWrongStarterCount {
			t.Errorf("starters=%d: got %v, want ErrWrongStarterCount", n, err)
		}
	}
}

func TestCreateSquad_WrongBenchCount_Rejected(t *testing.T) {
	for _, n := range []int{0, 3, 5} {
		svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{})
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
	svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{})
	_, _, err := svc.CreateSquad(context.Background(), validReq(starters, bench))
	if err != ErrDuplicatePlayer {
		t.Errorf("got %v, want ErrDuplicatePlayer", err)
	}
}

func TestCreateSquad_BudgetExceeded_Rejected(t *testing.T) {
	starters := makeIDs(OnFieldCount)
	bench := makeIDs(BenchCount)
	prices := make(map[uuid.UUID]float64, len(starters)+len(bench))
	for _, id := range append(starters, bench...) {
		prices[id] = PriceMax // 10 × 10 = 100 > 65
	}
	svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{prices: prices})
	_, _, err := svc.CreateSquad(context.Background(), validReq(starters, bench))
	if err != ErrBudgetExceeded {
		t.Errorf("got %v, want ErrBudgetExceeded", err)
	}
}

func TestCreateSquad_UserAlreadyHasSquad_Rejected(t *testing.T) {
	userID := uuid.New()
	sr := newFakeSquadRepo()
	svc := newSquadSvc(sr, &fakeSquadPriceRepo{})

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
	svc := newSquadSvc(sr, &fakeSquadPriceRepo{prices: prices})

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
	svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{})
	_, _, err := svc.GetSquad(context.Background(), uuid.New())
	if err != ErrSquadNotFound {
		t.Errorf("got %v, want ErrSquadNotFound", err)
	}
}

func TestGetSquadPoints_StartersOnlyCountToTotal(t *testing.T) {
	starters := makeIDs(OnFieldCount)
	bench := makeIDs(BenchCount)
	sr := newFakeSquadRepo()
	svc := newSquadSvc(sr, &fakeSquadPriceRepo{})

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

	resp, err := svc.GetSquadPoints(context.Background(), squad.Id)
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

func TestGetSquadPoints_NotFound_ReturnsError(t *testing.T) {
	svc := newSquadSvc(newFakeSquadRepo(), &fakeSquadPriceRepo{})
	_, err := svc.GetSquadPoints(context.Background(), uuid.New())
	if err != ErrSquadNotFound {
		t.Errorf("got %v, want ErrSquadNotFound", err)
	}
}
