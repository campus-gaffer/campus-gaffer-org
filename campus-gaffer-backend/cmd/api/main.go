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
	"golang.org/x/time/rate"
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
	pointRepo := repository.NewPlayerGamePointRepo(db)

	// Auth verifier
	verifier, err := auth.NewVerifier(auth.Config{
		Issuer:    cfg.ClerkIssuer,
		SecretKey: cfg.ClerkSecretKey,
	})
	if err != nil {
		log.Fatalf("auth config: %v", err)
	}

	authMiddleware := middleware.NewAuthMiddleware(verifier, userRepo)
	clerkAdmin := auth.NewClerkAdmin(cfg.ClerkSecretKey)

	// Load timezone for services
	loc, err := time.LoadLocation(cfg.LeagueTz)
	if err != nil {
		log.Fatalf("api: load timezone %q: %v", cfg.LeagueTz, err)
	}

	// Initialize services
	squadSvc := service.NewSquadService(squadRepo, priceRepo, gameRepo, playerRepo, perfRepo, loc)
	squadHandler := handlers.NewSquadHandler(squadSvc)

	// Read-only "GW results" surface — featured match + global top scorer.
	// Wrapped in a 5-minute in-process cache; payload is fully derivable
	// from already-persisted tables, no per-user state.
	gwResultsSvc := service.NewCachedGameweekResultsService(
		service.NewGameweekResultsService(gameRepo, perfRepo, pointRepo, loc),
	)

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
	router := gin.New()

	// CORS must be registered before any other middleware so preflight
	// short-circuits never hit auth or logging side effects.
	router.Use(cors.New(cors.Config{
		AllowOrigins:     parsedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Retry-After"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))
	router.Use(gin.Logger(), gin.Recovery())
	

	// Trust only the proxies named in TRUSTED_PROXIES (comma-separated CIDRs
	// or IPs). When unset we pass nil → gin trusts no proxy and ClientIP()
	// returns the direct peer. Safer default than the gin built-in (which
	// trusts all private ranges).
	if err := router.SetTrustedProxies(parseTrustedProxies(os.Getenv("TRUSTED_PROXIES"))); err != nil {
		log.Fatalf("api: set trusted proxies: %v", err)
	}


	// Liveness probe — mounted before any auth or rate-limit middleware so
	// load balancers / ECS health checks can reach it unconditionally.
	router.GET("/healthz", handlers.Healthz)
	// router.POST("/webhooks/clerk", webhook.ClerkWebhookHandler(userRepo, cfg.WebhookSecret))

	
	// Global per-IP limiter: 60 req/min, burst 60. Applied before auth so
	// unauthenticated floods get rejected cheaply.
	ipLimiter := middleware.NewRateLimiter(rate.Every(time.Second), 60)

	// Per-user write limiter for POST /squads: 5 req/min, burst 5
	// (one token every 12s).
	squadLimiter := middleware.NewRateLimiter(rate.Every(12*time.Second), 5)

	patchMeLimiter := middleware.NewRateLimiter(rate.Every(6 * time.Second), 10)

	api := router.Group("/")
	api.Use(ipLimiter.Middleware(middleware.ByClientIP))
	api.Use(authMiddleware.RequireUser())

	// User endpoints
	api.POST("/users", handlers.CreateUser)
	api.GET("/users", handlers.GetUser)
	api.GET("/users/me", func(c *gin.Context) { handlers.GetMe(c, userRepo) })
	api.DELETE("/users/me", func(c *gin.Context) { handlers.DeleteMe(c, userRepo) })
	api.PATCH("/users/me", authMiddleware.RequireSyncedUser(), patchMeLimiter.Middleware(middleware.ByUserSub),
		func(c *gin.Context) {
			handlers.PatchMe(c, userRepo, clerkAdmin)
	})

	// Squad endpoints. Writes additionally require RequireSyncedUser so the
	// caller's users row is guaranteed to exist before squad insert.
	api.POST("/squads", authMiddleware.RequireSyncedUser(), squadLimiter.Middleware(middleware.ByUserSub), squadHandler.CreateSquad)
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
	api.GET("/gameweeks/last/results", func(c *gin.Context) {
		handlers.GetLastGWResults(c, gwResultsSvc)
	})
	api.GET("/gameweeks/:n/results", func(c *gin.Context) {
		handlers.GetGWResults(c, gwResultsSvc)
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

// parseTrustedProxies splits a comma-separated proxy list (CIDRs or IPs) into
// the slice gin expects. Empty/whitespace input returns nil, which tells gin
// to trust no proxies — the safer default for a service exposed directly
// (e.g. local dev) and explicit when fronted by ALB/CloudFront.
func parseTrustedProxies(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return nil
	}
	return out
}
