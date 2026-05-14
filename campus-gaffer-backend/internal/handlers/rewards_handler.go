package handlers

import (
	"campus-gaffer-backend/internal/database"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Reward struct {
	Week       int    `json:"week"`
	Rank1Prize string `json:"rank_1_prize"`
	Rank2Prize string `json:"rank_2_prize"`
	Rank3Prize string `json:"rank_3_prize"`
	Active     bool   `json:"active"`
}

func (Reward) TableName() string {
	return "rewards"
}

func GetRewards(c *gin.Context) {
	var rewards []Reward
	database.DB.Where("active = ?", true).Order("week ASC").Find(&rewards)
	if rewards == nil {
		rewards = []Reward{}
	}
	c.JSON(http.StatusOK, rewards)
}
