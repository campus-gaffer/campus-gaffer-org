package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type GameRepository interface {
	Upsert(ctx context.Context, g *models.Game) (*models.Game, error)
	FindByExternalId(ctx context.Context, externalId, externalSource string) (*models.Game, error)
	FindUnscraped(ctx context.Context) ([]models.Game, error)
	MarkScraped(ctx context.Context, id uuid.UUID) error
}

type gameRepo struct {
	db *gorm.DB
}

func NewGameRepo(db *gorm.DB) GameRepository {
	return &gameRepo{
		db: db,
	}
}

func (r *gameRepo) Upsert(ctx context.Context, game *models.Game) (*models.Game, error) {
	result := r.db.
		WithContext(ctx).
		Clauses(
			clause.OnConflict{
				Columns: []clause.Column{{Name: "external_game_id"}, {Name: "external_source"}},
				DoUpdates: clause.AssignmentColumns([]string{
					"status",
					"updated_at",
					"kickoff_time",
					"home_team_external_id",
					"away_team_external_id",
					"external_game_type",
					"external_league_id",
				}),
			},
		).
		Create(game)

	return game, result.Error
}

func (r *gameRepo) FindByExternalId(ctx context.Context, externalId, externalSource string) (*models.Game, error) {
	var game models.Game
	err := r.db.
		WithContext(ctx).
		Where("external_game_id = ? AND external_source = ?", externalId, externalSource).
		First(&game).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil // not found is not an error — caller decides
	}
	return &game, err
}

func (r *gameRepo) FindUnscraped(ctx context.Context) ([]models.Game, error) {
	var games []models.Game
	err := r.db.
		WithContext(ctx).
		Where("is_scraped = false AND status = ?", "Completed").
		Find(&games).Error

	return games, err
}

func (r *gameRepo) MarkScraped(ctx context.Context, id uuid.UUID) error {
	err := r.db.
		WithContext(ctx).
		Model(&models.Game{}).
		Where("id = ?", id).
		Update("is_scraped", true).Error

	return err
}
