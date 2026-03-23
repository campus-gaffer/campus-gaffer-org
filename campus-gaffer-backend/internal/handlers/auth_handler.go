package handlers

import (
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type SyncUserRequest struct {
	ClerkID  string `json:"clerk_id" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Username string `json:"username"`
}

func SyncUser(c *gin.Context) {
	var req SyncUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User

	// Use ClerkID to find the user. If not found, create with the provided attributes.
	result := database.DB.Where(models.User{ClerkID: req.ClerkID}).Attrs(models.User{
		Email:    req.Email,
		Username: req.Username,
	}).FirstOrCreate(&user)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database sync fail"})
		return
	}

	c.JSON(http.StatusOK, user)
}
