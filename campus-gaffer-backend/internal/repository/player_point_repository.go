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
	FindByPlayerId(ctx context.Context, id uuid.UUID, version string) ([]models.PlayerGamePoint, error)
	// FindByPlayerIdUpTo returns all point records for a player up to and
	// including their Nth game (1-indexed), ordered by kickoff_time ASC.
	// "Nth game" means the Nth game this specific player has a points row
	// for — not the Nth game in the league calendar.
	FindByPlayerIdUpTo(ctx context.Context, playerID uuid.UUID, weightVer string, upToGameweek int) ([]models.PlayerGamePoint, error)
	PointSum(ctx context.Context, id uuid.UUID, version string, gameweek int) (int, error)
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

func (r *gamePointRepo) FindByPlayerId(ctx context.Context, id uuid.UUID, version string) ([]models.PlayerGamePoint, error) {
	var all_pts []models.PlayerGamePoint
	err := r.db.
		WithContext(ctx).
		Where("player_id = ? AND weight_ver = ?", id, version).
		Find(&all_pts).Error

	return all_pts, err
}

func (r *gamePointRepo) FindByPlayerIdUpTo(ctx context.Context, playerId uuid.UUID, version string, upToGameweek int) ([]models.PlayerGamePoint, error) {
	var records []models.PlayerGamePoint
	err := r.db.
		WithContext(ctx).
		Joins("JOIN games g ON g.id = player_game_points.game_id").
		Where(`
			player_game_points.player_id  = $1
			AND player_game_points.weight_ver = $2
			AND g.kickoff_time <= (
				SELECT g2.kickoff_time
				FROM player_game_points pgp2
				JOIN games g2 ON g2.id = pgp2.game_id
				WHERE pgp2.player_id  = $1
				AND pgp2.weight_ver = $2
				ORDER BY g2.kickoff_time ASC
				LIMIT 1 OFFSET $3
			)
		`, playerId, version, upToGameweek-1).
		Find(&records).Error

	return records, err
}

func (r *gamePointRepo) PointSum(ctx context.Context, id uuid.UUID, version string, gameweek int) (int, error) {
	var pointTotal int
	err := r.db.
		WithContext(ctx).
		Model(&models.PlayerGamePoint{}).
		Select("SUM(points) total_pts").
		Where("player_id = ? AND weight_ver = ?", id, version).
		Group("player_id, weight_ver").
		Scan(&pointTotal).Error
	return pointTotal, err
}
