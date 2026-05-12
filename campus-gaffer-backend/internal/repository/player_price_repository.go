package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PlayerPriceRepository interface {
	Upsert(ctx context.Context, player_val *models.PlayerPrice) (*models.PlayerPrice, error)
}

type playerPriceRepo struct {
	db *gorm.DB
}


func NewPlayerValueRepo(db *gorm.DB) PlayerPriceRepository {
	return &playerPriceRepo{
		db: db,
	}
}

func (pvr *playerPriceRepo) Upsert(ctx context.Context, record *models.PlayerPrice) (*models.PlayerPrice, error) {
	res := pvr.db.
		WithContext(ctx).
		Clauses(
			clause.OnConflict{
				Columns: []clause.Column{{Name: "player_id"}, {Name: "gameweek"}},
				DoUpdates: clause.AssignmentColumns([]string{
					"price", "updated_at",
				}),
			},
		).
		Create(record)

	return record, res.Error
}
