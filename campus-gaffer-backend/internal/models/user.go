package models

import "gorm.io/gorm"


type User struct {
	gorm.Model
	ClerkID string `json:"clerk_id" gorm:"uniqueIndex"`
	Username string `json:"username" gorm:"unique"`
	Email string `json:"email" gorm:"unique"`
}
