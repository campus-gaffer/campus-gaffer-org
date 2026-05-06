package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/scraper"
	"context"
	"errors"
	"fmt"
	"testing"

	"github.com/google/uuid"
)

// MockGameRepository mocks the GameRepository for testing.
type MockGameRepository struct {
	upsertCalls []models.Game
	upsertErr   error
}

func (m *MockGameRepository) Upsert(ctx context.Context, game *models.Game) (*models.Game, error) {
	if m.upsertErr != nil {
		return nil, m.upsertErr
	}
	m.upsertCalls = append(m.upsertCalls, *game)
	game.Id = uuid.New()
	return game, nil
}

func (m *MockGameRepository) FindUnscraped(ctx context.Context) ([]models.Game, error) {
	return nil, nil
}

func (m *MockGameRepository) MarkScraped(ctx context.Context, gameId uuid.UUID) error {
	return nil
}

func (m *MockGameRepository) FindByExternalId(ctx context.Context, externalId, externalSource string) (*models.Game, error) {
	return nil, nil
}

// MockPerformanceRepository mocks the PerformanceRepository for testing.
type MockPerformanceRepository struct{}

func (m *MockPerformanceRepository) Upsert(ctx context.Context, perf *models.PlayerPerformance) (*models.PlayerPerformance, error) {
	return perf, nil
}

func (m *MockPerformanceRepository) FindByGameIdAndPlayerId(ctx context.Context, gameId, playerId uuid.UUID) (*models.PlayerPerformance, error) {
	return nil, nil
}

// MockPlayerRepository mocks the PlayerRepository for testing.
type MockPlayerRepository struct{}

func (m *MockPlayerRepository) Upsert(ctx context.Context, player *models.Player) (*models.Player, error) {
	player.Id = uuid.New()
	return player, nil
}

func (m *MockPlayerRepository) FindByExternalID(ctx context.Context, externalId string) *models.Player {
	return nil
}

// MockTeamRepository mocks the TeamRepository for testing.
type MockTeamRepository struct{}

func (m *MockTeamRepository) Upsert(ctx context.Context, team *models.Team) (*models.Team, error) {
	team.Id = uuid.New()
	return team, nil
}

func (m *MockTeamRepository) FindByExternalId(ctx context.Context, externalId, externalSource string) (*models.Team, error) {
	return nil, nil
}

// MockDiscoveryScraper mocks the DiscoveryScraper for testing.
type MockDiscoveryScraper struct{}

func (m *MockDiscoveryScraper) GetLeagueTeams(ctx context.Context) ([]scraper.ScrapedTeamItem, error) {
	return nil, nil
}

func (m *MockDiscoveryScraper) GetCurrentSeasonGames(ctx context.Context, teamId string) ([]scraper.ScrapedGameSummary, error) {
	return nil, nil
}

// MockStatsScraper mocks the StatsScraper for testing.
type MockStatsScraper struct{}

func (m *MockStatsScraper) GetGameData(ctx context.Context, ref scraper.GameRef) (*scraper.ScrapedGameDetails, error) {
	return nil, nil
}

func (m *MockStatsScraper) GetPlayerData(ctx context.Context, playerId string) (*scraper.ScrapedPlayerInfo, error) {
	return nil, nil
}

// TestSyncGames_DeduplicatesScrapedPayload tests that duplicate ExternalIds in the scraped
// payload are deduplicated and only the first occurrence is upserted.
func TestSyncGames_DeduplicatesScrapedPayload(t *testing.T) {
	mockGameRepo := &MockGameRepository{}
	svc := &gameService{
		discovery:  &MockDiscoveryScraper{},
		stats:      &MockStatsScraper{},
		gameRepo:   mockGameRepo,
		perfRepo:   &MockPerformanceRepository{},
		playerRepo: &MockPlayerRepository{},
		teamRepo:   &MockTeamRepository{},
	}

	// Create scraped games with duplicates: A, B, A, C
	scraped := []scraper.ScrapedGameSummary{
		{ExternalId: "game-A", ExternalSource: "test", HomeTeamId: "team-1", OpponentTeamId: "team-2"},
		{ExternalId: "game-B", ExternalSource: "test", HomeTeamId: "team-1", OpponentTeamId: "team-3"},
		{ExternalId: "game-A", ExternalSource: "test", HomeTeamId: "team-1", OpponentTeamId: "team-2"}, // duplicate
		{ExternalId: "game-C", ExternalSource: "test", HomeTeamId: "team-1", OpponentTeamId: "team-4"},
	}

	ctx := context.Background()
	err := svc.SyncGames(ctx, scraped)
	if err != nil {
		t.Fatalf("SyncGames failed: %v", err)
	}

	// Expect 3 upserts (one for each unique ExternalId: A, B, C)
	if len(mockGameRepo.upsertCalls) != 3 {
		t.Errorf("expected 3 upsert calls, got %d", len(mockGameRepo.upsertCalls))
	}

	// Verify the unique games were upserted
	externalIds := make(map[string]bool)
	for _, game := range mockGameRepo.upsertCalls {
		externalIds[game.ExternalGameId] = true
	}

	expectedIds := map[string]bool{"game-A": true, "game-B": true, "game-C": true}
	for id := range expectedIds {
		if !externalIds[id] {
			t.Errorf("expected upsert for game %s, but not found", id)
		}
	}
}

// TestSyncGames_SkipsEmptyExternalId tests that games with empty ExternalId are skipped.
func TestSyncGames_SkipsEmptyExternalId(t *testing.T) {
	mockGameRepo := &MockGameRepository{}
	svc := &gameService{
		discovery:  &MockDiscoveryScraper{},
		stats:      &MockStatsScraper{},
		gameRepo:   mockGameRepo,
		perfRepo:   &MockPerformanceRepository{},
		playerRepo: &MockPlayerRepository{},
		teamRepo:   &MockTeamRepository{},
	}

	scraped := []scraper.ScrapedGameSummary{
		{ExternalId: "game-A", ExternalSource: "test", HomeTeamId: "team-1", OpponentTeamId: "team-2"},
		{ExternalId: "", ExternalSource: "test", HomeTeamId: "team-1", OpponentTeamId: "team-2"}, // malformed
		{ExternalId: "game-B", ExternalSource: "test", HomeTeamId: "team-1", OpponentTeamId: "team-3"},
	}

	ctx := context.Background()
	err := svc.SyncGames(ctx, scraped)
	if err != nil {
		t.Fatalf("SyncGames failed: %v", err)
	}

	// Expect 2 upserts (one for A, one for B; empty one skipped)
	if len(mockGameRepo.upsertCalls) != 2 {
		t.Errorf("expected 2 upsert calls, got %d", len(mockGameRepo.upsertCalls))
	}

	externalIds := make(map[string]bool)
	for _, game := range mockGameRepo.upsertCalls {
		externalIds[game.ExternalGameId] = true
	}

	if externalIds[""] {
		t.Error("empty ExternalId should not be upserted")
	}
}

// TestSyncGames_UpsertAllUniqueGames tests that all unique games in the scraped payload are upserted.
func TestSyncGames_UpsertAllUniqueGames(t *testing.T) {
	mockGameRepo := &MockGameRepository{}
	svc := &gameService{
		discovery:  &MockDiscoveryScraper{},
		stats:      &MockStatsScraper{},
		gameRepo:   mockGameRepo,
		perfRepo:   &MockPerformanceRepository{},
		playerRepo: &MockPlayerRepository{},
		teamRepo:   &MockTeamRepository{},
	}

	scraped := []scraper.ScrapedGameSummary{
		{ExternalId: "game-1", ExternalSource: "test", HomeTeamId: "team-1", OpponentTeamId: "team-2"},
		{ExternalId: "game-2", ExternalSource: "test", HomeTeamId: "team-1", OpponentTeamId: "team-3"},
		{ExternalId: "game-3", ExternalSource: "test", HomeTeamId: "team-1", OpponentTeamId: "team-4"},
	}

	ctx := context.Background()
	err := svc.SyncGames(ctx, scraped)
	if err != nil {
		t.Fatalf("SyncGames failed: %v", err)
	}

	// Expect 3 upserts
	if len(mockGameRepo.upsertCalls) != 3 {
		t.Errorf("expected 3 upsert calls, got %d", len(mockGameRepo.upsertCalls))
	}

	// Verify each game has correct fields mapped
	for i, game := range mockGameRepo.upsertCalls {
		expectedExternalId := fmt.Sprintf("game-%d", i+1)
		if game.ExternalGameId != expectedExternalId {
			t.Errorf("game %d: expected ExternalGameId %s, got %s", i, expectedExternalId, game.ExternalGameId)
		}
		if game.ExternalSource != "test" {
			t.Errorf("game %d: expected ExternalSource 'test', got %s", i, game.ExternalSource)
		}
		if game.IsScraped {
			t.Errorf("game %d: expected IsScraped to be false", i)
		}
	}
}

// TestSyncGames_EmptyPayload tests that an empty scraped payload results in no upserts.
func TestSyncGames_EmptyPayload(t *testing.T) {
	mockGameRepo := &MockGameRepository{}
	svc := &gameService{
		discovery:  &MockDiscoveryScraper{},
		stats:      &MockStatsScraper{},
		gameRepo:   mockGameRepo,
		perfRepo:   &MockPerformanceRepository{},
		playerRepo: &MockPlayerRepository{},
		teamRepo:   &MockTeamRepository{},
	}

	scraped := []scraper.ScrapedGameSummary{}

	ctx := context.Background()
	err := svc.SyncGames(ctx, scraped)
	if err != nil {
		t.Fatalf("SyncGames failed: %v", err)
	}

	if len(mockGameRepo.upsertCalls) != 0 {
		t.Errorf("expected 0 upsert calls for empty payload, got %d", len(mockGameRepo.upsertCalls))
	}
}

// TestSyncGames_UpsertError tests that an error from the repository is propagated.
func TestSyncGames_UpsertError(t *testing.T) {
	mockGameRepo := &MockGameRepository{
		upsertErr: errors.New("database connection failed"),
	}
	svc := &gameService{
		discovery:  &MockDiscoveryScraper{},
		stats:      &MockStatsScraper{},
		gameRepo:   mockGameRepo,
		perfRepo:   &MockPerformanceRepository{},
		playerRepo: &MockPlayerRepository{},
		teamRepo:   &MockTeamRepository{},
	}

	scraped := []scraper.ScrapedGameSummary{
		{ExternalId: "game-A", ExternalSource: "test", HomeTeamId: "team-1", OpponentTeamId: "team-2"},
	}

	ctx := context.Background()
	err := svc.SyncGames(ctx, scraped)
	if err == nil {
		t.Error("expected SyncGames to return an error, but got nil")
	}
	if !errors.Is(err, mockGameRepo.upsertErr) {
		t.Errorf("expected error to be wrapped upsert error, got: %v", err)
	}
}

// TestSyncGames_NormalisesStatus tests that game status is normalised correctly.
func TestSyncGames_NormalisesStatus(t *testing.T) {
	mockGameRepo := &MockGameRepository{}
	svc := &gameService{
		discovery:  &MockDiscoveryScraper{},
		stats:      &MockStatsScraper{},
		gameRepo:   mockGameRepo,
		perfRepo:   &MockPerformanceRepository{},
		playerRepo: &MockPlayerRepository{},
		teamRepo:   &MockTeamRepository{},
	}

	scraped := []scraper.ScrapedGameSummary{
		{ExternalId: "game-1", ExternalSource: "test", HomeTeamId: "team-1", OpponentTeamId: "team-2", GameResultScore: ""},      // empty -> Scheduled
		{ExternalId: "game-2", ExternalSource: "test", HomeTeamId: "team-1", OpponentTeamId: "team-3", GameResultScore: "2 - 1"}, // non-empty -> Completed
	}

	ctx := context.Background()
	err := svc.SyncGames(ctx, scraped)
	if err != nil {
		t.Fatalf("SyncGames failed: %v", err)
	}

	if len(mockGameRepo.upsertCalls) != 2 {
		t.Fatalf("expected 2 upsert calls, got %d", len(mockGameRepo.upsertCalls))
	}

	if mockGameRepo.upsertCalls[0].Status != "Scheduled" {
		t.Errorf("game 1: expected status 'Scheduled', got %s", mockGameRepo.upsertCalls[0].Status)
	}

	if mockGameRepo.upsertCalls[1].Status != "Completed" {
		t.Errorf("game 2: expected status 'Completed', got %s", mockGameRepo.upsertCalls[1].Status)
	}
}

// TestSyncGames_MapsTeamIds tests that home and away team IDs are mapped correctly.
func TestSyncGames_MapsTeamIds(t *testing.T) {
	mockGameRepo := &MockGameRepository{}
	svc := &gameService{
		discovery:  &MockDiscoveryScraper{},
		stats:      &MockStatsScraper{},
		gameRepo:   mockGameRepo,
		perfRepo:   &MockPerformanceRepository{},
		playerRepo: &MockPlayerRepository{},
		teamRepo:   &MockTeamRepository{},
	}

	scraped := []scraper.ScrapedGameSummary{
		{ExternalId: "game-1", ExternalSource: "test", HomeTeamId: "home-123", OpponentTeamId: "away-456"},
	}

	ctx := context.Background()
	err := svc.SyncGames(ctx, scraped)
	if err != nil {
		t.Fatalf("SyncGames failed: %v", err)
	}

	game := mockGameRepo.upsertCalls[0]
	if game.HomeTeamExternalId != "home-123" {
		t.Errorf("expected HomeTeamExternalId 'home-123', got %s", game.HomeTeamExternalId)
	}
	if game.AwayTeamExternalId != "away-456" {
		t.Errorf("expected AwayTeamExternalId 'away-456', got %s", game.AwayTeamExternalId)
	}
}
