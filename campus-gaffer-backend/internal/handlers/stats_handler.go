package handlers

import (
	"campus-gaffer-backend/internal/database"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetStats(c *gin.Context) {
	type stat struct {
		Users         int64 `json:"users"`
		Players       int64 `json:"players"`
		Matches       int64 `json:"matches"`
		Games         int64 `json:"games"`
		ScrapedGames  int64 `json:"scraped_games"`
		Teams         int64 `json:"teams"`
		Performances  int64 `json:"performances"`
	}

	var s stat
	database.DB.Table("users").Count(&s.Users)
	database.DB.Table("players").Count(&s.Players)
	database.DB.Table("matches").Count(&s.Matches)
	database.DB.Table("games").Count(&s.Games)
	database.DB.Table("player_performances").Count(&s.Performances)
	database.DB.Table("teams").Count(&s.Teams)
	database.DB.Where("is_scraped = ?", true).Table("games").Count(&s.ScrapedGames)

	c.JSON(http.StatusOK, s)
}
