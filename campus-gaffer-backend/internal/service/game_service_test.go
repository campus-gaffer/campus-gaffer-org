package service

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/scraper"
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
)

// MockGameRepository mocks the GameRepository for testing.
type MockGameRepository struct {
	upsertCalls []models.Game
	upsertErr   error
	// unscraped is what FindUnscraped returns (used by ProcessCompletedGames tests).
	unscraped []models.Game
	// scraped is what FindScraped returns (used by ScoringService tests).
	scraped []models.Game
	// markScrapedIds records each MarkScraped call.
	markScrapedIds []uuid.UUID
}

func (m *MockGameRepository) Upsert(ctx context.Context, game *models.Game) (*models.Game, error) {
	if m.upsertErr != nil {
		return nil, m.upsertErr
	}
	m.upsertCalls = append(m.upsertCalls, *game)
	if game.Id == uuid.Nil {
		game.Id = uuid.New()
	}
	return game, nil
}

func (m *MockGameRepository) FindUnscraped(ctx context.Context) ([]models.Game, error) {
	return m.unscraped, nil
}

func (m *MockGameRepository) MarkScraped(ctx context.Context, gameId uuid.UUID) error {
	m.markScrapedIds = append(m.markScrapedIds, gameId)
	return nil
}

func (m *MockGameRepository) FindByExternalId(ctx context.Context, externalId, externalSource string) (*models.Game, error) {
	return nil, nil
}

func (m *MockGameRepository) FindScraped(ctx context.Context) ([]models.Game, error) {
	return m.scraped, nil
}

func (m *MockGameRepository) FindRegularSeason(ctx context.Context) ([]models.Game, error) {
	return nil, nil
}

// MockPerformanceRepository mocks the PerformanceRepository for testing.
type MockPerformanceRepository struct {
	upsertCalls []models.PlayerPerformance
	// byGameId is what FindByGameId returns (used by ScoringService tests).
	byGameId map[uuid.UUID][]models.PlayerPerformance
}

func (m *MockPerformanceRepository) Upsert(ctx context.Context, perf *models.PlayerPerformance) (*models.PlayerPerformance, error) {
	m.upsertCalls = append(m.upsertCalls, *perf)
	return perf, nil
}

func (m *MockPerformanceRepository) FindByGameIdAndPlayerId(ctx context.Context, gameId, playerId uuid.UUID) (*models.PlayerPerformance, error) {
	return nil, nil
}

func (m *MockPerformanceRepository) FindByGameId(ctx context.Context, gameId uuid.UUID) ([]models.PlayerPerformance, error) {
	if m.byGameId == nil {
		return nil, nil
	}
	return m.byGameId[gameId], nil
}

// MockPlayerGamePointRepo mocks the PlayerGamePointRepo for testing.
type MockPlayerGamePointRepo struct {
	upsertCalls []models.PlayerGamePoint
	upsertErr   error
}

func (m *MockPlayerGamePointRepo) Upsert(ctx context.Context, record *models.PlayerGamePoint) (*models.PlayerGamePoint, error) {
	if m.upsertErr != nil {
		return nil, m.upsertErr
	}
	m.upsertCalls = append(m.upsertCalls, *record)
	return record, nil
}

func (m *MockPlayerGamePointRepo) FindById(ctx context.Context, id uuid.UUID) (*models.PlayerGamePoint, error) {
	return nil, nil
}

func (m *MockPlayerGamePointRepo) AvgPointsByPlayer(ctx context.Context, weightVer string, cutoff time.Time) ([]repository.PlayerAvgPoints, error) {
	return nil, nil
}

// MockPlayerRepository mocks the PlayerRepository for testing.
type MockPlayerRepository struct {
	// existing is consulted by FindByExternalID, keys are ExternalPlayerId.
	existing    map[string]*models.Player
	upsertCalls []models.Player
}

func (m *MockPlayerRepository) Upsert(ctx context.Context, player *models.Player) (*models.Player, error) {
	m.upsertCalls = append(m.upsertCalls, *player)
	player.Id = uuid.New()
	return player, nil
}

func (m *MockPlayerRepository) FindByExternalID(ctx context.Context, externalId string) *models.Player {
	if m.existing == nil {
		return nil
	}
	return m.existing[externalId]
}

func (m *MockPlayerRepository) FindAll(ctx context.Context) ([]models.Player, error) {
	return nil, nil
}

func (m *MockPlayerRepository) PrimaryTeams(ctx context.Context) (map[uuid.UUID]string, error) {
	return map[uuid.UUID]string{}, nil
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

// --- ProcessCompletedGames tests ---------------------------------------
//
// These tests exercise the player-enrichment branches in ProcessCompletedGames.
// The four scenarios are listed in issue #20 and are the biggest coverage gap
// at the time of the GameRef refactor.

// processTestGame returns an unscraped Completed game with the routing fields
// populated (mirroring what SyncGames would have written).
func processTestGame() models.Game {
	return models.Game{
		Id:                 uuid.New(),
		ExternalGameId:     "g-1",
		ExternalSource:     "imleagues",
		ExternalGameType:   0,
		ExternalLeagueId:   "league-1",
		HomeTeamExternalId: "home-team",
		AwayTeamExternalId: "away-team",
		Status:             "Completed",
	}
}

// processTestDetails returns the ScrapedGameDetails the FakeScraper will hand
// back for "g-1", parameterised on the player stat slice so each test can
// shape the player set without rebuilding the whole fixture.
func processTestDetails(players []scraper.ScrapedPlayerStat) *scraper.ScrapedGameDetails {
	return &scraper.ScrapedGameDetails{
		ExternalId:     "g-1",
		ExternalSource: "imleagues",
		HomeTeamName:   "Home FC",
		HomeTeamId:     "home-team",
		AwayTeamName:   "Away FC",
		AwayTeamId:     "away-team",
		KickoffTime:    time.Now(),
		GameCompleted:  true,
		Players:        players,
	}
}

func newProcessTestService(
	gameRepo *MockGameRepository,
	playerRepo *MockPlayerRepository,
	perfRepo *MockPerformanceRepository,
	teamRepo *MockTeamRepository,
	fake *scraper.FakeScraper,
) *gameService {
	return &gameService{
		discovery:  &MockDiscoveryScraper{},
		stats:      fake,
		gameRepo:   gameRepo,
		perfRepo:   perfRepo,
		playerRepo: playerRepo,
		teamRepo:   teamRepo,
	}
}

// TestProcessCompletedGames_CacheHitSkipsPlayerEnrichment verifies that when
// a player is already in the repo, GetPlayerData is not called and the
// existing record is reused, the cache-hit fast path. The performance row
// is still upserted since stats fetching is independent of player enrichment.
func TestProcessCompletedGames_CacheHitSkipsPlayerEnrichment(t *testing.T) {
	game := processTestGame()
	gameRepo := &MockGameRepository{unscraped: []models.Game{game}}

	existing := &models.Player{Id: uuid.New(), ExternalPlayerId: "p-1", Name: "Existing Player"}
	playerRepo := &MockPlayerRepository{
		existing: map[string]*models.Player{"p-1": existing},
	}
	perfRepo := &MockPerformanceRepository{}
	teamRepo := &MockTeamRepository{}

	fake := scraper.NewFakeScraper()
	fake.Stats["g-1"] = processTestDetails([]scraper.ScrapedPlayerStat{
		{ExternalPlayerID: "p-1", ExternalSource: "imleagues", ExternalTeamID: "home-team", Goals: 1, GamePlayed: true},
	})

	svc := newProcessTestService(gameRepo, playerRepo, perfRepo, teamRepo, fake)

	if err := svc.ProcessCompletedGames(context.Background()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if calls := fake.PlayerDataCalls["p-1"]; calls != 0 {
		t.Errorf("expected 0 GetPlayerData calls for cached player, got %d", calls)
	}
	if len(playerRepo.upsertCalls) != 0 {
		t.Errorf("expected 0 player Upserts on cache hit, got %d", len(playerRepo.upsertCalls))
	}
	if len(perfRepo.upsertCalls) != 1 {
		t.Errorf("expected 1 performance Upsert, got %d", len(perfRepo.upsertCalls))
	}
}

// TestProcessCompletedGames_PrivatePlayerSavedAsIsPrivate verifies that when
// GetPlayerData returns ErrPlayerPrivate, the player is persisted with
// IsPrivate=true so subsequent runs don't re-enrich (and don't burn the
// session on a profile we know we can't read).
func TestProcessCompletedGames_PrivatePlayerSavedAsIsPrivate(t *testing.T) {
	game := processTestGame()
	gameRepo := &MockGameRepository{unscraped: []models.Game{game}}
	playerRepo := &MockPlayerRepository{}
	perfRepo := &MockPerformanceRepository{}
	teamRepo := &MockTeamRepository{}

	fake := scraper.NewFakeScraper()
	fake.Stats["g-1"] = processTestDetails([]scraper.ScrapedPlayerStat{
		{ExternalPlayerID: "p-private", ExternalSource: "imleagues", ExternalTeamID: "home-team", Name: "Hidden", Goals: 0},
	})
	fake.PlayerDataErr = scraper.ErrPlayerPrivate

	svc := newProcessTestService(gameRepo, playerRepo, perfRepo, teamRepo, fake)

	if err := svc.ProcessCompletedGames(context.Background()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(playerRepo.upsertCalls) != 1 {
		t.Fatalf("expected 1 player Upsert, got %d", len(playerRepo.upsertCalls))
	}
	saved := playerRepo.upsertCalls[0]
	if !saved.IsPrivate {
		t.Errorf("expected saved player to have IsPrivate=true, got false")
	}
	if saved.ExternalPlayerId != "p-private" {
		t.Errorf("expected ExternalPlayerId 'p-private', got %q", saved.ExternalPlayerId)
	}
	if saved.Name != "Hidden" {
		t.Errorf("expected Name from scrape context 'Hidden', got %q", saved.Name)
	}
	if len(perfRepo.upsertCalls) != 1 {
		t.Errorf("expected 1 performance Upsert, got %d", len(perfRepo.upsertCalls))
	}
}

// TestProcessCompletedGames_TransientPlayerErrorPersistsScrapeContext verifies
// that a transient (non-classified) GetPlayerData failure persists the player
// using the scrape context with IsPrivate=false, so the next run can retry
// the enrichment path. The performance row must still land, we never let
// player-side issues drop a goalscorer.
func TestProcessCompletedGames_TransientPlayerErrorPersistsScrapeContext(t *testing.T) {
	game := processTestGame()
	gameRepo := &MockGameRepository{unscraped: []models.Game{game}}
	playerRepo := &MockPlayerRepository{}
	perfRepo := &MockPerformanceRepository{}
	teamRepo := &MockTeamRepository{}

	fake := scraper.NewFakeScraper()
	fake.Stats["g-1"] = processTestDetails([]scraper.ScrapedPlayerStat{
		{ExternalPlayerID: "p-flaky", ExternalSource: "imleagues", ExternalTeamID: "home-team", Name: "Flaky McNet", Goals: 2, GamePlayed: true},
	})
	fake.PlayerDataErr = errors.New("temporary network failure")

	svc := newProcessTestService(gameRepo, playerRepo, perfRepo, teamRepo, fake)

	if err := svc.ProcessCompletedGames(context.Background()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(playerRepo.upsertCalls) != 1 {
		t.Fatalf("expected 1 player Upsert, got %d", len(playerRepo.upsertCalls))
	}
	saved := playerRepo.upsertCalls[0]
	if saved.IsPrivate {
		t.Errorf("expected IsPrivate=false for transient error so retries can re-enrich")
	}
	if saved.Name != "Flaky McNet" {
		t.Errorf("expected name from scrape context 'Flaky McNet', got %q", saved.Name)
	}
	if saved.ExternalPlayerId != "p-flaky" {
		t.Errorf("expected ExternalPlayerId 'p-flaky', got %q", saved.ExternalPlayerId)
	}
	if len(perfRepo.upsertCalls) != 1 {
		t.Errorf("expected 1 performance Upsert, got %d", len(perfRepo.upsertCalls))
	}
}

// TestProcessCompletedGames_SessionExpiredHaltsProcessing verifies that an
// ErrSessionExpired bubbles up from ProcessCompletedGames immediately
// continuing would burn quota on a dead session. No player or performance
// row should be persisted past the failure point.
func TestProcessCompletedGames_SessionExpiredHaltsProcessing(t *testing.T) {
	game := processTestGame()
	gameRepo := &MockGameRepository{unscraped: []models.Game{game}}
	playerRepo := &MockPlayerRepository{}
	perfRepo := &MockPerformanceRepository{}
	teamRepo := &MockTeamRepository{}

	fake := scraper.NewFakeScraper()
	fake.Stats["g-1"] = processTestDetails([]scraper.ScrapedPlayerStat{
		{ExternalPlayerID: "p-1", ExternalSource: "imleagues", ExternalTeamID: "home-team"},
		{ExternalPlayerID: "p-2", ExternalSource: "imleagues", ExternalTeamID: "away-team"},
	})
	fake.PlayerDataErr = &scraper.ErrSessionExpired{Msg: "session timed out", RouteNamespace: "/login"}

	svc := newProcessTestService(gameRepo, playerRepo, perfRepo, teamRepo, fake)

	err := svc.ProcessCompletedGames(context.Background())
	if err == nil {
		t.Fatal("expected ErrSessionExpired, got nil")
	}
	if !errors.Is(err, &scraper.ErrSessionExpired{}) {
		t.Errorf("expected ErrSessionExpired, got: %v", err)
	}

	// Nothing should persist past the session-expiry signal.
	if len(playerRepo.upsertCalls) != 0 {
		t.Errorf("expected 0 player Upserts on session expiry, got %d", len(playerRepo.upsertCalls))
	}
	if len(perfRepo.upsertCalls) != 0 {
		t.Errorf("expected 0 performance Upserts on session expiry, got %d", len(perfRepo.upsertCalls))
	}
	if len(gameRepo.markScrapedIds) != 0 {
		t.Errorf("expected MarkScraped not called on session expiry, got %d calls", len(gameRepo.markScrapedIds))
	}
}
