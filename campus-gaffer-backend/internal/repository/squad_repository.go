package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type LeaderboardRow struct {
	UserID      string `gorm:"column:user_id"      json:"user_id"`
	Username    string `gorm:"column:username"     json:"username"`
	TotalPoints int    `gorm:"column:total_points" json:"total_points"`
	GwPoints    int    `gorm:"column:gw_points"    json:"gw_points"`
	Rank        int    `gorm:"column:rank"         json:"rank"`
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
	// Leaderboard returns all users ranked by total (season) points with pagination.
	// gwStart/gwEnd optionally scope gw_points to a single gameweek window; pass
	// zero values to omit per-GW scoring (gw_points will be 0 for all rows).
	Leaderboard(ctx context.Context, limit, offset int, gwStart, gwEnd time.Time) ([]LeaderboardRow, int, error)
}

type squadRepo struct {
	db *gorm.DB
}

func NewSquadRepo(db *gorm.DB) SquadRepository {
	return &squadRepo{db: db}
}

func (r *squadRepo) Create(ctx context.Context, squad *models.Squad, players []models.SquadPlayer) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Pre-Clerk shim: ensure a users row exists so the squad appears in the
		// leaderboard (which INNER JOINs users). Once Clerk auth lands, the auth
		// middleware upserts the real user on first login and this can be removed.
		if err := ensureUser(tx, squad.UserID); err != nil {
			return err
		}
		if err := tx.Create(squad).Error; err != nil {
			return err
		}
		for i := range players {
			players[i].SquadId = squad.Id
		}
		return tx.Create(&players).Error
	})
}

// ensureUser upserts a placeholder users row for the given ID. Username and
// email both carry uniqueIndex constraints, so we derive unique non-empty
// values from the ID. ON CONFLICT DO NOTHING leaves an existing row untouched.
func ensureUser(tx *gorm.DB, userID string) error {
	suffix := userID
	if len(suffix) > 8 {
		suffix = suffix[:8]
	}
	user := models.User{
		ID:       userID,
		Username: "Manager-" + suffix,
		Email:    userID + "@local",
	}
	return tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&user).Error
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

// Leaderboard returns paginated global standings ranked by season total points (v1.0 weights).
// When gwStart/gwEnd are non-zero, gw_points is also computed by restricting the SUM to
// games whose kickoff_time falls within [gwStart, gwEnd].
func (r *squadRepo) Leaderboard(ctx context.Context, limit, offset int, gwStart, gwEnd time.Time) ([]LeaderboardRow, int, error) {
	hasGW := !gwStart.IsZero() && !gwEnd.IsZero()

	var gwPtsExpr, gamesJoin string
	if hasGW {
		gwPtsExpr = `COALESCE(SUM(CASE WHEN g.kickoff_time >= ? AND g.kickoff_time <= ? THEN pgp.points ELSE 0 END), 0) AS gw_points`
		gamesJoin = `LEFT JOIN games g ON g.id = pgp.game_id`
	} else {
		gwPtsExpr = `0 AS gw_points`
	}

	sql := fmt.Sprintf(`
		SELECT
			ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(pgp.points), 0) DESC) AS rank,
			u.id                                AS user_id,
			u.username,
			COALESCE(SUM(pgp.points), 0)       AS total_points,
			%s
		FROM users u
		JOIN squads s       ON s.user_id    = u.id
		JOIN squad_players sp ON sp.squad_id  = s.id
		LEFT JOIN player_game_points pgp
			ON  pgp.player_id = sp.player_id
			AND pgp.weight_ver = 'v1.0'
		%s
		GROUP BY u.id, u.username
		ORDER BY total_points DESC
		LIMIT ? OFFSET ?`, gwPtsExpr, gamesJoin)

	var args []interface{}
	if hasGW {
		args = append(args, gwStart, gwEnd)
	}
	args = append(args, limit, offset)

	var rows []LeaderboardRow
	if err := r.db.WithContext(ctx).Raw(sql, args...).Scan(&rows).Error; err != nil {
		return nil, 0, err
	}

	var total int64
	if err := r.db.WithContext(ctx).
		Table("users").
		Where("id IN (SELECT DISTINCT user_id FROM squads)").
		Count(&total).Error; err != nil {
		return rows, 0, err
	}

	return rows, int(total), nil
}
