package models

import "gorm.io/gorm"

type Player struct {
	ID           string  `json:"id" gorm:"primaryKey;type:text"`
	Name         string  `json:"name" gorm:"column:name"`
	University   string  `json:"university" gorm:"column:team"`
	Sport        string  `json:"sport" gorm:"column:sport"`
	Position     string  `json:"position" gorm:"default:MID"`
	Price        float64 `json:"price" gorm:"default:5.0"`
	TotalPoints  int     `json:"total_points" gorm:"default:0"`
	WeeklyPoints int     `json:"weekly_points" gorm:"default:0"`
	ImgURL       string  `json:"img_url"`
}

func (Player) TableName() string {
	return "player_data"
}

type Match struct {
	gorm.Model
	HomeTeam    string `json:"home_team"`
	AwayTeam    string `json:"away_team"`
	HomeScore   int    `json:"home_score"`
	AwayScore   int    `json:"away_score"`
	IsLive      bool   `json:"is_live"`
	MatchTime   string `json:"match_time"` // e.g. "65'"
	Venue       string `json:"venue"`
	PossessionH int    `json:"possession_h"`
	PossessionA int    `json:"possession_a"`
	ShotsH      int    `json:"shots_h"`
	ShotsA      int    `json:"shots_a"`
}
