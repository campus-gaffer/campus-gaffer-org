package models

import (
	"time"

	"gorm.io/gorm"
)

type Match struct {
	gorm.Model
	HomeTeam     string    `json:"home_team" gorm:"type:text"`
	AwayTeam     string    `json:"away_team" gorm:"type:text"`
	HomeScore    int       `json:"home_score"`
	AwayScore    int       `json:"away_score"`
	IsLive       bool      `json:"is_live"`
	MatchTime    string    `json:"match_time"`
	Venue        string    `json:"venue"`
	PossessionH  int       `json:"possession_h"`
	PossessionA  int       `json:"possession_a"`
	ShotsH       int       `json:"shots_h"`
	ShotsA       int       `json:"shots_a"`
	KickoffTime  time.Time `json:"kickoff_time"`
	Gameweek     int       `json:"gameweek" gorm:"default:0"`
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
