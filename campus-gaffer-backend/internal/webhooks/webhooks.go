package webhook

import (
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/svix/svix-webhooks/go"
)


type ClerkEvent struct {
	Type string `json:"type"`
	Data json.RawMessage `json:"data"`
}


type ClerkUserData struct {
	ID             string `json:"id"`
	Username       string `json:"username"`
	EmailAddresses []struct {
		ID           string `json:"id"`
		EmailAddress string `json:"email_address"`
	} `json:"email_addresses"`
	PrimaryEmailAddressID string `json:"primary_email_address_id"`
}

func ClerkWebhookHandler(repo repository.UserRepository, webhookSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if webhookSecret == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Server misconfiguration"})
			return
		}

		payload, err := io.ReadAll(c.Request.Body)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "empty payload"})
			return
		}

		headers := c.Request.Header
		svixID := headers.Get("svix-id")
		svixTimestamp := headers.Get("svix-timestamp")
		svixSignature := headers.Get("svix-signature")

		if svixID == "" || svixTimestamp == "" || svixSignature == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing svix headers"})
			return
		}

		wh, err := svix.NewWebhook(webhookSecret)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid webhook"})
			return
		}

		err = wh.Verify(payload, headers)

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Failed to verify signature"})
			return 
		}

		var event ClerkEvent
		if err := json.Unmarshal(payload, &event); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Bad payload format"})
			return
		}

		switch event.Type {
		case "user.created", "user.updated":
			var userData ClerkUserData
			if err := json.Unmarshal(event.Data, &userData); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user data format"})
				return
			}
			var primaryEmail string
			for _, emailObj := range userData.EmailAddresses {
				if emailObj.ID == userData.PrimaryEmailAddressID {
					primaryEmail = emailObj.EmailAddress
					break
				}
			}

			user := models.User{
				ID: userData.ID,
				Username: userData.Username,
				Email: primaryEmail,
			}
			
			err = repo.UpsertAuthUser(c, &user)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database sync failed"})
				return
			}
			log.Printf("Successfully synced user %s\n", user.ID)
		case "user.deleted":
			var deleteData struct {
				ID string `json:"id"`
			}

			if err := json.Unmarshal(event.Data, &deleteData); err == nil {
				deleted, err := repo.DeleteUser(c, deleteData.ID)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "User doesn't exist or failed to delete"})
					return
				}
				log.Printf("Successfully deleted user: %s\n", deleted.Username)
			}
		}
		c.JSON(http.StatusOK, gin.H{"message": "webhook processed"})
	}
}