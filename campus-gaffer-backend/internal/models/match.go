package models

type MatchEvent struct {
	ID            uint    `json:"id" gorm:"primaryKey"`
	MatchID       int64   `json:"match_id" gorm:"index"`
	EventType     string  `json:"event_type" gorm:"check:event_type IN ('goal','card','substitution')"`
	Team          string  `json:"team"`
	PlayerName    string  `json:"player_name"`
	PlayerID      string  `json:"player_id"`
	AssistPlayer  string  `json:"assist_player"`
	Minute        int     `json:"minute"`
	EventTime     string  `json:"event_time"`
}

func (MatchEvent) TableName() string {
	return "match_events"
}
