package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"context"
	"math"
	"testing"
	"time"

	"github.com/google/uuid"
)

// --- fakes ---

type fakeGamePointRepo struct {
	rows    []repository.PlayerAvgPoints
	err     error
	calls   int
	lastVer string
	lastCut time.Time
}

func (f *fakeGamePointRepo) Upsert(context.Context, *models.PlayerGamePoint) (*models.PlayerGamePoint, error) {
	return nil, nil
}
func (f *fakeGamePointRepo) FindById(context.Context, uuid.UUID) (*models.PlayerGamePoint, error) {
	return nil, nil
}
func (f *fakeGamePointRepo) AvgPointsByPlayer(_ context.Context, weightVer string, cutoff time.Time) ([]repository.PlayerAvgPoints, error) {
	f.calls++
	f.lastVer = weightVer
	f.lastCut = cutoff
	return f.rows, f.err
}
func (f *fakeGamePointRepo) TopScorerInGames(_ context.Context, _ []uuid.UUID, _ string) (*repository.TopScorerRow, error) {
	return nil, nil
}

type fakePriceRepo struct {
	batches  [][]models.PlayerPrice
	inserted int
	err      error
}

func (f *fakePriceRepo) Upsert(context.Context, *models.PlayerPrice) (*models.PlayerPrice, error) {
	return nil, nil
}
func (f *fakePriceRepo) InsertBatch(_ context.Context, records []models.PlayerPrice) (int, error) {
	cp := make([]models.PlayerPrice, len(records))
	copy(cp, records)
	f.batches = append(f.batches, cp)
	return f.inserted, f.err
}
func (f *fakePriceRepo) GetEffectivePrice(context.Context, uuid.UUID, int) (float64, error) {
	return 0, nil
}
func (f *fakePriceRepo) MaxPricedGameweek(context.Context) (int, error) {
	return 0, nil
}

// --- helpers ---

func newSvc(gp *fakeGamePointRepo, pr *fakePriceRepo) PlayerPriceService {
	return &playerPriceService{
		gamePointRepo: gp,
		priceRepo:     pr,
		weightVer:     WeightVerV1,
	}
}

func id(t *testing.T) uuid.UUID {
	t.Helper()
	return uuid.New()
}

func priceFor(t *testing.T, batch []models.PlayerPrice, playerID uuid.UUID) (float64, bool) {
	t.Helper()
	for _, r := range batch {
		if r.PlayerId == playerID {
			return r.Price, true
		}
	}
	return 0, false
}

func nearly(a, b float64) bool { return math.Abs(a-b) < 1e-9 }

// --- tests ---

func TestComputeGameweekPrices_AllZeroAvgs_WritesNothing(t *testing.T) {
	// Every player has avg 0 → maxAvg <= 0 → no rows written. The current
	// behaviour is explicit per the issue: we do not emit a slab of floor
	// prices when the algorithm has no signal.
	gp := &fakeGamePointRepo{rows: []repository.PlayerAvgPoints{
		{PlayerID: id(t), AvgPts: 0},
		{PlayerID: id(t), AvgPts: 0},
	}}
	pr := &fakePriceRepo{}
	err := newSvc(gp, pr).ComputeGameweekPrices(context.Background(), 3, time.Now())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(pr.batches) != 0 {
		t.Fatalf("expected no batches written, got %d", len(pr.batches))
	}
}

func TestComputeGameweekPrices_NoQualifyingRows_WritesNothing(t *testing.T) {
	// Aggregate returns zero rows (start of season, no points yet).
	gp := &fakeGamePointRepo{rows: nil}
	pr := &fakePriceRepo{}
	err := newSvc(gp, pr).ComputeGameweekPrices(context.Background(), 1, time.Now())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(pr.batches) != 0 {
		t.Fatalf("expected no write call, got %d batches", len(pr.batches))
	}
}

func TestComputeGameweekPrices_SingleDominantPlayer_TopHits10(t *testing.T) {
	top, mid, low := id(t), id(t), id(t)
	gp := &fakeGamePointRepo{rows: []repository.PlayerAvgPoints{
		{PlayerID: top, AvgPts: 10.0},
		{PlayerID: mid, AvgPts: 5.0},
		{PlayerID: low, AvgPts: 1.0},
	}}
	pr := &fakePriceRepo{}
	if err := newSvc(gp, pr).ComputeGameweekPrices(context.Background(), 3, time.Now()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(pr.batches) != 1 || len(pr.batches[0]) != 3 {
		t.Fatalf("expected one batch of 3, got %v", pr.batches)
	}

	topPrice, _ := priceFor(t, pr.batches[0], top)
	midPrice, _ := priceFor(t, pr.batches[0], mid)
	lowPrice, _ := priceFor(t, pr.batches[0], low)

	if !nearly(topPrice, PriceMax) {
		t.Errorf("top player price = %.4f, want %.4f", topPrice, PriceMax)
	}
	// mid: 4 + (5/10) * 6 = 7.0
	if !nearly(midPrice, 7.0) {
		t.Errorf("mid player price = %.4f, want 7.0", midPrice)
	}
	// low: 4 + (1/10) * 6 = 4.6
	if !nearly(lowPrice, 4.6) {
		t.Errorf("low player price = %.4f, want 4.6", lowPrice)
	}
}

func TestComputeGameweekPrices_TiesAtMax_AllHit10(t *testing.T) {
	a, b, c := id(t), id(t), id(t)
	gp := &fakeGamePointRepo{rows: []repository.PlayerAvgPoints{
		{PlayerID: a, AvgPts: 8.0},
		{PlayerID: b, AvgPts: 8.0},
		{PlayerID: c, AvgPts: 4.0},
	}}
	pr := &fakePriceRepo{}
	if err := newSvc(gp, pr).ComputeGameweekPrices(context.Background(), 3, time.Now()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	pa, _ := priceFor(t, pr.batches[0], a)
	pb, _ := priceFor(t, pr.batches[0], b)
	pc, _ := priceFor(t, pr.batches[0], c)
	if !nearly(pa, PriceMax) || !nearly(pb, PriceMax) {
		t.Errorf("tied players priced %.4f, %.4f, want both %.4f", pa, pb, PriceMax)
	}
	// c: 4 + (4/8) * 6 = 7.0
	if !nearly(pc, 7.0) {
		t.Errorf("non-max priced %.4f, want 7.0", pc)
	}
}

func TestComputeGameweekPrices_OnlyAggregateOutputProducesRows(t *testing.T) {
	// Inactive players don't appear in AvgPointsByPlayer at all (the
	// aggregate's INNER JOIN excludes them). The service must not invent
	// rows for anyone the aggregate didn't return — there's no players
	// repo on the hot path.
	active := id(t)
	gp := &fakeGamePointRepo{rows: []repository.PlayerAvgPoints{
		{PlayerID: active, AvgPts: 5.0},
	}}
	pr := &fakePriceRepo{}
	if err := newSvc(gp, pr).ComputeGameweekPrices(context.Background(), 3, time.Now()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(pr.batches[0]) != 1 {
		t.Fatalf("expected exactly 1 row (the active player), got %d", len(pr.batches[0]))
	}
	if pr.batches[0][0].PlayerId != active {
		t.Errorf("wrong player priced: got %s, want %s", pr.batches[0][0].PlayerId, active)
	}
}

func TestComputeGameweekPrices_PassesCutoffAndWeightVerToAggregate(t *testing.T) {
	// Boundary contract: the kickoff cutoff and weight_ver supplied to the
	// service end up on the aggregate query unchanged. Regression guard
	// against the previous bug where the service passed gameweek as a
	// per-player ordinal.
	cutoff := time.Date(2026, 5, 11, 23, 59, 59, 0, time.UTC)
	gp := &fakeGamePointRepo{rows: []repository.PlayerAvgPoints{{PlayerID: id(t), AvgPts: 1}}}
	pr := &fakePriceRepo{}
	if err := newSvc(gp, pr).ComputeGameweekPrices(context.Background(), 5, cutoff); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !gp.lastCut.Equal(cutoff) {
		t.Errorf("aggregate got cutoff %v, want %v", gp.lastCut, cutoff)
	}
	if gp.lastVer != WeightVerV1 {
		t.Errorf("aggregate got weight_ver %q, want %q", gp.lastVer, WeightVerV1)
	}
}

func TestComputeGameweekPrices_RerunIsStateless(t *testing.T) {
	// The service is stateless: a re-run for the same gameweek issues the
	// same batch. Idempotency lives in the repo (ON CONFLICT DO NOTHING),
	// not here — we just verify the service does its half consistently.
	gp := &fakeGamePointRepo{rows: []repository.PlayerAvgPoints{
		{PlayerID: id(t), AvgPts: 5.0},
		{PlayerID: id(t), AvgPts: 2.5},
	}}
	pr := &fakePriceRepo{}
	svc := newSvc(gp, pr)
	for i := 0; i < 2; i++ {
		if err := svc.ComputeGameweekPrices(context.Background(), 3, time.Now()); err != nil {
			t.Fatalf("run %d: %v", i, err)
		}
	}
	if len(pr.batches) != 2 {
		t.Fatalf("expected 2 batches, got %d", len(pr.batches))
	}
	if len(pr.batches[0]) != len(pr.batches[1]) {
		t.Errorf("batch sizes differ across runs: %d vs %d", len(pr.batches[0]), len(pr.batches[1]))
	}
}
