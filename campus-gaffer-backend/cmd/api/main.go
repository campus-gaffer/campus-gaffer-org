package main

import (
	"campus-gaffer-backend/internal/config"
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/handlers"
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/service"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	database.Connect(cfg.DBUri)

	database.DB.AutoMigrate(&models.User{}, &models.Player{}, &models.Match{}, &models.SquadMember{}, &models.MatchEvent{}, &models.Division{}, &models.Team{}, &models.Game{}, &models.GameData{}, &models.ScraperCookie{}, &models.ScrapedPlayer{}, &models.PlayerPerformance{}, &models.Squad{}, &models.SquadPlayer{})

	// Load timezone for squad deadline enforcement
	loc, err := time.LoadLocation("America/Winnipeg")
	if err != nil {
		log.Fatalf("api: load timezone: %v", err)
	}

	gameRepo := repository.NewGameRepo(database.DB)
	squadRepo := repository.NewSquadRepo(database.DB)
	priceRepo := repository.NewPlayerPriceRepo(database.DB)
	squadSvc := service.NewSquadService(squadRepo, priceRepo, gameRepo, loc)

	// Dev squad system handler
	squadHandler := handlers.NewSquadHandler(squadSvc)

	// Warm up queries to refresh PgBouncer cached plans after schema changes
	database.DB.Exec("SELECT * FROM users LIMIT 0")
	database.DB.Exec("SELECT * FROM player_data LIMIT 0")
	database.DB.Exec("SELECT * FROM squad_members LIMIT 0")
	database.DB.Exec("SELECT * FROM matches LIMIT 0")
	database.DB.Exec("SELECT * FROM match_events LIMIT 0")

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
	result.GET("/players/:id", handlers.GetPlayerByID)
	result.GET("/matches/live", handlers.GetLiveMatch)
	result.GET("/matches", handlers.GetAllMatches)
	result.GET("/matches/:id", handlers.GetMatchByID)
	result.GET("/matches/:id/events", handlers.GetMatchEvents)
	result.POST("/squad/:clerk_id", handlers.UpdateSquad)
	result.GET("/squad/:clerk_id", handlers.GetSquad)
	result.PUT("/squad/:clerk_id/captain", handlers.SetCaptain)
	result.PUT("/users/:clerk_id/avatar", handlers.UpdateAvatar)
	result.GET("/leaderboard", handlers.GetLeaderboard)
	result.GET("/teams", handlers.GetTeams)
	// result.GET("/rewards", handlers.GetRewards) // deactivated for now
	result.GET("/stats", handlers.GetStats)
	result.POST("/admin/update-cookie", handlers.UpdateCookie)
	result.POST("/admin/compute-points", handlers.ComputeUserPoints)
	result.POST("/admin/compute-prices", handlers.ComputePrices)
	result.POST("/admin/compute-gameweeks", handlers.ComputeGameweeks)
	result.POST("/admin/compute-all", handlers.ComputeAll)
	result.POST("/api/contact", handlers.HandleContact)
	result.POST("/squads", squadHandler.CreateSquad)
	result.GET("/squads/:id", squadHandler.GetSquad)
	result.GET("/squads/:id/points", squadHandler.GetSquadPoints)
	result.Run(":" + getPort())
}

func getPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		return "8082"
	}
	return port
}
