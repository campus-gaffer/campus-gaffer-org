package main

import (
	"campus-gaffer-backend/internal/auth"
	"campus-gaffer-backend/internal/config"
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/handlers"
	"campus-gaffer-backend/internal/middleware"

	// "campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/service"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	db := database.Connect(cfg.DBUri)

	// Initialize repositories
	userRepo := repository.NewUserRepo(db)
	squadRepo := repository.NewSquadRepo(db)
	priceRepo := repository.NewPlayerPriceRepo(db)
	gameRepo := repository.NewGameRepo(db)
	playerRepo := repository.NewPlayerRepo(db)
	perfRepo := repository.NewPlayerPerfRepo(db)

	// Auth verifier
	verifier, err := auth.NewVerifier(auth.Config{
		Issuer:    cfg.ClerkIssuer,
		SecretKey: cfg.ClerkSecretKey,
	})
	if err != nil {
		log.Fatalf("auth config: %v", err)
	}
	authMiddleware := middleware.NewAuthMiddleware(verifier, userRepo)

	// Load timezone for services
	loc, err := time.LoadLocation(cfg.LeagueTz)
	if err != nil {
		log.Fatalf("api: load timezone %q: %v", cfg.LeagueTz, err)
	}

	// Initialize services
	squadSvc := service.NewSquadService(squadRepo, priceRepo, gameRepo, playerRepo, perfRepo, loc)
	squadHandler := handlers.NewSquadHandler(squadSvc)

	// Pre-fetch priced player payload on startup; refreshed only when needed.
	playerCache, err := handlers.NewPlayerCache(playerRepo, priceRepo, gameRepo, loc)
	if err != nil {
		log.Printf("warning: failed to pre-fetch players cache: %v", err)
	}

	// Parse CORS allowlist from env. Fail loud if unset/empty — no permissive default.
	rawOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	parsedOrigins := make([]string, 0)
	for _, o := range strings.Split(rawOrigins, ",") {
		if trimmed := strings.TrimSpace(o); trimmed != "" {
			parsedOrigins = append(parsedOrigins, trimmed)
		}
	}
	if len(parsedOrigins) == 0 {
		log.Fatalf("CORS_ALLOWED_ORIGINS not set — refusing to start with no origins")
	}

	// CORS must be registered before any other middleware so preflight
	// short-circuits never hit auth or logging side effects.
	router := gin.New()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     parsedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Retry-After"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))
	router.Use(gin.Logger(), gin.Recovery())

	api := router.Group("/")
	api.Use(authMiddleware.RequireUser())

	// User endpoints
	api.POST("/users", handlers.CreateUser)
	api.GET("/users", handlers.GetUser)

	// Squad endpoints. Writes additionally require RequireSyncedUser so the
	// caller's users row is guaranteed to exist before squad insert.
	api.POST("/squads", authMiddleware.RequireSyncedUser(), squadHandler.CreateSquad)
	api.GET("/squads/:id", squadHandler.GetSquad)
	api.GET("/squads/:id/points", squadHandler.GetSquadPoints)
	api.GET("/users/me/squad", squadHandler.GetMySquad)

	// Game/Player/Gameweek endpoints
	api.GET("/players", func(c *gin.Context) {
		if playerCache != nil {
			handlers.GetPlayersFromCache(c, playerCache)
			return
		}
		handlers.GetPlayers(c, gameRepo, playerRepo, priceRepo, loc)
	})
	api.GET("/gameweeks/current", func(c *gin.Context) {
		handlers.GetCurrentGameweek(c, gameRepo, loc)
	})
	api.GET("/leaderboard", func(c *gin.Context) {
		handlers.GetLeaderboard(c, squadRepo, gameRepo, loc)
	})

	port := ":8081"
	if p := os.Getenv("PORT"); p != "" {
		port = ":" + p
	}
	router.Run(port)
}
