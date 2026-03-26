package models

import "github.com/google/uuid"

type Player struct {
	Id               uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	ExternalPlayerId string    `gorm:"type:string;not null"`
	ExternalSource   string    `gorm:"type:string;not null"`
	Name             string    `gorm:"type:string;not null"`
	BirthDate        *string    `gorm:"type:string;"`
	Age              *uint      `gorm:"type:integer;"`
	Gender           *string    `gorm:"type:string;"`
	YearOfStudy      *string    `gorm:"type:string;"`
	GraduationYear   *string    `gorm:"type:string;"`
}
