package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"
	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type TeamRepository interface {
	Upsert(ctx context.Context, team *models.Team) (*models.Team, error)
	FindByExternalId(ctx context.Context, externalId, externalSource string) (*models.Team, error)
}

type teamRepo struct {
	db *gorm.DB
}

func NewTeamRepo(db *gorm.DB) TeamRepository {
	return &teamRepo{
		db: db,
	}
}

func (repo *teamRepo) Upsert(ctx context.Context, team *models.Team) (*models.Team, error) {
	result := repo.db.
		WithContext(ctx).
		Clauses(
			clause.OnConflict{
				Columns:   []clause.Column{{Name: "external_team_id"}, {Name: "external_source"}},
				DoUpdates: clause.AssignmentColumns([]string{"name", "updated_at"}),
			},
		).
		Create(team)
	if result.Error != nil {
		return nil, result.Error
	}
	return team, nil
}

func (repo *teamRepo) FindByExternalId(ctx context.Context, externalId, externalSource string) (*models.Team, error) {
	var team models.Team
	err := repo.db.
		WithContext(ctx).
		Where("external_team_id = ? AND external_source = ?", externalId, externalSource).
		First(&team).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &team, nil
}