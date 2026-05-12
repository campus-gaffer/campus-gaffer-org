package models

import (
	"time"

	"github.com/google/uuid"
)

// PlayerPrice model is the model for each player's price for a given week
type PlayerPrice struct {
	Id        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	PlayerId  uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_player_price_grain;not null"`
	Gameweek  int       `gorm:"type:integer;uniqueIndex:idx_player_price_grain;not null"`
	Price     float64   `gorm:"type:float;not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
