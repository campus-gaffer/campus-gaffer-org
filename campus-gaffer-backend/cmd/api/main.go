package main

import (
	"campus-gaffer-backend/internal/config"
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/handlers"
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/service"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// LeagueTZ mirrors the constant in cmd/pricing — will move to per-league
// config when multi-league support is added.
const LeagueTZ = "America/Winnipeg"

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	database.Connect(cfg.DBUri)

	loc, err := time.LoadLocation(LeagueTZ)
	if err != nil {
		log.Fatalf("api: load timezone %q: %v", LeagueTZ, err)
	}

	database.DB.AutoMigrate(&models.User{}, &models.Squad{}, &models.SquadPlayer{})

	gameRepo := repository.NewGameRepo(database.DB)
	squadRepo := repository.NewSquadRepo(database.DB)
	priceRepo := repository.NewPlayerPriceRepo(database.DB)
	squadSvc := service.NewSquadService(squadRepo, priceRepo, gameRepo, loc)
	squadHandler := handlers.NewSquadHandler(squadSvc)

	result := gin.Default()

	result.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	result.POST("/users", handlers.CreateUser)
	result.GET("/users", handlers.GetUser)

	result.POST("/squads", squadHandler.CreateSquad)
	result.GET("/squads/:id", squadHandler.GetSquad)
	result.GET("/squads/:id/points", squadHandler.GetSquadPoints)

	result.Run(":8081")
}
