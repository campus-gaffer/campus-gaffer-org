package handlers

import (
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateUser(c *gin.Context) {
	var user models.User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
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
