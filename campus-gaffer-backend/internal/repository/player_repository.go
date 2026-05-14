package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PlayerRepository interface {
	Upsert(ctx context.Context, p *models.ScrapedPlayer) (*models.ScrapedPlayer, error)
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
				Columns:   []clause.Column{{Name: "external_id"}, {Name: "external_source"}},
				DoUpdates: clause.AssignmentColumns([]string{"name", "birth_date"}),
			},
		).
		Create(player)
	if result.Error != nil {
		return nil, result.Error
	}
	return player, nil
}
