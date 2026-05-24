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
	FindByGameId(ctx context.Context, gameId uuid.UUID) ([]models.PlayerPerformance, error)
	FindByPlayerIDs(ctx context.Context, playerIDs []uuid.UUID) ([]models.PlayerPerformance, error)
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

func (r *perfRepo) FindByGameId(ctx context.Context, gameId uuid.UUID) ([]models.PlayerPerformance, error) {
	var perfs []models.PlayerPerformance
	err := r.db.
		WithContext(ctx).
		Where("game_id = ?", gameId).
		Find(&perfs).Error
	return perfs, err
}

func (r *perfRepo) FindByPlayerIDs(ctx context.Context, playerIDs []uuid.UUID) ([]models.PlayerPerformance, error) {
	if len(playerIDs) == 0 {
		return nil, nil
	}
	var perfs []models.PlayerPerformance
	err := r.db.
		WithContext(ctx).
		Where("player_id IN ?", playerIDs).
		Find(&perfs).Error
	return perfs, err
}
