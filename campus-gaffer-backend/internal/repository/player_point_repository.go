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
	// TopScorerInGames returns the single highest-scoring player across the
	// given games at the given weight_ver. Tie-break: alphabetical by name
	// ASC. Returns nil if there are no points rows for any of the games.
	TopScorerInGames(ctx context.Context, gameIDs []uuid.UUID, weightVer string) (*TopScorerRow, error)
}

// TopScorerRow is the projection returned by TopScorerInGames: a player's
// total points across the queried games plus their primary team name for
// display.
type TopScorerRow struct {
	PlayerID   uuid.UUID `gorm:"column:player_id"`
	PlayerName string    `gorm:"column:player_name"`
	TeamName   string    `gorm:"column:team_name"`
	Points     int       `gorm:"column:points"`
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

func (r *gamePointRepo) TopScorerInGames(ctx context.Context, gameIDs []uuid.UUID, weightVer string) (*TopScorerRow, error) {
	if len(gameIDs) == 0 {
		return nil, nil
	}
	var row TopScorerRow
	// SUM points per (player, team) across the GW's games, then pick the
	// highest. The team comes from the player's performance in those games
	// (a player on multiple teams in the window is bucketed per side; the
	// team that helped them top-score wins the row). Tie-break by name ASC.
	err := r.db.
		WithContext(ctx).
		Raw(`
			SELECT pgp.player_id AS player_id,
			       p.name AS player_name,
			       COALESCE(t.name, '') AS team_name,
			       SUM(pgp.points)::int AS points
			FROM player_game_points pgp
			JOIN players p ON p.id = pgp.player_id
			LEFT JOIN player_performances pp
			       ON pp.player_id = pgp.player_id
			      AND pp.game_id   = pgp.game_id
			LEFT JOIN teams t ON t.id = pp.team_id
			WHERE pgp.weight_ver = ?
			  AND pgp.game_id IN ?
			GROUP BY pgp.player_id, p.name, t.name
			ORDER BY points DESC, p.name ASC
			LIMIT 1
		`, weightVer, gameIDs).
		Scan(&row).Error
	if err != nil {
		return nil, err
	}
	if row.PlayerID == uuid.Nil {
		return nil, nil
	}
	return &row, nil
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
