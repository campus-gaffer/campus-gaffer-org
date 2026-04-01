package models

import "gorm.io/gorm"


type User struct {
	gorm.Model
	ClerkID   string `json:"clerk_id" gorm:"unique;index"`
	Username  string `json:"username" gorm:"unique"`
	Email     string `json:"email" gorm:"unique"`
	TeamName  string `json:"team_name"`
	University string `json:"university"`
}
