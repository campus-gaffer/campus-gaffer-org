package repository

import (
	"testing"
	"time"

	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"

	"github.com/joho/godotenv"
)

func setupTestDB(t *testing.T) *GameRepository {
	t.Helper()
	godotenv.Load("../../.env")
	database.Connect()

	// Clean up any test data first
	database.DB.Where("external_source = ?", "integration-test").Delete(&models.Game{})

	repo := NewGameRepository(database.DB)
	return repo
}

func TestUpsertByExternal_Idempotent(t *testing.T) {
	repo := setupTestDB(t)

	externalID := "test-game-001"
	externalSource := "integration-test"

	// First upsert: create with is_scraped = false
	game := &models.Game{
		ID:             "00000000-0000-0000-0000-000000000001",
		HomeTeamID:     "33333333-3333-3333-3333-333333333333",
		AwayTeamID:     "44444444-4444-4444-4444-444444444444",
		DivisionID:     "11111111-1111-1111-1111-111111111111",
		ExternalID:     externalID,
		ExternalSource: externalSource,
		Status:         "scheduled",
		GameType:       "soccer",
		IsScraped:      false,
	}
	kickoff := time.Now().Add(24 * time.Hour)
	game.KickoffTime = &kickoff

	err := repo.UpsertByExternal(game)
	if err != nil {
		t.Fatalf("First upsert failed: %v", err)
	}

	// Verify one row exists
	found, err := repo.FindByExternal(externalID, externalSource)
	if err != nil {
		t.Fatalf("FindByExternal failed: %v", err)
	}
	if found.IsScraped {
		t.Errorf("Expected is_scraped=false, got true")
	}

	// Second upsert: same external_id/source, but set is_scraped=true
	// The upsert should NOT overwrite is_scraped
	game2 := &models.Game{
		ID:             "00000000-0000-0000-0000-000000000001",
		HomeTeamID:     "33333333-3333-3333-3333-333333333333",
		AwayTeamID:     "44444444-4444-4444-4444-444444444444",
		DivisionID:     "11111111-1111-1111-1111-111111111111",
		ExternalID:     externalID,
		ExternalSource: externalSource,
		Status:         "in_progress",
		GameType:       "soccer",
		IsScraped:      true, // Try to set it to true
	}
	game2.KickoffTime = &kickoff

	err = repo.UpsertByExternal(game2)
	if err != nil {
		t.Fatalf("Second upsert failed: %v", err)
	}

	// Verify only one row exists
	var count int64
	database.DB.Model(&models.Game{}).Where("external_id = ? AND external_source = ?", externalID, externalSource).Count(&count)
	if count != 1 {
		t.Errorf("Expected 1 row, got %d", count)
	}

	// Verify is_scraped was NOT overwritten
	found2, err := repo.FindByExternal(externalID, externalSource)
	if err != nil {
		t.Fatalf("Second FindByExternal failed: %v", err)
	}
	if found2.IsScraped {
		t.Errorf("FAIL: is_scraped was overwritten to true! Expected false (not overwritten).")
	} else {
		t.Logf("PASS: is_scraped remained false (not overwritten)")
	}

	// Verify status WAS updated
	if found2.Status != "in_progress" {
		t.Errorf("Expected status='in_progress', got '%s'", found2.Status)
	}
}
