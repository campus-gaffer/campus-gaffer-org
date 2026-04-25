package models

import "time"

// Division represents an IMLeagues division
type Division struct {
	ID string `json:"id" gorm:"primaryKey;type:uuid"`
}

func (Division) TableName() string {
	return "divisions"
}

// Team represents an IMLeagues team
type Team struct {
	ID string `json:"id" gorm:"primaryKey;type:uuid"`
}

func (Team) TableName() string {
	return "teams"
}

// Game represents an IMLeagues scraped game
type Game struct {
	ID             string    `json:"id" gorm:"primaryKey;type:uuid"`
	HomeTeamID     string    `json:"home_team_id" gorm:"type:uuid;index"`
	AwayTeamID     string    `json:"away_team_id" gorm:"type:uuid;index"`
	DivisionID     string    `json:"division_id" gorm:"type:uuid;index"`
	KickoffTime    *time.Time `json:"kickoff_time"`
	IsScraped      bool      `json:"is_scraped" gorm:"default:false"`
	ExternalID     string    `json:"external_id" gorm:"index"`
	ExternalSource string    `json:"external_source"`
	Status         string    `json:"status"`
	GameType       string    `json:"game_type"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (Game) TableName() string {
	return "games"
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
