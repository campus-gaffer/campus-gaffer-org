package main

import (
	"campus-gaffer-backend/internal/api/handlers"
	"campus-gaffer-backend/internal/api/middleware"
	"campus-gaffer-backend/internal/config"
	"campus-gaffer-backend/internal/database"
	"context"

	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/service"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := loadAPIConfig()
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
	cacheMiddleware, err := middleware.NewPlayerCacheMiddleware(playerRepo)
	if err != nil {
		log.Printf("cache middleware: failed to create middleware")
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

	if cacheMiddleware != nil {
		result.Use(cacheMiddleware.Middleware())
	}

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

func loadAPIConfig() (config.Config, error) {
	// ECS uses IAM + SSM; local development keeps using .env via config.Load.
	if os.Getenv("USE_SSM_CONFIG") == "true" {
		return config.LoadFromSSM(context.Background())
	}
	return config.Load()
}
