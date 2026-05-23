package middleware

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"context"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

type PlayerCacheMiddleWare struct {
	players []models.Player
}


func NewPlayerCacheMiddleware(playerRepo repository.PlayerRepository) (*PlayerCacheMiddleWare, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	log.Println("Using middleware for player data")
	players, err := playerRepo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	log.Printf("PlayerCache: prefetched %d player data", len(players))
	return &PlayerCacheMiddleWare{players: players}, nil
}

func (pc *PlayerCacheMiddleWare) Middleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ctx.Set("cachedPlayers", pc.players)
		ctx.Next()
	}
}