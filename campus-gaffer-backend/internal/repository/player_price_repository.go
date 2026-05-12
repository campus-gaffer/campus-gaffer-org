package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// PriceFloor is the default price returned by GetEffectivePrice for a
// player with no prior price row, and the lower bound of the v1 pricing
// algorithm. Kept here (not in the service) so consumers reading prices
// don't need to depend on the pricing service.
const PriceFloor = 4.0

type PlayerPriceRepository interface {
	// Upsert is insert-once: a price written for (player_id, gameweek) is
	// frozen. Re-running for an existing grain is a no-op (no overwrite),
	// so the pipeline is safely re-runnable.
	Upsert(ctx context.Context, player_val *models.PlayerPrice) (*models.PlayerPrice, error)
	// InsertBatch writes many price rows in one round trip. Conflicts on
	// (player_id, gameweek) are skipped (DO NOTHING) so re-running the
	// pricing pipeline for a past gameweek is a no-op. Returns the number
	// of rows actually inserted (excluding skipped duplicates).
	InsertBatch(ctx context.Context, records []models.PlayerPrice) (int, error)
	// GetEffectivePrice returns the player's most recent priced gameweek
	// at or before asOfGameweek (carry-forward). Falls back to PriceFloor
	// if the player has never been priced. Centralises the carry-forward
	// policy so the sparse player_prices table presents as dense to readers.
	GetEffectivePrice(ctx context.Context, playerID uuid.UUID, asOfGameweek int) (float64, error)
}

type playerPriceRepo struct {
	db *gorm.DB
}


func NewPlayerPriceRepo(db *gorm.DB) PlayerPriceRepository {
	return &playerPriceRepo{
		db: db,
	}
}

func (pvr *playerPriceRepo) InsertBatch(ctx context.Context, records []models.PlayerPrice) (int, error) {
	if len(records) == 0 {
		return 0, nil
	}
	res := pvr.db.
		WithContext(ctx).
		Clauses(
			clause.OnConflict{
				Columns:   []clause.Column{{Name: "player_id"}, {Name: "gameweek"}},
				DoNothing: true,
			},
		).
		CreateInBatches(records, 500)
	return int(res.RowsAffected), res.Error
}

func (pvr *playerPriceRepo) GetEffectivePrice(ctx context.Context, playerID uuid.UUID, asOfGameweek int) (float64, error) {
	var row models.PlayerPrice
	err := pvr.db.
		WithContext(ctx).
		Select("price").
		Where("player_id = ? AND gameweek <= ?", playerID, asOfGameweek).
		Order("gameweek DESC").
		Limit(1).
		Take(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return PriceFloor, nil
	}
	if err != nil {
		return 0, err
	}
	return row.Price, nil
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
