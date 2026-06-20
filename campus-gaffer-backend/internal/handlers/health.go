package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Healthz is an unauthenticated liveness probe. Mounted outside the auth +
// rate-limit middleware so load balancers and container orchestrators can
// reach it unconditionally.
func Healthz(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
