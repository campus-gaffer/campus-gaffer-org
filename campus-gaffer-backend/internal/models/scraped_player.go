package models

import (
	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type ScrapedPlayer struct {
	Id               uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	ExternalPlayerId string          `gorm:"type:text;column:external_player_id;uniqueIndex:idx_player_external;not null"`
	ExternalSource   string          `gorm:"type:text;column:external_source;uniqueIndex:idx_player_external;not null"`
	Name             string          `gorm:"type:text;not null"`
	BirthDate        *datatypes.Date `gorm:"type:date;"`
	IsPrivate        bool            `gorm:"type:boolean;not null"`
	Gender           *string         `gorm:"type:text;"`
	YearOfStudy      *string         `gorm:"type:text;"`
	GraduationYear   *string         `gorm:"type:text;"`
}
