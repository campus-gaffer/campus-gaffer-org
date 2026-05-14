package service

import (
	"campus-gaffer-backend/internal/models"
	"context"
	"testing"

	"github.com/google/uuid"
)

// ----- score() -----

func TestScore_Absent_ZeroRegardlessOfOtherFields(t *testing.T) {
	// Universal gate: GamePlayed=false ⇒ 0, even with goals + MVP + Win.
	perf := models.PlayerPerformance{GamePlayed: false, Goals: 3, IsMVP: true}
	got := score(perf, OutcomeWin, WeightsV1)
	if got != 0 {
		t.Errorf("absent player scored %d, want 0", got)
	}
}

func TestScore_AppearanceOnly_LossNoGoals(t *testing.T) {
	perf := models.PlayerPerformance{GamePlayed: true}
	got := score(perf, OutcomeLoss, WeightsV1)
	if got != 2 {
		t.Errorf("played + lost = %d, want 2 (appearance only)", got)
	}
}

func TestScore_PlayedDrew_NoGoals(t *testing.T) {
	perf := models.PlayerPerformance{GamePlayed: true}
	got := score(perf, OutcomeDraw, WeightsV1)
	if got != 3 {
		t.Errorf("played + drew = %d, want 3 (appearance + draw)", got)
	}
}

func TestScore_PlayedWon_NoGoals(t *testing.T) {
	perf := models.PlayerPerformance{GamePlayed: true}
	got := score(perf, OutcomeWin, WeightsV1)
	if got != 4 {
		t.Errorf("played + won = %d, want 4 (appearance + win)", got)
	}
}

func TestScore_OneGoalLost(t *testing.T) {
	// Goal weight should apply even when team loses.
	perf := models.PlayerPerformance{GamePlayed: true, Goals: 1}
	got := score(perf, OutcomeLoss, WeightsV1)
	if got != 6 {
		t.Errorf("played + 1 goal + lost = %d, want 6", got)
	}
}

func TestScore_HatTrickWonMVP_Ceiling(t *testing.T) {
	// Hat-trick + MVP + Win
	perf := models.PlayerPerformance{GamePlayed: true, Goals: 3, IsMVP: true}
	got := score(perf, OutcomeWin, WeightsV1)
	want := 2 + 3*4 + 3 + 2 // appearance + 3*goal + mvp + win
	if got != want {
		t.Errorf("hat-trick + MVP + win = %d, want %d", got, want)
	}
}

func TestScore_FiveGoalsMVPWin_DesignDocCeiling(t *testing.T) {
	perf := models.PlayerPerformance{GamePlayed: true, Goals: 5, IsMVP: true}
	got := score(perf, OutcomeWin, WeightsV1)
	if got != 27 {
		t.Errorf("design-doc ceiling = %d, want 27", got)
	}
}

func TestScore_MVPWithoutGoals_PlayedDrew(t *testing.T) {
	// MVP can come without goals (e.g. defensive shift).
	perf := models.PlayerPerformance{GamePlayed: true, IsMVP: true}
	got := score(perf, OutcomeDraw, WeightsV1)
	want := 2 + 3 + 1 // appearance + mvp + draw
	if got != want {
		t.Errorf("MVP-no-goals + drew = %d, want %d", got, want)
	}
}

func TestScore_OutcomeUnknown_NoTeamBonus(t *testing.T) {
	// Player with nil TeamId or unresolvable outcome: no W/D/L bonus,
	// but appearance + goals + mvp still apply.
	perf := models.PlayerPerformance{GamePlayed: true, Goals: 1, IsMVP: true}
	got := score(perf, OutcomeUnknown, WeightsV1)
	want := 2 + 4 + 3 // appearance + goal + mvp
	if got != want {
		t.Errorf("unknown outcome = %d, want %d (no team bonus)", got, want)
	}
}

// ----- outcomesByTeam() -----

func TestOutcomesByTeam_Empty(t *testing.T) {
	out := outcomesByTeam(nil)
	if len(out) != 0 {
		t.Errorf("empty perfs: got %d outcomes, want 0", len(out))
	}
}

func TestOutcomesByTeam_NilTeamIdsExcluded(t *testing.T) {
	// Perfs with nil TeamId can't be team-attributed, so they shouldn't
	// affect any team's goal sum.
	perfs := []models.PlayerPerformance{
		{TeamId: nil, Goals: 5},
		{TeamId: nil, Goals: 5},
	}
	out := outcomesByTeam(perfs)
	if len(out) != 0 {
		t.Errorf("all-nil-team perfs: got %d outcomes, want 0", len(out))
	}
}

func TestOutcomesByTeam_SingleTeam_TreatedAsDraw(t *testing.T) {
	// Only one team has perfs, no opponent to compare to.
	tid := uuid.New()
	perfs := []models.PlayerPerformance{
		{TeamId: &tid, Goals: 3},
	}
	out := outcomesByTeam(perfs)
	if out[tid] != OutcomeDraw {
		t.Errorf("single team outcome = %v, want OutcomeDraw", out[tid])
	}
}

func TestOutcomesByTeam_ClearWinner(t *testing.T) {
	home, away := uuid.New(), uuid.New()
	perfs := []models.PlayerPerformance{
		{TeamId: &home, Goals: 2},
		{TeamId: &home, Goals: 1},
		{TeamId: &away, Goals: 1},
	}
	out := outcomesByTeam(perfs)
	if out[home] != OutcomeWin {
		t.Errorf("home outcome = %v, want OutcomeWin (home 3 vs away 1)", out[home])
	}
	if out[away] != OutcomeLoss {
		t.Errorf("away outcome = %v, want OutcomeLoss", out[away])
	}
}

func TestOutcomesByTeam_Draw_BothTeamsEqual(t *testing.T) {
	home, away := uuid.New(), uuid.New()
	perfs := []models.PlayerPerformance{
		{TeamId: &home, Goals: 2},
		{TeamId: &away, Goals: 1},
		{TeamId: &away, Goals: 1},
	}
	out := outcomesByTeam(perfs)
	if out[home] != OutcomeDraw {
		t.Errorf("home outcome = %v, want OutcomeDraw (2-2)", out[home])
	}
	if out[away] != OutcomeDraw {
		t.Errorf("away outcome = %v, want OutcomeDraw", out[away])
	}
}

func TestOutcomesByTeam_GoallessDraw(t *testing.T) {
	home, away := uuid.New(), uuid.New()
	perfs := []models.PlayerPerformance{
		{TeamId: &home, Goals: 0},
		{TeamId: &away, Goals: 0},
	}
	out := outcomesByTeam(perfs)
	if out[home] != OutcomeDraw || out[away] != OutcomeDraw {
		t.Errorf("0-0 outcomes = %v / %v, want both OutcomeDraw", out[home], out[away])
	}
}

// ----- ScoringService.scoreGame() -----

// scoringFixture builds a 2-team game with player perfs, returns the game
// and pointers to the team UUIDs the perfs reference.
func scoringFixture() (models.Game, uuid.UUID, uuid.UUID, []models.PlayerPerformance) {
	gameId := uuid.New()
	home := uuid.New()
	away := uuid.New()
	game := models.Game{Id: gameId}
	perfs := []models.PlayerPerformance{
		// Home team: 2-0 winners
		{PlayerId: uuid.New(), GameId: gameId, TeamId: &home, GamePlayed: true, Goals: 2, IsMVP: true},
		{PlayerId: uuid.New(), GameId: gameId, TeamId: &home, GamePlayed: true, Goals: 0},
		{PlayerId: uuid.New(), GameId: gameId, TeamId: &home, GamePlayed: false}, // benched
		// Away team
		{PlayerId: uuid.New(), GameId: gameId, TeamId: &away, GamePlayed: true, Goals: 0, IsMVP: true},
		{PlayerId: uuid.New(), GameId: gameId, TeamId: &away, GamePlayed: true, Goals: 0},
	}
	return game, home, away, perfs
}

func TestScoreGame_NormalGame_AppliesWinDrawLoss(t *testing.T) {
	game, _, _, perfs := scoringFixture()
	gameRepo := &MockGameRepository{}
	perfRepo := &MockPerformanceRepository{byGameId: map[uuid.UUID][]models.PlayerPerformance{game.Id: perfs}}
	pointsRepo := &MockPlayerGamePointRepo{}
	svc := &scoringService{
		gameRepo:   gameRepo,
		perfRepo:   perfRepo,
		pointsRepo: pointsRepo,
		weights:    WeightsV1,
		weightVer:  WeightVerV1,
	}

	if err := svc.scoreGame(context.Background(), game); err != nil {
		t.Fatalf("scoreGame: %v", err)
	}

	if len(pointsRepo.upsertCalls) != len(perfs) {
		t.Fatalf("upserted %d, want %d (one per perf)", len(pointsRepo.upsertCalls), len(perfs))
	}

	// Index upserts by player_id for assertion.
	got := map[uuid.UUID]int{}
	for _, c := range pointsRepo.upsertCalls {
		got[c.PlayerId] = c.Points
	}

	// Home scorer + MVP + Win = 2 + 8 + 3 + 2 = 15
	if pts := got[perfs[0].PlayerId]; pts != 15 {
		t.Errorf("home scorer-MVP-win pts = %d, want 15", pts)
	}
	// Home played-no-goals + Win = 2 + 2 = 4
	if pts := got[perfs[1].PlayerId]; pts != 4 {
		t.Errorf("home played + win pts = %d, want 4", pts)
	}
	// Home benched = 0
	if pts := got[perfs[2].PlayerId]; pts != 0 {
		t.Errorf("home benched pts = %d, want 0", pts)
	}
	// Away MVP + Loss = 2 + 3 = 5 (no win/draw bonus)
	if pts := got[perfs[3].PlayerId]; pts != 5 {
		t.Errorf("away MVP + lost pts = %d, want 5", pts)
	}
	// Away played + Loss = 2
	if pts := got[perfs[4].PlayerId]; pts != 2 {
		t.Errorf("away played + lost pts = %d, want 2", pts)
	}
}

func TestScoreGame_Forfeit_AllPlayersZero(t *testing.T) {
	// Forfeit gate: regardless of goals, MVP, or attendance, every roster
	// member on both teams scores 0 for the game.
	game, _, _, perfs := scoringFixture()
	awayForfeit := "away"
	game.ForfeitedBy = &awayForfeit

	pointsRepo := &MockPlayerGamePointRepo{}
	svc := &scoringService{
		gameRepo:   &MockGameRepository{},
		perfRepo:   &MockPerformanceRepository{byGameId: map[uuid.UUID][]models.PlayerPerformance{game.Id: perfs}},
		pointsRepo: pointsRepo,
		weights:    WeightsV1,
		weightVer:  WeightVerV1,
	}

	if err := svc.scoreGame(context.Background(), game); err != nil {
		t.Fatalf("scoreGame: %v", err)
	}

	if len(pointsRepo.upsertCalls) != len(perfs) {
		t.Fatalf("upserted %d, want %d (still one row per perf, just zero)", len(pointsRepo.upsertCalls), len(perfs))
	}
	for _, c := range pointsRepo.upsertCalls {
		if c.Points != 0 {
			t.Errorf("forfeit gave %d pts to player %s, want 0", c.Points, c.PlayerId)
		}
	}
}

func TestScoreGame_NoPerfs_Noop(t *testing.T) {
	// Game with no performance rows shouldn't write anything.
	game := models.Game{Id: uuid.New()}
	pointsRepo := &MockPlayerGamePointRepo{}
	svc := &scoringService{
		gameRepo:   &MockGameRepository{},
		perfRepo:   &MockPerformanceRepository{}, // byGameId nil ⇒ returns nil
		pointsRepo: pointsRepo,
		weights:    WeightsV1,
		weightVer:  WeightVerV1,
	}

	if err := svc.scoreGame(context.Background(), game); err != nil {
		t.Fatalf("scoreGame: %v", err)
	}
	if len(pointsRepo.upsertCalls) != 0 {
		t.Errorf("upserted %d for empty game, want 0", len(pointsRepo.upsertCalls))
	}
}

func TestScoreGame_PerfWithNilTeamId_GetsBaseAndGoalsButNoTeamBonus(t *testing.T) {
	// Player with nil TeamId: appearance + goals + MVP apply, but no team
	// bonus (we can't know which team to assign to).
	gameId := uuid.New()
	game := models.Game{Id: gameId}
	playerId := uuid.New()
	perfs := []models.PlayerPerformance{
		{PlayerId: playerId, GameId: gameId, TeamId: nil, GamePlayed: true, Goals: 1, IsMVP: true},
	}
	pointsRepo := &MockPlayerGamePointRepo{}
	svc := &scoringService{
		gameRepo:   &MockGameRepository{},
		perfRepo:   &MockPerformanceRepository{byGameId: map[uuid.UUID][]models.PlayerPerformance{gameId: perfs}},
		pointsRepo: pointsRepo,
		weights:    WeightsV1,
		weightVer:  WeightVerV1,
	}

	if err := svc.scoreGame(context.Background(), game); err != nil {
		t.Fatalf("scoreGame: %v", err)
	}

	if len(pointsRepo.upsertCalls) != 1 {
		t.Fatalf("upserts = %d, want 1", len(pointsRepo.upsertCalls))
	}
	want := 2 + 4 + 3 // appearance + goal + mvp; no W/D bonus
	if got := pointsRepo.upsertCalls[0].Points; got != want {
		t.Errorf("nil-team perf pts = %d, want %d", got, want)
	}
}

func TestScoreGame_PointsRowKeyedOnWeightVer(t *testing.T) {
	// Every upserted record carries the service's weight_ver. This enables
	// recompute side-by-side without overwriting historical scores.
	game, _, _, perfs := scoringFixture()
	pointsRepo := &MockPlayerGamePointRepo{}
	svc := &scoringService{
		gameRepo:   &MockGameRepository{},
		perfRepo:   &MockPerformanceRepository{byGameId: map[uuid.UUID][]models.PlayerPerformance{game.Id: perfs}},
		pointsRepo: pointsRepo,
		weights:    WeightsV1,
		weightVer:  "test-version",
	}

	if err := svc.scoreGame(context.Background(), game); err != nil {
		t.Fatalf("scoreGame: %v", err)
	}
	for _, c := range pointsRepo.upsertCalls {
		if c.WeightVer != "test-version" {
			t.Errorf("WeightVer = %q, want %q", c.WeightVer, "test-version")
		}
	}
}
