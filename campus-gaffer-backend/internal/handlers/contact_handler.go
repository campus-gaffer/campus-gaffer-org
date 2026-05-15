package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

const resendAPIKey = "re_c7CQnZHj_JLyEB8iqv4H71y7tYVgWg2jv"

type ContactRequest struct {
	Email   string `json:"email"`
	Subject string `json:"subject"`
	Message string `json:"message"`
}

func HandleContact(c *gin.Context) {
	var req ContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if req.Email == "" || req.Subject == "" || req.Message == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All fields required"})
		return
	}

	payload := map[string]interface{}{
		"from":    "Campus Gaffer <contact@campusgaffer.com>",
		"to":      []string{"campusgaffer@resend.dev"},
		"subject": fmt.Sprintf("[Campus Gaffer] %s", req.Subject),
		"text":    fmt.Sprintf("From: %s\n\n---\n\n%s", req.Email, req.Message),
	}

	body, _ := json.Marshal(payload)
	req2, _ := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(body))
	req2.Header.Set("Authorization", fmt.Sprintf("Bearer %s", resendAPIKey))
	req2.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req2)
	if err != nil {
		log.Printf("Resend error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		log.Printf("Resend returned %d", resp.StatusCode)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send"})
		return
	}

	log.Printf("Contact form submitted by %s: %s", req.Email, req.Subject)
	c.JSON(http.StatusOK, gin.H{"status": "sent"})
}
