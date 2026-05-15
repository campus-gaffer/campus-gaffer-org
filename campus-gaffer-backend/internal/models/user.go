package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	ClerkID       string  `json:"clerk_id" gorm:"unique;index"`
	Username      string  `json:"username" gorm:"unique"`
	Email         string  `json:"email" gorm:"unique"`
	TeamName      string  `json:"team_name"`
	University   string  `json:"university"`
	Age          int     `json:"age" gorm:"default:18"`
	Gender       string  `json:"gender" gorm:"default:prefer_not_to_say"`
	Budget       float64 `json:"budget" gorm:"default:100"`
	TotalPoints  int     `json:"total_points" gorm:"default:0"`
	FreeTransfers int    `json:"free_transfers" gorm:"default:1"`
	LastGameweek int     `json:"last_gameweek" gorm:"default:0"`
	Avatar       string  `json:"avatar" gorm:"default:''"`
}
