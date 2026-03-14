package models

import (
	"time"

	"gorm.io/gorm"
)

type PlayerData struct {
	Name  string `json:"name"`
	Team  string `json:"team"`
	Sport string `json:"sport"`
}

type PlayerPerformance struct {
	gorm.Model
	Name        string    `json:name`
	GamePlayed  bool      `json:gp`
	MVP         bool      `json:mvp`
	KickoffTime time.Time `json:kickoff_time`
	Goals       int       `json:"goals"`
	// GoalsPerGame int `json:"goals_per_game"`
}
