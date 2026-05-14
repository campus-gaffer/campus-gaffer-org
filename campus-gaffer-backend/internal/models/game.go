package models

import (
	"time"

	"github.com/google/uuid"
)

// Game represents an IMLeagues scraped game
type Game struct {
	Id             uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	ExternalGameId string     `gorm:"type:string;not null;uniqueIndex:idx_game_external"`
	ExternalSource string     `gorm:"type:string;not null;uniqueIndex:idx_game_external"`
	Team1Id        *uuid.UUID `gorm:"type:uuid;"`
	Team2Id        *uuid.UUID `gorm:"type:uuid;"`
	KickoffTime    *time.Time `gorm:"type:timestamptz;"`
	Status         string     `gorm:"type:string;not null;default:'scheduled'"`
	IsScraped      bool       `gorm:"type:boolean;default:false;not null"`
	UpdatedAt      time.Time  `gorm:"type:timestamp;"`
}

func (Game) TableName() string {
	return "games"
}
