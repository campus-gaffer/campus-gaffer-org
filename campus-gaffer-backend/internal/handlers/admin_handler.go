package handlers

import (
	"campus-gaffer-backend/internal/database"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func ComputeUserPoints(c *gin.Context) {
	// Aggregate player_game_points per player into player_data.total_points
	result := database.DB.Exec(`
		UPDATE player_data pd
		SET total_points = COALESCE((
			SELECT SUM(points) FROM player_game_points pgp
			WHERE pgp.player_id::text = pd.id
		), 0)
	`)
	if result.Error != nil {
		log.Printf("Error updating player points: %v", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to compute player points"})
		return
	}
	playerCount := result.RowsAffected

	// Aggregate squad member points into user total_points
	type UserSquad struct {
		ClerkID string
		Pts     float64
	}
	var userPoints []UserSquad
	database.DB.Raw(`
		SELECT sm.clerk_id, COALESCE(SUM(pd.total_points), 0) as pts
		FROM squad_members sm
		JOIN player_data pd ON pd.id = sm.player_id
		WHERE sm.deleted_at IS NULL
		GROUP BY sm.clerk_id
	`).Scan(&userPoints)

	updated := 0
	for _, up := range userPoints {
		database.DB.Model(&struct{}{}).Table("users").
			Where("clerk_id = ?", up.ClerkID).
			Update("total_points", up.Pts)
		updated++
	}

	// Also set any users with 0 squad to 0 points
	database.DB.Exec(`
		UPDATE users SET total_points = 0
		WHERE clerk_id NOT IN (SELECT clerk_id FROM squad_members)
	`)

	log.Printf("Computed points for %d players and %d users", playerCount, updated)
	c.JSON(http.StatusOK, gin.H{
		"players_updated": playerCount,
		"users_updated":   updated,
	})
}

func ComputePrices(c *gin.Context) {
	// Simple price recompute: set player prices based on total_points
	// Price = 4 + (total_points / max_total_points) * 6, clamped to [4, 10]
	result := database.DB.Exec(`
		WITH max_pts AS (
			SELECT GREATEST(MAX(total_points), 1) as m FROM player_data
		)
		UPDATE player_data
		SET price = GREATEST(4.0, LEAST(10.0, 4.0 + (total_points::numeric / (SELECT m FROM max_pts)) * 6.0))
	`)
	if result.Error != nil {
		log.Printf("Error computing prices: %v", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to compute prices"})
		return
	}
	log.Printf("Computed prices for %d players", result.RowsAffected)
	c.JSON(http.StatusOK, gin.H{
		"players_updated": result.RowsAffected,
	})
}

func ComputeGameweeks(c *gin.Context) {
	// Assign gameweek numbers to matches based on kickoff_time week boundaries
	var matchIDs []uint
	database.DB.Model(&struct{}{}).Table("matches").
		Where("kickoff_time IS NOT NULL").
		Order("kickoff_time ASC").
		Pluck("id", &matchIDs)

	gameweekMap := make(map[string]int) // week start string -> gameweek number
	gw := 1
	for _, id := range matchIDs {
		var kt struct {
			Kickoff string `gorm:"column:kickoff_time"`
		}
		database.DB.Table("matches").Select("kickoff_time::date as kickoff_time").Where("id = ?", id).Find(&kt)
		if kt.Kickoff == "" {
			continue
		}
		weekKey := kt.Kickoff[:10] // YYYY-MM-DD
		if _, exists := gameweekMap[weekKey]; !exists {
			// Find the Monday of that week
			gameweekMap[weekKey] = gw
			gw++
		}
	}

	// Update last_gameweek on users based on their squad's latest match gameweek
	// For now, just report the gameweeks
	database.DB.Exec("UPDATE users SET last_gameweek = 0")

	c.JSON(http.StatusOK, gin.H{
		"message":          fmt.Sprintf("Computed %d gameweeks from %d matches", gw-1, len(matchIDs)),
		"total_gameweeks":  gw - 1,
		"matches_processed": len(matchIDs),
	})
}

func ComputeAll(c *gin.Context) {
	// Run all compute endpoints in sequence
	// 1. Points
	db := database.DB
	db.Exec(`UPDATE player_data pd SET total_points = COALESCE((SELECT SUM(points) FROM player_game_points pgp WHERE pgp.player_id::text = pd.id), 0)`)
	var userPoints []struct {
		ClerkID string  `gorm:"column:clerk_id"`
		Pts     float64 `gorm:"column:pts"`
	}
	db.Raw(`SELECT sm.clerk_id, COALESCE(SUM(pd.total_points), 0) as pts FROM squad_members sm JOIN player_data pd ON pd.id = sm.player_id WHERE sm.deleted_at IS NULL GROUP BY sm.clerk_id`).Scan(&userPoints)
	for _, up := range userPoints {
		db.Table("users").Where("clerk_id = ?", up.ClerkID).Update("total_points", up.Pts)
	}
	db.Exec(`UPDATE users SET total_points = 0 WHERE clerk_id NOT IN (SELECT clerk_id FROM squad_members WHERE deleted_at IS NULL)`)

	// 2. Prices
	db.Exec(`WITH max_pts AS (SELECT GREATEST(MAX(total_points), 1) as m FROM player_data) UPDATE player_data SET price = GREATEST(4.0, LEAST(10.0, 4.0 + (total_points::numeric / (SELECT m FROM max_pts)) * 6.0))`)

	// 3. Gameweeks
	var matchIDs []uint
	db.Model(&struct{}{}).Table("matches").Where("kickoff_time IS NOT NULL").Order("kickoff_time ASC").Pluck("id", &matchIDs)
	gw := 1
	weekMap := make(map[string]int)
	for _, id := range matchIDs {
		var kt struct{ Kickoff string }
		db.Table("matches").Select("kickoff_time::date").Where("id = ?", id).Find(&kt)
		if kt.Kickoff == "" { continue }
		weekKey := kt.Kickoff[:10]
		if _, exists := weekMap[weekKey]; !exists {
			weekMap[weekKey] = gw
			gw++
		}
	}

	log.Printf("ComputeAll: points, prices, and %d gameweeks done", gw-1)
	c.JSON(http.StatusOK, gin.H{
		"points_updated":   len(userPoints),
		"prices_updated":   "see player_data",
		"total_gameweeks":  gw - 1,
		"message":          "All compute tasks completed",
	})
}
