package repository

import (
	"campus-gaffer-backend/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type GameRepository struct {
	DB *gorm.DB
}

func NewGameRepository(db *gorm.DB) *GameRepository {
	return &GameRepository{DB: db}
}

// UpsertByExternal creates or updates a game by external_id and external_source.
// It does NOT overwrite is_scraped if the row already exists.
func (r *GameRepository) UpsertByExternal(game *models.Game) error {
	// Use ON CONFLICT to upsert, but exclude is_scraped from updates
	return r.DB.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "external_id"}, {Name: "external_source"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"home_team_id", "away_team_id", "division_id",
			"kickoff_time", "status", "game_type", "updated_at",
		}),
	}).Create(game).Error
}

// FindByExternal finds a game by external_id and external_source
func (r *GameRepository) FindByExternal(externalID, externalSource string) (*models.Game, error) {
	var game models.Game
	err := r.DB.Where("external_id = ? AND external_source = ?", externalID, externalSource).First(&game).Error
	if err != nil {
		return nil, err
	}
	return &game, nil
}
