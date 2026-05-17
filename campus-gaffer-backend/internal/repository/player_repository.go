package repository

import (
	"campus-gaffer-backend/internal/models"
	"context"

	"sync"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const playerListCacheTTL = 5 * time.Minute

type PlayerRepository interface {
	Upsert(ctx context.Context, p *models.Player) (*models.Player, error)
	FindByExternalID(ctx context.Context, externalID string) *models.Player
	FindAll(ctx context.Context) ([]models.Player, error)
}

type playerRepo struct {
	db        *gorm.DB
	cacheMu   sync.RWMutex
	players   []models.Player
	playersAt time.Time
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
	r.invalidatePlayersCache()
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


func (r *playerRepo) FindAll(ctx context.Context) ([]models.Player, error) {
	r.cacheMu.RLock()
	if len(r.players) > 0 && time.Since(r.playersAt) < playerListCacheTTL {
		cached := make([]models.Player, len(r.players))
		copy(cached, r.players)
		r.cacheMu.RUnlock()
		return cached, nil
	}
	r.cacheMu.RUnlock()

	var players []models.Player
	err := r.db.
		WithContext(ctx).
		Find(&players).
		Error
	if err != nil {
		return nil, err
	}

	r.cacheMu.Lock()
	r.players = make([]models.Player, len(players))
	copy(r.players, players)
	r.playersAt = time.Now()
	r.cacheMu.Unlock()

	return players, nil
}

func (r *playerRepo) invalidatePlayersCache() {
	r.cacheMu.Lock()
	r.players = nil
	r.playersAt = time.Time{}
	r.cacheMu.Unlock()
}