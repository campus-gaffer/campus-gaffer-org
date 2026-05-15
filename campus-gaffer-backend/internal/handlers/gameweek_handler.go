package handlers

import (
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetGameweekPoints returns the total points for the user's squad in the current gameweek.
func GetGameweekPoints(c *gin.Context) {
	clerkID := c.Param("clerk_id")

	var user models.User
	if err := database.DB.Where("clerk_id = ?", clerkID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// Get the user's squad member player_ids
	var squadMembers []models.SquadMember
	database.DB.Where("clerk_id = ? AND deleted_at IS NULL", clerkID).Find(&squadMembers)

	if len(squadMembers) == 0 {
		c.JSON(http.StatusOK, gin.H{"gameweek": user.LastGameweek, "points": 0})
		return
	}

	// Sum player_game_points for the most recent gameweek
	// We use the games table to determine which games are in which gameweek
	type Result struct {
		TotalPoints int
	}
	var result Result
	database.DB.Raw(`
		SELECT COALESCE(SUM(pgp.points), 0) AS total_points
		FROM player_game_points pgp
		JOIN games g ON g.id = pgp.game_id
		WHERE pgp.player_id IN (
			SELECT p.id FROM player_data p WHERE p.id IN (
				SELECT sm.player_id::uuid FROM squad_members sm WHERE sm.clerk_id = ? AND sm.deleted_at IS NULL
			)
		)
		AND g.id IN (
			SELECT g2.id FROM games g2
			WHERE g2.game_date >= (
				SELECT MIN(m.kickoff_time) FROM matches m
				WHERE m.gameweek = (SELECT MAX(m2.gameweek) FROM matches m2)
			)
			AND g2.game_date < (
				SELECT MIN(m.kickoff_time) + interval '7 days' FROM matches m
				WHERE m.gameweek = (SELECT MAX(m2.gameweek) FROM matches m2)
			)
		)
	`, clerkID).Scan(&result)

	c.JSON(http.StatusOK, gin.H{
		"gameweek": user.LastGameweek,
		"points":   result.TotalPoints,
	})
}
