package models

import (
	"time"

	"github.com/google/uuid"
)

type Team struct {
	Id             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	Name           string    `gorm:"type:text;not null"`
	ExternalTeamId string    `gorm:"type:text;column:external_team_id;not null;uniqueIndex:idx_team_external"`
	ExternalSource string    `gorm:"type:text;column:external_source;not null;uniqueIndex:idx_team_external"`
	// LeagueId       *uuid.UUID `gorm:"type:uuid;"` --- IGNORE FOR MVP ---
	CreatedAt time.Time
	UpdatedAt time.Time
}
