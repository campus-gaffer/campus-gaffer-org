package handlers

import (
	"net/http"
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"
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

func GetUser(c *gin.Context) {
	var users []models.User

	result := database.DB.Find(&users)

	if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch users"})
		return
	}
	
	c.JSON(http.StatusOK, users)

}
