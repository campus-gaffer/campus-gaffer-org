package handlers

import (
	"log"
	"net/http"
	"os"
	"strings"

	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/models"

	"github.com/gin-gonic/gin"
)

// UpdateCookie accepts IMLeagues session cookies and persists them.
// It stores values both in the DB (scraper_cookies table) and updates the .env file.
func UpdateCookie(c *gin.Context) {
	var req models.UpdateCookieRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload: " + err.Error()})
		return
	}

	// Upsert cookies in DB
	cookies := map[string]string{
		"ASP.NET_SessionId":       req.ASPNetSessionID,
		"ApiRefreshTokenForSPA":   req.ApiRefreshTokenForSPA,
	}

	for key, value := range cookies {
		if value == "" {
			continue
		}
		var existing models.ScraperCookie
		result := database.DB.Where("key = ?", key).First(&existing)
		if result.Error != nil {
			database.DB.Create(&models.ScraperCookie{Key: key, Value: value})
		} else {
			database.DB.Model(&existing).Update("value", value)
		}
	}

	// Also update .env file for the scraper to read
	updateEnvFile(cookies)

	log.Printf("🔐 Cookies updated: ASP.NET_SessionId=%s..., ApiRefreshToken=%s...",
		truncate(req.ASPNetSessionID, 8),
		truncate(req.ApiRefreshTokenForSPA, 8))

	c.JSON(http.StatusOK, gin.H{"status": "cookies updated"})
}

// updateEnvFile patches the .env file with new cookie values
func updateEnvFile(cookies map[string]string) {
	envPath := ".env"
	data, err := os.ReadFile(envPath)
	if err != nil {
		log.Printf("⚠️ Could not read .env for cookie update: %v", err)
		return
	}

	lines := strings.Split(string(data), "\n")
	updated := make(map[string]bool)

	for i, line := range lines {
		for key, value := range cookies {
			if strings.HasPrefix(strings.TrimSpace(line), key+"=") {
				lines[i] = key + "=" + value
				updated[key] = true
			}
		}
	}

	// Append any new keys that weren't found
	for key, value := range cookies {
		if !updated[key] {
			lines = append(lines, key+"="+value)
		}
	}

	if err := os.WriteFile(envPath, []byte(strings.Join(lines, "\n")), 0644); err != nil {
		log.Printf("⚠️ Could not write .env: %v", err)
	}
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}
