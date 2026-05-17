package main

import (
	"campus-gaffer-backend/internal/config"
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/handlers"

	// "campus-gaffer-backend/internal/models"
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
	db := database.Connect(cfg.DBUri)

	// Initialize repositories
	squadRepo := repository.NewSquadRepo(db)
	priceRepo := repository.NewPlayerPriceRepo(db)
	gameRepo := repository.NewGameRepo(db)
	playerRepo := repository.NewPlayerRepo(db)


	// Load timezone for services
	loc, err := time.LoadLocation(cfg.LeagueTz)
	if err != nil {
		log.Fatalf("api: load timezone %q: %v", cfg.LeagueTz, err)
	}

	// Initialize services
	squadSvc := service.NewSquadService(squadRepo, priceRepo, gameRepo, loc)
	squadHandler := handlers.NewSquadHandler(squadSvc)

	// Pre-fetch priced player payload on startup; refreshed only when needed.
	playerCache, err := handlers.NewPlayerCache(playerRepo, priceRepo, gameRepo, loc)
	if err != nil {
		log.Printf("warning: failed to pre-fetch players cache: %v", err)
	}

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

	// User endpoints
	result.POST("/users", handlers.CreateUser)
	result.GET("/users", handlers.GetUser)

	// Squad endpoints
	result.POST("/squads", squadHandler.CreateSquad)
	result.GET("/squads/:id", squadHandler.GetSquad)
	result.GET("/squads/:id/points", squadHandler.GetSquadPoints)

	// Game/Player/Gameweek endpoints
	result.GET("/players", func(c *gin.Context) {
		if playerCache != nil {
			handlers.GetPlayersFromCache(c, playerCache)
			return
		}
		handlers.GetPlayers(c, gameRepo, playerRepo, priceRepo, loc)
	})
	result.GET("/gameweeks/current", func(c *gin.Context) {
		handlers.GetCurrentGameweek(c, gameRepo, loc)
	})
	result.GET("/leaderboard", func(c *gin.Context) {
		handlers.GetLeaderboard(c, squadRepo)
	})

	port := ":8081"
	if p := os.Getenv("PORT"); p != "" {
		port = ":" + p
	}
	result.Run(port)
}
