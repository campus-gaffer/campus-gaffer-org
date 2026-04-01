package handlers

import (
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetSquad(c *gin.Context) {
	clerkID := c.Param("clerk_id")
	var members []models.SquadMember
	if err := database.DB.Where("clerk_id = ?", clerkID).Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch squad"})
		return
	}

	var playerIDs []string
	captainID := ""
	for _, m := range members {
		playerIDs = append(playerIDs, m.PlayerID)
		if m.IsCaptain {
			captainID = m.PlayerID
		}
	}

	var players []models.Player
	if len(playerIDs) > 0 {
		database.DB.Where("id IN ?", playerIDs).Find(&players)
	}

	c.JSON(http.StatusOK, gin.H{
		"players":    players,
		"captain_id": captainID,
	})
}

func UpdateSquad(c *gin.Context) {
	clerkID := c.Param("clerk_id")
	var req struct {
		PlayerIDs []string `json:"player_ids"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	// Simple wipe and recreate for this demo
	database.DB.Where("clerk_id = ?", clerkID).Delete(&models.SquadMember{})

	for _, pID := range req.PlayerIDs {
		member := models.SquadMember{
			ClerkID:  clerkID,
			PlayerID: pID,
		}
		database.DB.Create(&member)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

func SetCaptain(c *gin.Context) {
	clerkID := c.Param("clerk_id")
	var req struct {
		PlayerID string `json:"player_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	// Reset all
	database.DB.Model(&models.SquadMember{}).Where("clerk_id = ?", clerkID).Update("is_captain", false)
	// Set new
	database.DB.Model(&models.SquadMember{}).Where("clerk_id = ? AND player_id = ?", clerkID, req.PlayerID).Update("is_captain", true)

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}
