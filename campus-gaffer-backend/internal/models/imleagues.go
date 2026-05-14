package models

import "time"

// Division represents an IMLeagues division
type Division struct {
	ID string `json:"id" gorm:"primaryKey;type:uuid"`
}

func (Division) TableName() string {
	return "divisions"
}

// GameData represents scraped game data (legacy table, different schema from Game)
type GameData struct {
	ID          int        `json:"id" gorm:"primaryKey;autoIncrement"`
	GameID      int        `json:"game_id" gorm:"index"`
	Status      bool       `json:"status" gorm:"default:false"`
	IsScraped   bool       `json:"is_scraped" gorm:"default:false"`
	KickoffTime *time.Time `json:"kickoff_time"`
	DivisionID  string     `json:"division_id"`
}

func (GameData) TableName() string {
	return "games_data"
}
