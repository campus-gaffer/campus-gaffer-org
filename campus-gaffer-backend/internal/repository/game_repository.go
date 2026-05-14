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
	FindScraped(ctx context.Context) ([]models.Game, error)
	// FindRegularSeason returns every regular-season game (external_game_type = 0)
	// with a non-null kickoff_time. Used by the pricing pipeline to derive
	// the gameweek schedule for the league.
	FindRegularSeason(ctx context.Context) ([]models.Game, error)
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
				DoUpdates: clause.Assignments(map[string]any{
					"status":                gorm.Expr("EXCLUDED.status"),
					"updated_at":            gorm.Expr("EXCLUDED.updated_at"),
					"home_team_external_id": gorm.Expr("EXCLUDED.home_team_external_id"),
					"away_team_external_id": gorm.Expr("EXCLUDED.away_team_external_id"),
					"external_game_type":    gorm.Expr("EXCLUDED.external_game_type"),
					"external_league_id":    gorm.Expr("EXCLUDED.external_league_id"),
					"kickoff_time":          gorm.Expr("COALESCE(EXCLUDED.kickoff_time, games.kickoff_time)"),
					"forfeited_by":          gorm.Expr("COALESCE(EXCLUDED.forfeited_by, games.forfeited_by)"),
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
		return nil, nil // not found is not an error
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

func (r *gameRepo) FindScraped(ctx context.Context) ([]models.Game, error) {
	var games []models.Game
	err := r.db.
		WithContext(ctx).
		Where("is_scraped = true").
		Find(&games).Error
	return games, err
}

func (r *gameRepo) FindRegularSeason(ctx context.Context) ([]models.Game, error) {
	var games []models.Game
	err := r.db.
		WithContext(ctx).
		Where("external_game_type = 0 AND kickoff_time IS NOT NULL").
		Order("kickoff_time ASC").
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
