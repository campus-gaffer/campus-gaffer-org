package models

import (
	"time"

	"github.com/google/uuid"
)

type Game struct {
	Id                 uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	ExternalGameId     string     `gorm:"type:text;not null;uniqueIndex:idx_game_external;column:external_game_id"`
	ExternalSource     string     `gorm:"type:text;not null;uniqueIndex:idx_game_external;column:external_source"`
	ExternalGameType   int16      `gorm:"type:smallint;not null;default:0;"`
	ExternalLeagueId   string     `gorm:"type:text;not null;default:''"`
	HomeTeamExternalId string     `gorm:"column:home_team_external_id;type:text"`
	AwayTeamExternalId string     `gorm:"column:away_team_external_id;type:text"`
	KickoffTime        *time.Time `gorm:"type:timestamptz;"`
	Status             string     `gorm:"type:text;not null;default:'Scheduled'"`
	IsScraped          bool       `gorm:"type:boolean;default:false;not null"`
	CreatedAt          time.Time
	UpdatedAt          time.Time
}
