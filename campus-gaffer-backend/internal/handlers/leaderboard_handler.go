package handlers

import (
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type LeaderboardEntry struct {
	ClerkID    string `json:"clerk_id"`
	Username   string `json:"username"`
	TeamName   string `json:"team_name"`
	University string `json:"university"`
	TotalPoints int   `json:"total_points"`
	Budget     float64 `json:"budget"`
	SquadValue float64 `json:"squad_value"`
}

func GetLeaderboard(c *gin.Context) {
	var users []models.User
	database.DB.Order("total_points DESC").Find(&users)

	var entries []LeaderboardEntry
	for _, u := range users {
		// Calculate squad value
		var members []models.SquadMember
		database.DB.Where("clerk_id = ?", u.ClerkID).Find(&members)

		var squadValue float64
		for _, m := range members {
			var player models.Player
			if err := database.DB.First(&player, "id = ?", m.PlayerID).Error; err == nil {
				squadValue += player.Price
			}
		}

		entries = append(entries, LeaderboardEntry{
			ClerkID:     u.ClerkID,
			Username:    u.Username,
			TeamName:    u.TeamName,
			University:  u.University,
			TotalPoints: u.TotalPoints,
			Budget:      u.Budget,
			SquadValue:  squadValue,
		})
	}

	if entries == nil {
		entries = []LeaderboardEntry{}
	}

	c.JSON(http.StatusOK, entries)
}
