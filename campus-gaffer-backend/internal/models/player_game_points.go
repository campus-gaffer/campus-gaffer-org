package models

import (
	"time"

	"github.com/google/uuid"
)

// PlayerGamePoint is the output of the scoring service. One row per
// (player, game, weight_ver). Recomputable: re-running the scoring service
// upserts in place, no migration needed when weights change.
type PlayerGamePoint struct {
	Id        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	PlayerId  uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_game_points_grain"`
	GameId    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_game_points_grain"`
	Points    int       `gorm:"type:integer;not null"`
	WeightVer string    `gorm:"type:text;not null;uniqueIndex:idx_game_points_grain"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
