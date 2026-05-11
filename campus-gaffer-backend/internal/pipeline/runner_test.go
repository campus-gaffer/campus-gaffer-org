package pipeline

import (
	"campus-gaffer-backend/internal/scraper"
	"context"
	"errors"
	"strings"
	"testing"
)

type fakeDiscovery struct {
	teams       []scraper.ScrapedTeamItem
	teamsErr    error
	gamesByTeam map[string][]scraper.ScrapedGameSummary
	errByTeam   map[string]error
	gamesCalls  map[string]int
}

func (f *fakeDiscovery) GetLeagueTeams(_ context.Context) ([]scraper.ScrapedTeamItem, error) {
	return f.teams, f.teamsErr
}

func (f *fakeDiscovery) GetCurrentSeasonGames(_ context.Context, teamId string) ([]scraper.ScrapedGameSummary, error) {
	if f.gamesCalls == nil {
		f.gamesCalls = map[string]int{}
	}
	f.gamesCalls[teamId]++
	if err, ok := f.errByTeam[teamId]; ok {
		return nil, err
	}
	return f.gamesByTeam[teamId], nil
}

type fakeGameService struct {
	syncErr    error
	processErr error

	syncCalls    int
	processCalls int
	syncedGames  []scraper.ScrapedGameSummary
}

func (f *fakeGameService) SyncGames(_ context.Context, games []scraper.ScrapedGameSummary) error {
	f.syncCalls++
	f.syncedGames = games
	return f.syncErr
}

func (f *fakeGameService) ProcessCompletedGames(_ context.Context) error {
	f.processCalls++
	return f.processErr
}

type fakeScoringService struct {
	scoreErr   error
	scoreCalls int
}

func (f *fakeScoringService) ScoreCompletedGames(_ context.Context) error {
	f.scoreCalls++
	return f.scoreErr
}

func teams(ids ...string) []scraper.ScrapedTeamItem {
	out := make([]scraper.ScrapedTeamItem, len(ids))
	for i, id := range ids {
		out[i] = scraper.ScrapedTeamItem{TeamId: id, TeamName: "team-" + id}
	}
	return out
}

func games(ids ...string) []scraper.ScrapedGameSummary {
	out := make([]scraper.ScrapedGameSummary, len(ids))
	for i, id := range ids {
		out[i] = scraper.ScrapedGameSummary{ExternalId: id}
	}
	return out
}

func TestRunner_HappyPath(t *testing.T) {
	d := &fakeDiscovery{
		teams: teams("a", "b"),
		gamesByTeam: map[string][]scraper.ScrapedGameSummary{
			"a": games("g1", "g2"),
			"b": games("g3"),
		},
	}
	svc := &fakeGameService{}

	if err := NewRunner(d, svc, &fakeScoringService{}).Run(context.Background()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if svc.syncCalls != 1 {
		t.Errorf("SyncGames calls = %d, want 1", svc.syncCalls)
	}
	if svc.processCalls != 1 {
		t.Errorf("ProcessCompletedGames calls = %d, want 1", svc.processCalls)
	}
	if got := len(svc.syncedGames); got != 3 {
		t.Errorf("synced games count = %d, want 3", got)
	}
}

func TestRunner_SingleTeamDiscoveryFails_RunContinues(t *testing.T) {
	d := &fakeDiscovery{
		teams: teams("a", "b", "c"),
		gamesByTeam: map[string][]scraper.ScrapedGameSummary{
			"a": games("g1"),
			"c": games("g2"),
		},
		errByTeam: map[string]error{
			"b": errors.New("boom"),
		},
	}
	svc := &fakeGameService{}

	if err := NewRunner(d, svc, &fakeScoringService{}).Run(context.Background()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if svc.syncCalls != 1 {
		t.Errorf("SyncGames calls = %d, want 1", svc.syncCalls)
	}
	if svc.processCalls != 1 {
		t.Errorf("ProcessCompletedGames calls = %d, want 1", svc.processCalls)
	}
	if got := len(svc.syncedGames); got != 2 {
		t.Errorf("synced games count = %d, want 2 (b excluded)", got)
	}
}

func TestRunner_AllTeamsFailDiscovery_ReturnsError(t *testing.T) {
	teamsErr := errors.New("upstream-down")
	d := &fakeDiscovery{
		teams: teams("a", "b"),
		errByTeam: map[string]error{
			"a": teamsErr,
			"b": teamsErr,
		},
	}
	svc := &fakeGameService{}

	err := NewRunner(d, svc, &fakeScoringService{}).Run(context.Background())
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "all 2 teams failed") {
		t.Errorf("error = %q, want it to mention all-teams failure", err.Error())
	}
	if svc.syncCalls != 0 {
		t.Errorf("SyncGames must not be called when all teams fail; got %d", svc.syncCalls)
	}
	if svc.processCalls != 0 {
		t.Errorf("ProcessCompletedGames must not be called when all teams fail; got %d", svc.processCalls)
	}
}

func TestRunner_GetLeagueTeamsFails_ReturnsError(t *testing.T) {
	d := &fakeDiscovery{teamsErr: errors.New("auth-expired")}
	svc := &fakeGameService{}

	err := NewRunner(d, svc, &fakeScoringService{}).Run(context.Background())
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if svc.syncCalls != 0 || svc.processCalls != 0 {
		t.Errorf("downstream must not be called when GetLeagueTeams fails")
	}
}

func TestRunner_NoTeams_NoOpSuccess(t *testing.T) {
	d := &fakeDiscovery{teams: nil}
	svc := &fakeGameService{}

	if err := NewRunner(d, svc, &fakeScoringService{}).Run(context.Background()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if svc.syncCalls != 0 || svc.processCalls != 0 {
		t.Errorf("downstream must not be called when there are no teams")
	}
}

func TestRunner_SyncGamesFails_AbortsBeforeProcess(t *testing.T) {
	d := &fakeDiscovery{
		teams:       teams("a"),
		gamesByTeam: map[string][]scraper.ScrapedGameSummary{"a": games("g1")},
	}
	svc := &fakeGameService{syncErr: errors.New("db-down")}

	err := NewRunner(d, svc, &fakeScoringService{}).Run(context.Background())
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if svc.processCalls != 0 {
		t.Errorf("ProcessCompletedGames must not run after SyncGames failure; got %d calls", svc.processCalls)
	}
}

func TestRunner_ProcessCompletedGamesFails_Surfaces(t *testing.T) {
	d := &fakeDiscovery{
		teams:       teams("a"),
		gamesByTeam: map[string][]scraper.ScrapedGameSummary{"a": games("g1")},
	}
	svc := &fakeGameService{processErr: errors.New("session-expired")}

	err := NewRunner(d, svc, &fakeScoringService{}).Run(context.Background())
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !strings.Contains(err.Error(), "process completed games") {
		t.Errorf("error = %q, want it to mention the failing stage", err.Error())
	}
}
