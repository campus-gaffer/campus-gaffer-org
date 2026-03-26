package models

import (
	"time"

	"github.com/google/uuid"
)

type PlayerPerformance struct {
	Id               uuid.UUID  `gorm:"type:uuid;primaryKey"`
	ExternalPlayerId string     `gorm:"type:string;not null;uniqueIndex:idx_player_performance_external"`
	ExternalSource   string     `gorm:"type:string;not null;uniqueIndex:idx_player_performance_external"`
	TeamId           string     `gorm:"type:string;not null"`
	Goals            uint       `gorm:"type:uint;not null;default:0"`
	KickoffTime      *time.Time `gorm:"type:timestamp"`
	GameId           string     `gorm:"type:uuid;not null"`
	IsMVP            bool       `gorm:"type:boolean;not null"`
	PlayedGame       bool       `gorm:"type:boolean;not null"`
	GoalsPerGame     uint       `gorm:"type:float"`
	IsScraped        bool       `gorm:"type:boolean;not null"`
}
