package models

import "time"

// User maps to the users table.
// ID holds the Clerk user ID (e.g. "user_2abc...") — set by the auth middleware on first login.
type User struct {
	ID        string    `gorm:"type:text;primaryKey;not null"`
	Username  string    `gorm:"type:text;not null;uniqueIndex"`
	Email     string    `gorm:"type:text;uniqueIndex"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
