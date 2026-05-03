package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PlayerRepository interface {
	Upsert(ctx context.Context, p *models.Player) (*models.Player, error)
	FindByExternalID(ctx context.Context, externalID string) *models.Player
}

type playerRepo struct {
	db *gorm.DB
}

func NewPlayerRepo(db *gorm.DB) PlayerRepository {
	return &playerRepo{
		db: db,
	}
}

func (r *playerRepo) Upsert(ctx context.Context, player *models.Player) (*models.Player, error) {
	result := r.db.
		WithContext(ctx).
		Clauses(
			clause.OnConflict{
				Columns: []clause.Column{
					{Name: "external_player_id"},
					{Name: "external_source"},
				},
				DoUpdates: clause.AssignmentColumns([]string{
					"name",
					"birth_date",
					"gender",
					"is_private",
					"year_of_study",
					"graduation_year",
					"updated_at",
				}),
			},
		).
		Create(player)
	if result.Error != nil {
		return nil, result.Error
	}
	return player, nil
}

func (r *playerRepo) FindByExternalID(ctx context.Context, externalID string) *models.Player {
	player := &models.Player{}
	result := r.db.
		WithContext(ctx).
		Where("external_player_id = ?", externalID).
		First(player)

	if result.Error != nil {
		// Treat unexpected query errors as "not found" so the caller falls
		// through to the enrichment-and-upsert path rather than silently
		// using a stale/zero record.
		return nil
	}
	return player
}
