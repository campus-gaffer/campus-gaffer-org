package handlers

import (
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateUser(c *gin.Context) {
	var input struct {
		Username  string `json:"username"`
		Email     string `json:"email"`
		ClerkID   string `json:"clerk_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := models.User{
		Username:      input.Username,
		Email:         input.Email,
		ClerkID:       input.ClerkID,
		TotalPoints:   0,
		Budget:        100,
		FreeTransfers: 1,
	}

	// Check username uniqueness
	if user.Username != "" {
		var dup models.User
		if err := database.DB.Where("username = ?", user.Username).First(&dup).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Username already taken"})
			return
		}
	}

	result := database.DB.Create(&user)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create user"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func GetUsers(c *gin.Context) {
	var users []models.User

	result := database.DB.Find(&users)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch users"})
		return
	}

	c.JSON(http.StatusOK, users)

}

func GetUserByClerkID(c *gin.Context) {
	id := c.Param("clerk_id")
	var user models.User
	result := database.DB.Where("clerk_id = ?", id).First(&user)
	if result.Error != nil {
		log.Printf("⚠️ User not found for ID: %s", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	log.Printf("✅ Found User [%s]: %s (%s)", id, user.Username, user.TeamName)
	c.JSON(http.StatusOK, user)
}

func UpdateAvatar(c *gin.Context) {
	clerkID := c.Param("clerk_id")
	var input struct {
		Avatar string `json:"avatar"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	err := database.DB.Exec("UPDATE users SET avatar = ? WHERE clerk_id = ?", input.Avatar, clerkID).Error
	if err != nil {
		log.Printf("Avatar update error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok", "avatar": input.Avatar})
}
