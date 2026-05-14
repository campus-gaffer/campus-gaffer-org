package models

import "gorm.io/gorm"

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

type MatchEvent struct {
	ID           uint   `json:"id" gorm:"primaryKey"`
	MatchID      int64  `json:"match_id" gorm:"index"`
	EventType    string `json:"event_type" gorm:"check:event_type IN ('goal','card','substitution')"`
	Team         string `json:"team"`
	PlayerName   string `json:"player_name"`
	PlayerID     string `json:"player_id"`
	AssistPlayer string `json:"assist_player"`
	Minute       int    `json:"minute"`
	EventTime    string `json:"event_time"`
}

func (MatchEvent) TableName() string {
	return "match_events"
}
