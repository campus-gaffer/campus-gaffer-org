package models

import (
	"github.com/google/uuid"
)

type Game struct {
	Id             uuid.UUID `gorm:"type:uuid;primaryKey;not null"`
	ExternalGameId string    `gorm:"type:text;not null"`
	ExternalSource string    `gorm:"type:text;not null"`
	Team1          string    `gorm:"type:text;not null"`
	Team2          string    `gorm:"type:text;not null"`
	Score          string    `gorm:"type:text;not null"`
	KickoffTime    string    `gorm:"type:text;not null"`
	IsScraped      bool      `gorm:"type:boolean;not null;default:false"`
}
