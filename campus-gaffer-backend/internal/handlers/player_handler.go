package handlers

import (
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type PlayerDetail struct {
	models.Player
	Goals       int                `json:"goals"`
	Assists     int                `json:"assists"`
	GamesPlayed int                `json:"games_played"`
	Events      []models.MatchEvent `json:"events"`
}

func GetPlayerByID(c *gin.Context) {
	id := c.Param("id")

	var player models.Player
	if err := database.DB.First(&player, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Player not found"})
		return
	}

	// Count goals, assists, games from match events
	var goals int64
	database.DB.Model(&models.MatchEvent{}).Where("player_id = ? AND event_type = ?", id, "goal").Count(&goals)

	var assists int64
	database.DB.Model(&models.MatchEvent{}).Where("assist_player = ? AND event_type = ?", id, "goal").Count(&assists)
	// assist_player stores player_name, so we need to check by name too
	var playerByName models.Player
	if err := database.DB.First(&playerByName, "id = ?", id).Error; err == nil {
		var assistsByName int64
		database.DB.Model(&models.MatchEvent{}).Where("assist_player ILIKE ? AND event_type = ?", "%"+playerByName.Name+"%", "goal").Count(&assistsByName)
		if assistsByName > 0 {
			assists = assistsByName
		}
	}

	var gamesPlayed int64
	database.DB.Model(&models.MatchEvent{}).Where("player_id = ?", id).Count(&gamesPlayed)

	// Get recent events for this player
	var events []models.MatchEvent
	database.DB.Where("player_id = ?", id).Order("minute DESC").Limit(10).Find(&events)
	if events == nil {
		events = []models.MatchEvent{}
	}

	detail := PlayerDetail{
		Player:      player,
		Goals:       int(goals),
		Assists:     int(assists),
		GamesPlayed: int(gamesPlayed),
		Events:      events,
	}

	c.JSON(http.StatusOK, detail)
}
