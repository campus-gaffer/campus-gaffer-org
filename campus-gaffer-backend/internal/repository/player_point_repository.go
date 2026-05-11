package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PlayerGamePointRepo interface {
	Upsert(ctx context.Context, record *models.PlayerGamePoint) (*models.PlayerGamePoint, error)
	FindById(ctx context.Context, id uuid.UUID) (*models.PlayerGamePoint, error)
}

type gamePointRepo struct {
	db *gorm.DB
}

func NewPlayerGamePointRepo(db *gorm.DB) PlayerGamePointRepo {
	return &gamePointRepo{db: db}
}

func (r *gamePointRepo) Upsert(ctx context.Context, record *models.PlayerGamePoint) (*models.PlayerGamePoint, error) {
	result := r.db.
		WithContext(ctx).
		Clauses(
			clause.OnConflict{
				Columns: []clause.Column{{Name: "player_id"}, {Name: "game_id"}, {Name: "weight_ver"}},
				DoUpdates: clause.AssignmentColumns([]string{
					"points", "updated_at",
				}),
			},
		).
		Create(record)

	return record, result.Error
}

func (r *gamePointRepo) FindById(ctx context.Context, id uuid.UUID) (*models.PlayerGamePoint, error) {
	var record models.PlayerGamePoint
	err := r.db.
		WithContext(ctx).
		Where("id = ?", id).
		First(&record).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &record, err
}
