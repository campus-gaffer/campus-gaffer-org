package models

import "gorm.io/gorm"

type SquadMember struct {
	gorm.Model
	ClerkID   string `json:"clerk_id" gorm:"index"`
	PlayerID  string `json:"player_id" gorm:"type:text;index"`
	IsCaptain bool   `json:"is_captain" gorm:"default:false"`
}

type SquadUpdate struct {
	PlayerIDs []string `json:"player_ids"`
}

type SetCaptainRequest struct {
	PlayerID string `json:"player_id"`
}
