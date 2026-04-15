package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PerformanceRepository interface {
	Upsert(ctx context.Context, perf *models.PlayerPerformance) (*models.PlayerPerformance, error)
	FindByGameIdAndPlayerId(ctx context.Context, gameId, playerId uuid.UUID) (*models.PlayerPerformance, error)
}

type perfRepo struct {
	db *gorm.DB
}

func NewPlayerPerfRepo(db *gorm.DB) PerformanceRepository {
	return &perfRepo{
		db: db,
	}
}

func (r *perfRepo) Upsert(ctx context.Context, perf *models.PlayerPerformance) (*models.PlayerPerformance, error) {
	result := r.db.
		WithContext(ctx).
		Clauses(
			clause.OnConflict{
				Columns: []clause.Column{{Name: "player_id"}, {Name: "game_id"}},
				DoUpdates: clause.AssignmentColumns([]string{
					"goals", "is_mvp", "game_played", "team_id", "updated_at",
				}),
			},
		).
		Create(perf)

	return perf, result.Error
}

func (r *perfRepo) FindByGameIdAndPlayerId(ctx context.Context, gameId, playerId uuid.UUID) (*models.PlayerPerformance, error) {
	return nil, errors.New("not implemented")
}
