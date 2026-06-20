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
	// GoalsByGameAndTeam returns SUM(goals) keyed by (game_id, team_id) for
	// the given games. Performances with a nil team_id are excluded — there
	// is no side to attribute them to. Used by the GW results service to
	// derive home/away scores without a home_score/away_score column.
	GoalsByGameAndTeam(ctx context.Context, gameIDs []uuid.UUID) ([]GameTeamGoals, error)
}

// GameTeamGoals is the row shape returned by GoalsByGameAndTeam: one row per
// (game, team) combination with the goal total and the team's external id +
// display name eagerly joined so the caller doesn't need a second lookup.
type GameTeamGoals struct {
	GameID         uuid.UUID `gorm:"column:game_id"`
	TeamID         uuid.UUID `gorm:"column:team_id"`
	TeamExternalID string    `gorm:"column:external_team_id"`
	TeamName       string    `gorm:"column:team_name"`
	Goals          int       `gorm:"column:goals"`
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

func (r *perfRepo) GoalsByGameAndTeam(ctx context.Context, gameIDs []uuid.UUID) ([]GameTeamGoals, error) {
	if len(gameIDs) == 0 {
		return nil, nil
	}
	var rows []GameTeamGoals
	err := r.db.
		WithContext(ctx).
		Table("player_performances AS pp").
		Select("pp.game_id AS game_id, pp.team_id AS team_id, t.external_team_id AS external_team_id, t.name AS team_name, COALESCE(SUM(pp.goals), 0) AS goals").
		Joins("JOIN teams t ON t.id = pp.team_id").
		Where("pp.game_id IN ? AND pp.team_id IS NOT NULL", gameIDs).
		Group("pp.game_id, pp.team_id, t.external_team_id, t.name").
		Scan(&rows).Error
	return rows, err
}
