package handlers

import (
	"campus-gaffer-backend/internal/service"
	"context"
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GameweekResultsServiceI is the surface the handler needs from a results
// service. Defined here (consumer-side) so the handler can be tested with
// any implementation without dragging in the concrete cache.
type GameweekResultsServiceI interface {
	GetLastCompletedResults(ctx context.Context) (*service.GameweekResults, error)
	GetResultsForGW(ctx context.Context, n int) (*service.GameweekResults, error)
}

// GetLastGWResults handles GET /gameweeks/last/results.
// Pre-GW1 → 200 with all-null payload; frontend renders "Awaiting results
// from GW1" copy.
func GetLastGWResults(c *gin.Context, svc GameweekResultsServiceI) {
	results, err := svc.GetLastCompletedResults(c.Request.Context())
	if err != nil {
		log.Printf("ERROR ErrGWResults: get last completed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch gameweek results"})
		return
	}
	c.JSON(http.StatusOK, results)
}

// GetGWResults handles GET /gameweeks/:n/results.
// 400 on non-int :n. 404 on out-of-range gameweek number.
func GetGWResults(c *gin.Context, svc GameweekResultsServiceI) {
	raw := c.Param("n")
	n, err := strconv.Atoi(raw)
	if err != nil || n < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "gameweek must be a positive integer"})
		return
	}
	results, err := svc.GetResultsForGW(c.Request.Context(), n)
	if err != nil {
		if errors.Is(err, service.ErrGameweekNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "gameweek not found"})
			return
		}
		log.Printf("ERROR ErrGWResults: get gw %d: %v", n, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch gameweek results"})
		return
	}
	c.JSON(http.StatusOK, results)
}
