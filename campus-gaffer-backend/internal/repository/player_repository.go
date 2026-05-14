package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PlayerRepository interface {
	Upsert(ctx context.Context, p *models.ScrapedPlayer) (*models.ScrapedPlayer, error)
	FindByExternalID(ctx context.Context, externalID string) *models.ScrapedPlayer
	FindAll(ctx context.Context) ([]models.ScrapedPlayer, error)
}

type playerRepo struct {
	db *gorm.DB
}

func NewPlayerRepo(db *gorm.DB) PlayerRepository {
	return &playerRepo{
		db: db,
	}
}

func (r *playerRepo) Upsert(ctx context.Context, player *models.ScrapedPlayer) (*models.ScrapedPlayer, error) {
	result := r.db.
		WithContext(ctx).
		Clauses(
			clause.OnConflict{
				Columns: []clause.Column{
					{Name: "external_player_id"},
					{Name: "external_source"},
				},
				DoUpdates: clause.AssignmentColumns([]string{
					"name",
					"birth_date",
					"gender",
					"is_private",
					"year_of_study",
					"graduation_year",
					"updated_at",
				}),
			},
		).
		Create(player)
	if result.Error != nil {
		return nil, result.Error
	}
	return player, nil
}

func (r *playerRepo) FindByExternalID(ctx context.Context, externalID string) *models.ScrapedPlayer {
	player := &models.ScrapedPlayer{}
	result := r.db.
		WithContext(ctx).
		Where("external_player_id = ?", externalID).
		First(player)

	if result.Error != nil {
		return nil
	}
	return player
}

func (r *playerRepo) FindAll(ctx context.Context) ([]models.ScrapedPlayer, error) {
	var players []models.ScrapedPlayer
	err := r.db.
		WithContext(ctx).
		Find(&players).
		Error

	return players, err
}
