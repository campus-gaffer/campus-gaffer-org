package models

import (
	"time"

	"github.com/google/uuid"
)

type PlayerPerformance struct {
	Id               uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	ExternalPlayerId string     `gorm:"type:string;not null;uniqueIndex:idx_player_performance_external,idx_player_performance_grain"`
	ExternalSource   string     `gorm:"type:string;not null;uniqueIndex:idx_player_performance_external"`
	TeamId           uuid.UUID  `gorm:"type:uuid;not null"`
	Goals            uint       `gorm:"type:uint;not null;default:0"`
	KickoffTime      *time.Time `gorm:"type:timestamp"`
	GameId           uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:idx_player_performance_game_player"`
	IsMVP            bool       `gorm:"type:boolean;not null"`
	PlayedGame       bool       `gorm:"type:boolean;not null"`
}
