package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// PlayerAvgPoints is the row shape returned by AvgPointsByPlayer:
// one player and their average points across all qualifying games.
type PlayerAvgPoints struct {
	PlayerID uuid.UUID `gorm:"column:player_id"`
	AvgPts   float64   `gorm:"column:avg_pts"`
}

type PlayerGamePointRepo interface {
	Upsert(ctx context.Context, record *models.PlayerGamePoint) (*models.PlayerGamePoint, error)
	FindById(ctx context.Context, id uuid.UUID) (*models.PlayerGamePoint, error)
	// AvgPointsByPlayer returns the average points per player across every
	// game whose kickoff_time <= cutoff at the given weight_ver. One row
	// per player with at least one qualifying game; players with none are
	// omitted (no row, not zero).
	AvgPointsByPlayer(ctx context.Context, weightVer string, cutoff time.Time) ([]PlayerAvgPoints, error)
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

func (r *gamePointRepo) AvgPointsByPlayer(ctx context.Context, weightVer string, cutoff time.Time) ([]PlayerAvgPoints, error) {
	var rows []PlayerAvgPoints
	err := r.db.
		WithContext(ctx).
		Table("player_game_points AS pgp").
		Select("pgp.player_id AS player_id, AVG(pgp.points::float8) AS avg_pts").
		Joins("JOIN games g ON g.id = pgp.game_id").
		Where("pgp.weight_ver = ? AND g.kickoff_time <= ?", weightVer, cutoff).
		Group("pgp.player_id").
		Scan(&rows).Error
	return rows, err
}
