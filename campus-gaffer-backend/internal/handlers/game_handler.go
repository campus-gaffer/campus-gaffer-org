package handlers

import (
	"campus-gaffer-backend/internal/repository"
	"campus-gaffer-backend/internal/season"
	"context"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PlayerCache holds pre-fetched players with their current prices.
// Pre-fetches on startup to avoid SELECT * on every /players request.
// Valid for the entire gameweek; invalidated when scraper runs at gameweek boundary.
type PlayerCache struct {
	mu             sync.RWMutex
	players        []playerResponse
	cachedGameweek int
	nextCheckAt    time.Time
	checkInterval  time.Duration
	playerRepo     repository.PlayerRepository
	priceRepo      repository.PlayerPriceRepository
	gameRepo       repository.GameRepository
	loc            *time.Location
}

type playerResponse struct {
	ID               uuid.UUID `json:"id"`
	Name             string    `json:"name"`
	Position         string    `json:"position"` // Will be empty/unknown for now; can be enriched later
	Team             string    `json:"team"`     // Primary team (most appearances); empty if no performances
	Price            float64   `json:"price"`
	ExternalPlayerID string    `json:"external_player_id"`
}

// GetPlayers returns the full player pool for the draft screen.
// Includes current gameweek prices from the player_prices table.
// Response: [{id, name, position, price, externalPlayerId}]
func GetPlayers(c *gin.Context, gameRepo repository.GameRepository, playerRepo repository.PlayerRepository, priceRepo repository.PlayerPriceRepository, loc *time.Location) {
	ctx := c.Request.Context()

	// Get all active players
	players, err := playerRepo.FindAll(ctx)
	if err != nil {
		log.Printf("GetPlayers: find all players: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch players"})
		return
	}

	// Get current gameweek
	gwInfo, err := currentGameweek(ctx, gameRepo, loc)
	currentGW := gwInfo.Number
	if err != nil || currentGW == 0 {
		currentGW = 1
	}

	// Primary team per player. Non-fatal: on error, players just have no team.
	teams, err := playerRepo.PrimaryTeams(ctx)
	if err != nil {
		log.Printf("GetPlayers: primary teams: %v", err)
		teams = map[uuid.UUID]string{}
	}

	result := make([]playerResponse, len(players))
	for i, p := range players {
		price, err := priceRepo.GetEffectivePrice(ctx, p.Id, currentGW)
		if err != nil {
			price = repository.PriceFloor
		}

		result[i] = playerResponse{
			ID:               p.Id,
			Name:             p.Name,
			Position:         "",
			Team:             teams[p.Id],
			Price:            price,
			ExternalPlayerID: p.ExternalPlayerId,
		}
	}

	c.JSON(http.StatusOK, result)
}

// GetCurrentGameweek returns the current gameweek number and its deadline (kickoff time).
// Response: {gameweek: int, deadline: RFC3339}
func GetCurrentGameweek(c *gin.Context, gameRepo repository.GameRepository, loc *time.Location) {
	ctx := c.Request.Context()

	gw, err := currentGameweek(ctx, gameRepo, loc)
	if err != nil || gw.Number == 0 {
		// No games yet; return gameweek 1 with a safe future deadline.
		c.JSON(http.StatusOK, gin.H{
			"gameweek": 1,
			"deadline": time.Now().In(loc).AddDate(0, 0, 7),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"gameweek": gw.Number,
		"deadline": gw.Cutoff,
	})
}

// GetLeaderboard returns global standings: all users ranked by total (season) points.
// Paginated: ?limit=50&offset=0
// Response: {total: int, leaderboard: [{rank, user_id, username, total_points, gw_points}]}
func GetLeaderboard(c *gin.Context, squadRepo repository.SquadRepository, gameRepo repository.GameRepository, loc *time.Location) {
	ctx := c.Request.Context()

	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	// Resolve current GW window for per-GW points. Non-fatal: falls back to zero
	// values which causes the repository to return gw_points=0 for all rows.
	gw, _ := currentGameweek(ctx, gameRepo, loc)

	rows, total, err := squadRepo.Leaderboard(ctx, limit, offset, gw.Start, gw.Cutoff)
	if err != nil {
		log.Printf("GetLeaderboard: query failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch leaderboard"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total":       total,
		"leaderboard": rows,
	})
}

// currentGameweek resolves the active gameweek from the DB schedule.
// Returns a zero-value Gameweek on error or when no games exist.
func currentGameweek(ctx context.Context, gameRepo repository.GameRepository, loc *time.Location) (season.Gameweek, error) {
	games, err := gameRepo.FindRegularSeason(ctx)
	if err != nil || len(games) == 0 {
		return season.Gameweek{}, err
	}

	gws := season.RegularGameweeks(games, loc)
	if len(gws) == 0 {
		return season.Gameweek{}, nil
	}

	// First gameweek whose cutoff is still in the future.
	now := time.Now().In(loc)
	for _, gw := range gws {
		if now.Before(gw.Cutoff) {
			return gw, nil
		}
	}

	// All gameweeks have passed; return the last one.
	return gws[len(gws)-1], nil
}

// NewPlayerCache pre-fetches all players and their prices on startup.
// Returns an error if pre-fetch fails; the API can continue with a warning.
func NewPlayerCache(playerRepo repository.PlayerRepository, priceRepo repository.PlayerPriceRepository, gameRepo repository.GameRepository, loc *time.Location) (*PlayerCache, error) {
	cache := &PlayerCache{
		checkInterval: 2 * time.Minute,
		playerRepo:    playerRepo,
		priceRepo:     priceRepo,
		gameRepo:      gameRepo,
		loc:           loc,
	}
	if err := cache.refreshIfNeeded(true); err != nil {
		return nil, err
	}
	return cache, nil
}

// GetPlayersFromCache returns the cached player list.
// No DB hit; serves pre-computed data for the current gameweek.
func GetPlayersFromCache(c *gin.Context, cache *PlayerCache) {
	if err := cache.refreshIfNeeded(false); err != nil {
		log.Printf("GetPlayersFromCache: refresh failed: %v", err)
	}

	cache.mu.RLock()
	defer cache.mu.RUnlock()

	if len(cache.players) == 0 {
		c.JSON(http.StatusOK, []playerResponse{})
		return
	}

	c.JSON(http.StatusOK, cache.players)
}

func (cache *PlayerCache) refreshIfNeeded(force bool) error {
	now := time.Now()

	cache.mu.RLock()
	shouldRefresh := force || len(cache.players) == 0 || now.After(cache.nextCheckAt)
	cache.mu.RUnlock()
	if !shouldRefresh {
		return nil
	}

	cache.mu.Lock()
	defer cache.mu.Unlock()

	now = time.Now()
	shouldRefresh = force || len(cache.players) == 0 || now.After(cache.nextCheckAt)
	if !shouldRefresh {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	gwInfo, err := currentGameweek(ctx, cache.gameRepo, cache.loc)
	currentGW := gwInfo.Number
	if err != nil {
		if cache.cachedGameweek != 0 {
			cache.nextCheckAt = now.Add(cache.checkInterval)
			return nil
		}
		currentGW = 1
	}

	if !force && len(cache.players) > 0 && cache.cachedGameweek == currentGW {
		cache.nextCheckAt = now.Add(cache.checkInterval)
		return nil
	}

	players, err := cache.playerRepo.FindAll(ctx)
	if err != nil {
		return err
	}

	// Primary team per player. Non-fatal: on error, players just have no team.
	teams, err := cache.playerRepo.PrimaryTeams(ctx)
	if err != nil {
		log.Printf("PlayerCache: primary teams: %v", err)
		teams = map[uuid.UUID]string{}
	}

	result := make([]playerResponse, len(players))
	for i, p := range players {
		price, err := cache.priceRepo.GetEffectivePrice(ctx, p.Id, currentGW)
		if err != nil {
			price = repository.PriceFloor
		}
		result[i] = playerResponse{
			ID:               p.Id,
			Name:             p.Name,
			Position:         "",
			Team:             teams[p.Id],
			Price:            price,
			ExternalPlayerID: p.ExternalPlayerId,
		}
	}

	cache.players = result
	cache.cachedGameweek = currentGW
	cache.nextCheckAt = now.Add(cache.checkInterval)
	log.Printf("PlayerCache: refreshed %d players for gameweek %d", len(result), currentGW)
	return nil
}
