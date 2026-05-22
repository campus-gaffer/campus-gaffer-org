package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LeaderboardRow struct {
	UserID      string `gorm:"column:user_id"`
	Username    string `gorm:"column:username"`
	TotalPoints int    `gorm:"column:total_points"`
	Rank        int    `gorm:"column:rank"`
}

type SquadRepository interface {
	// Create persists the squad and its players in a single transaction.
	Create(ctx context.Context, squad *models.Squad, players []models.SquadPlayer) error
	// FindByID returns the squad and its players, or (nil, nil, nil) if not found.
	FindByID(ctx context.Context, id uuid.UUID) (*models.Squad, []models.SquadPlayer, error)
	// FindByUserID returns the user's squad if one exists, or nil if not.
	FindByUserID(ctx context.Context, userID string) (*models.Squad, error)
	// TotalPointsByPlayerIDs sums player_game_points per player for the given
	// weight version. Players with no points row are absent from the result map.
	TotalPointsByPlayerIDs(ctx context.Context, playerIDs []uuid.UUID, weightVer string) (map[uuid.UUID]int, error)
	// Leaderboard returns all users ranked by total points with pagination.
	Leaderboard(ctx context.Context, limit, offset int) ([]LeaderboardRow, int, error)
}

type squadRepo struct {
	db *gorm.DB
}

func NewSquadRepo(db *gorm.DB) SquadRepository {
	return &squadRepo{db: db}
}

func (r *squadRepo) Create(ctx context.Context, squad *models.Squad, players []models.SquadPlayer) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(squad).Error; err != nil {
			return err
		}
		for i := range players {
			players[i].SquadId = squad.Id
		}
		return tx.Create(&players).Error
	})
}

func (r *squadRepo) FindByID(ctx context.Context, id uuid.UUID) (*models.Squad, []models.SquadPlayer, error) {
	var squad models.Squad
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&squad).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, nil
		}
		return nil, nil, err
	}
	var players []models.SquadPlayer
	if err := r.db.WithContext(ctx).Where("squad_id = ?", id).Find(&players).Error; err != nil {
		return nil, nil, err
	}
	return &squad, players, nil
}

func (r *squadRepo) FindByUserID(ctx context.Context, userID string) (*models.Squad, error) {
	var squad models.Squad
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&squad).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &squad, nil
}

type playerTotalPoints struct {
	PlayerID uuid.UUID `gorm:"column:player_id"`
	Total    int       `gorm:"column:total"`
}

func (r *squadRepo) TotalPointsByPlayerIDs(ctx context.Context, playerIDs []uuid.UUID, weightVer string) (map[uuid.UUID]int, error) {
	if len(playerIDs) == 0 {
		return map[uuid.UUID]int{}, nil
	}
	var rows []playerTotalPoints
	err := r.db.WithContext(ctx).
		Table("player_game_points").
		Select("player_id, COALESCE(SUM(points), 0) AS total").
		Where("player_id IN ? AND weight_ver = ?", playerIDs, weightVer).
		Group("player_id").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	totals := make(map[uuid.UUID]int, len(rows))
	for _, row := range rows {
		totals[row.PlayerID] = row.Total
	}
	return totals, nil
}

// Leaderboard returns paginated global standings ranked by total points (v1.0 weights).
// Computes: for each user, SUM(points) across all their squad players' game performances.
func (r *squadRepo) Leaderboard(ctx context.Context, limit, offset int) ([]LeaderboardRow, int, error) {
	// Query: rank users by total points summed across their squad players.
	// Users with no points at all still appear with total=0 (unless they have no squad).
	var rows []LeaderboardRow
	err := r.db.WithContext(ctx).
		Table("users u").
		Select(`ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(pgp.points), 0) DESC) as rank,
				u.id as user_id,
				u.username,
				COALESCE(SUM(pgp.points), 0) as total_points`).
		Joins("JOIN squads s ON s.user_id = u.id").
		Joins("JOIN squad_players sp ON sp.squad_id = s.id").
		Joins("LEFT JOIN player_game_points pgp ON pgp.player_id = sp.player_id AND pgp.weight_ver = 'v1.0'").
		Group("u.id, u.username").
		Order("total_points DESC").
		Limit(limit).
		Offset(offset).
		Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}

	// Get total count for pagination
	var total int64
	err = r.db.WithContext(ctx).
		Table("users").
		Where("id IN (SELECT DISTINCT user_id FROM squads)").
		Count(&total).Error
	if err != nil {
		return rows, 0, err
	}

	return rows, int(total), nil
}
