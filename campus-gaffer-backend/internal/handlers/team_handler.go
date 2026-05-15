package handlers

import (
	"campus-gaffer-backend/internal/database"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetTeams(c *gin.Context) {
	type TeamInfo struct {
		ID              string `json:"id"`
		Name            string `json:"name"`
		ExternalTeamID  string `json:"external_team_id"`
		ExternalSource  string `json:"external_source"`
		PlayerCount     int64  `json:"player_count"`
		TotalGoals      int64  `json:"total_goals"`
	}

	var teams []TeamInfo
	database.DB.Raw(`
		SELECT
			t.id::text,
			t.name,
			t.external_team_id,
			t.external_source,
			COUNT(DISTINCT pp.player_id) as player_count,
			COALESCE(SUM(pp.goals), 0) as total_goals
		FROM teams t
		LEFT JOIN player_performances pp ON pp.team_id = t.id
		GROUP BY t.id, t.name, t.external_team_id, t.external_source
		ORDER BY total_goals DESC
	`).Scan(&teams)

	if teams == nil {
		teams = []TeamInfo{}
	}

	c.JSON(http.StatusOK, teams)
}
