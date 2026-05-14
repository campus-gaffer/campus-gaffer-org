package handler

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"

	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/handlers"
	"campus-gaffer-backend/internal/models"

	"github.com/gin-gonic/gin"
)

var (
	router *gin.Engine
	once   sync.Once
	initErr error
)

func getRouter() (*gin.Engine, error) {
	once.Do(func() {
		// DATABASE_URL should be set via Vercel env vars
		dbURL := os.Getenv("DATABASE_URL")
		if dbURL == "" {
			initErr = fmt.Errorf("DATABASE_URL not set")
			return
		}

		database.Connect()
		if database.DB == nil {
			initErr = fmt.Errorf("failed to connect to database")
			return
		}

		database.DB.AutoMigrate(
			&models.User{}, &models.Player{}, &models.Match{},
			&models.SquadMember{}, &models.MatchEvent{},
			&models.Division{}, &models.Team{}, &models.Game{}, &models.GameData{},
		)

		// Warm up queries to refresh PgBouncer cached plans after schema changes
		database.DB.Exec("SELECT * FROM users LIMIT 0")
		database.DB.Exec("SELECT * FROM player_data LIMIT 0")
		database.DB.Exec("SELECT * FROM squad_members LIMIT 0")
		database.DB.Exec("SELECT * FROM matches LIMIT 0")
		database.DB.Exec("SELECT * FROM match_events LIMIT 0")

		r := gin.Default()
		r.Use(func(c *gin.Context) {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			if c.Request.Method == "OPTIONS" {
				c.AbortWithStatus(204)
				return
			}
			c.Next()
		})

		r.POST("/users", handlers.CreateUser)
		r.PUT("/users/:clerk_id", handlers.UpdateUserOnboarding)
		r.GET("/users", handlers.GetUsers)
		r.GET("/users/:clerk_id", handlers.GetUserByClerkID)
		r.GET("/players", handlers.GetPlayers)
		r.GET("/players/:id", handlers.GetPlayerByID)
		r.GET("/matches/live", handlers.GetLiveMatch)
		r.GET("/matches", handlers.GetAllMatches)
		r.GET("/matches/:id", handlers.GetMatchByID)
		r.GET("/matches/:id/events", handlers.GetMatchEvents)
		r.POST("/squad/:clerk_id", handlers.UpdateSquad)
		r.GET("/squad/:clerk_id", handlers.GetSquad)
		r.PUT("/squad/:clerk_id/captain", handlers.SetCaptain)
		r.GET("/leaderboard", handlers.GetLeaderboard)
		r.GET("/rewards", handlers.GetRewards)
		r.POST("/admin/update-cookie", handlers.UpdateCookie)

		router = r
		log.Println("Campus Gaffer API initialized successfully")
	})
	return router, initErr
}

func Handler(w http.ResponseWriter, r *http.Request) {
	rtr, err := getRouter()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"failed to initialize API: ` + err.Error() + `"}`))
		return
	}
	rtr.ServeHTTP(w, r)
}
