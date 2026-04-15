package models

import (
	"time"

	"github.com/google/uuid"
)

type PlayerPerformance struct {
	Id         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	PlayerId   uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:idx_perf_grain"`
	GameId     uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:idx_perf_grain"`
	TeamId     *uuid.UUID `gorm:"type:uuid;"` // FK to Team, nullable in case of player performance without a team
	Goals      int        `gorm:"type:int;not null;default:0"`
	GamePlayed bool       `gorm:"type:boolean;default:false;not null"`
	IsMVP      bool       `gorm:"type:boolean;default:false;not null"`
	// ExternalPlayerId string     `gorm:"type:text;not null;uniqueIndex:idx_player_performance_external"`
	// ExternalSource   string     `gorm:"type:text;not null;uniqueIndex:idx_player_performance_external"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
