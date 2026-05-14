package models

import "github.com/google/uuid"

// ScrapedPlayer represents a player scraped from IMLeagues
type ScrapedPlayer struct {
	Id             uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	ExternalId     string    `gorm:"type:string;not null"`
	ExternalSource string    `gorm:"type:string;not null"`
	Name           string    `gorm:"type:string;not null"`
	BirthDate      *string   `gorm:"type:string;"`
	Age            *uint     `gorm:"type:integer;"`
	Gender         *string   `gorm:"type:string;"`
	YearOfStudy    *string   `gorm:"type:string;"`
	GraduationYear *string   `gorm:"type:string;"`
}
