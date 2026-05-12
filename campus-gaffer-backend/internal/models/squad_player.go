package models

import (
	"time"

	"github.com/google/uuid"
)

type SquadPlayer struct {
	Id       uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	SquadId  uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_squad_player_grain;not null"`
	PlayerId uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_squad_player_grain;not null"`
	IsBench  bool      `gorm:"not null;default:false"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
