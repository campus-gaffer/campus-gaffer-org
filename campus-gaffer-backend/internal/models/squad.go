package models

import (
	"time"

	"github.com/google/uuid"
)

type Squad struct {
	Id          uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid();not null"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null;index"`
	Gameweek    int        `gorm:"not null"`
	BudgetSpent float64    `gorm:"type:float;not null"`
	LockedAt    *time.Time `gorm:"type:timestamptz;"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
