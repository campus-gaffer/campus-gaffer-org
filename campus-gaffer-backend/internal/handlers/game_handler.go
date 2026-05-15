package handlers

import (
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetPlayers(c *gin.Context) {
	var players []models.Player
	result := database.DB.Find(&players)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch players"})
		return
	}
	c.JSON(http.StatusOK, players)
}

func GetLiveMatch(c *gin.Context) {
	var match models.Match
	result := database.DB.Where("is_live = ?", true).First(&match)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No live match found"})
		return
	}
	c.JSON(http.StatusOK, match)
}

func GetAllMatches(c *gin.Context) {
	var matches []models.Match
	result := database.DB.Order("created_at DESC").Find(&matches)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch matches"})
		return
	}
	c.JSON(http.StatusOK, matches)
}

func GetMatchByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	var match models.Match
	if err := database.DB.First(&match, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Match not found"})
		return
	}
	c.JSON(http.StatusOK, match)
}

func GetMatchEvents(c *gin.Context) {
	idStr := c.Param("id")
	matchID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match ID"})
		return
	}

	var events []models.MatchEvent
	if err := database.DB.Where("match_id = ?", matchID).Order("minute ASC").Find(&events).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch events"})
		return
	}
	c.JSON(http.StatusOK, events)
}

func UpdateUserOnboarding(c *gin.Context) {
	var user models.User
	clerkID := c.Param("clerk_id")

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("📥 Onboarding User [%s]: %+v", clerkID, user)
	user.ClerkID = clerkID

	// Check username uniqueness (exclude current user)
	if user.Username != "" {
		var dup models.User
		if err := database.DB.Where("username = ? AND clerk_id != ?", user.Username, clerkID).First(&dup).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Username already taken"})
			return
		}
	}

	// Check team_name uniqueness (exclude current user)
	if user.TeamName != "" {
		var dup models.User
		if err := database.DB.Where("team_name = ? AND clerk_id != ?", user.TeamName, clerkID).First(&dup).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Team name already taken"})
			return
		}
	}

	// Look for existing user
	var existing models.User
	if err := database.DB.Where("clerk_id = ?", clerkID).First(&existing).Error; err != nil {
		// Create new
		if err := database.DB.Create(&user).Error; err != nil {
			log.Printf("❌ DB Error creating user: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
	} else {
		// Update existing (Specifically only these fields)
		database.DB.Model(&existing).Updates(models.User{
			Username:   user.Username,
			TeamName:   user.TeamName,
			University: user.University,
			Email:      user.Email,
			Age:        user.Age,
			Gender:     user.Gender,
		})
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}
