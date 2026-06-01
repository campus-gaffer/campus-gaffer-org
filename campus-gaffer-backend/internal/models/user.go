package models

import "time"

// User maps to the users table.
// ID holds the Clerk user ID (e.g. "user_2abc...") — set by the auth middleware on first login.
type User struct {
	ID                 string    `gorm:"type:text;primaryKey;not null" json:"id"`
	Username           string    `gorm:"type:text;not null;uniqueIndex" json:"username"`
	Email              string    `gorm:"type:text;uniqueIndex" json:"email"`
	UsernameCustomized bool      `gorm:"not null;default:false" json:"username_customized"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}
