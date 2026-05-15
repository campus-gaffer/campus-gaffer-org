package models

import (
	"time"

	"github.com/google/uuid"
)

// Squad represents a user's squad draft for a gameweek.
// This is the new squad system (v2) used alongside the existing SquadMember.
type Squad struct {
	Id          uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	UserID      uint       `gorm:"not null;index"`
	Gameweek    int        `gorm:"not null"`
	BudgetSpent float64    `gorm:"type:float;not null"`
	LockedAt    *time.Time `gorm:"type:timestamptz;"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type SquadPlayer struct {
	Id       uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	SquadId  uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_squad_player_grain;not null"`
	PlayerId uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_squad_player_grain;not null"`
	IsBench  bool      `gorm:"not null;default:false"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
