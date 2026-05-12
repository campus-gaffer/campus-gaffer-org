package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PlayerPriceRepository interface {
	// Upsert is insert-once: a price written for (player_id, gameweek) is
	// frozen. Re-running for an existing grain is a no-op (no overwrite),
	// so the pipeline is safely re-runnable.
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
				Columns:   []clause.Column{{Name: "player_id"}, {Name: "gameweek"}},
				DoNothing: true,
			},
		).
		Create(record)

	return record, res.Error
}
