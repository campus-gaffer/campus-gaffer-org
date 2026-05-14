package models

import "github.com/google/uuid"

type Team struct {
	Id             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	Name           string    `gorm:"type:string;not null"`
	ExternalId     string    `gorm:"type:string;not null;uniqueIndex:idx_team_external"`
	ExternalSource string    `gorm:"type:string;not null;uniqueIndex:idx_team_external"`
}
