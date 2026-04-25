package main

import (
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/handlers"
	"campus-gaffer-backend/internal/models"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	database.Connect()

	database.DB.AutoMigrate(&models.User{}, &models.Player{}, &models.Match{}, &models.SquadMember{}, &models.MatchEvent{}, &models.Division{}, &models.Team{}, &models.Game{}, &models.GameData{}, &models.ScraperCookie{})

	result := gin.Default()

	result.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*") // Allows React to talk to Go
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	result.POST("/users", handlers.CreateUser)
	result.PUT("/users/:clerk_id", handlers.UpdateUserOnboarding)
	result.GET("/users", handlers.GetUsers)
	result.GET("/users/:clerk_id", handlers.GetUserByClerkID)
	result.GET("/players", handlers.GetPlayers)
	result.GET("/matches/live", handlers.GetLiveMatch)
	result.GET("/matches", handlers.GetAllMatches)
	result.GET("/matches/:id", handlers.GetMatchByID)
	result.GET("/matches/:id/events", handlers.GetMatchEvents)
	result.POST("/squad/:clerk_id", handlers.UpdateSquad)
	result.GET("/squad/:clerk_id", handlers.GetSquad)
	result.PUT("/squad/:clerk_id/captain", handlers.SetCaptain)
	result.POST("/admin/update-cookie", handlers.UpdateCookie)
	result.Run(":" + getPort())
}

func getPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		return "8082"
	}
	return port
}
