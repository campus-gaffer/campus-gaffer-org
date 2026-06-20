package handlers

import (
	"campus-gaffer-backend/internal/auth"
	"campus-gaffer-backend/internal/database"
	"campus-gaffer-backend/internal/middleware"
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"context"
	"errors"
	"log"
	"net/http"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
)

func CreateUser(c *gin.Context) {
	var user models.User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := database.DB.Create(&user)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create user"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func GetUser(c *gin.Context) {
	var users []models.User

	result := database.DB.Find(&users)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch users"})
		return
	}

	c.JSON(http.StatusOK, users)
}

// displayNameRe matches the frontend validator in ProfileScreen exactly.
// UTF-8 letters and numbers allowed; no spaces, no `@`. Length is enforced
// separately via utf8.RuneCountInString because Go's `regexp` length
// quantifiers count bytes, not runes — so `{5,20}` against `François`
// (8 runes, 9 bytes) would mis-bound.
var displayNameRe = regexp.MustCompile(`^[\p{L}\p{N}_'\-.]+$`)

const (
	displayNameMin = 5
	displayNameMax = 20
)

// patchMeBody is intentionally narrow: only display_name is honoured. Any
// id / user_id / created_at etc. supplied in the body is silently dropped —
// the authenticated subject is the only source of identity (see §12).
type patchMeBody struct {
	DisplayName string `json:"display_name"`
}

// PatchMe applies a user-driven display-name change. DB is authoritative;
// Clerk's public_metadata.displayName is mirrored best-effort in a detached
// goroutine so a Clerk outage cannot fail the user's save.
func PatchMe(c *gin.Context, userRepo repository.UserRepository, clerkAdmin *auth.ClerkAdmin) {
	userID, ok := middleware.AuthenticatedUserID(c.Request.Context())
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
		return
	}

	var body patchMeBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "ErrInvalidDisplayName"})
		return
	}

	name := body.DisplayName
	if !validDisplayName(name) {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "ErrInvalidDisplayName"})
		return
	}

	if err := userRepo.UpdateUsername(c.Request.Context(), userID, name); err != nil {
		if errors.Is(err, repository.ErrDisplayNameTaken) {
			c.JSON(http.StatusConflict, gin.H{"error": "ErrDisplayNameTaken"})
			return
		}
		log.Printf("ERROR user_update_failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update user"})
		return
	}

	// Best-effort Clerk mirror. context.Background so the goroutine survives
	// the request-scoped context being cancelled when we return below.
	if clerkAdmin != nil {
		go func(uid, n string) {
			if err := clerkAdmin.UpdateDisplayName(context.Background(), uid, n); err != nil {
				log.Printf("ERROR clerk_sync_failed: %v", err)
			}
		}(userID, name)
	}

	updated, err := userRepo.FindByID(c.Request.Context(), userID)
	if err != nil {
		log.Printf("ERROR user_update_failed: post-update fetch: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch user"})
		return
	}
	c.JSON(http.StatusOK, updated)
}

// validDisplayName enforces trim-clean + regex + rune-length. Trimming
// changing the value is rejected, not silently fixed, so the stored value
// matches exactly what the user saw on screen.
func validDisplayName(s string) bool {
	if s == "" {
		return false
	}
	if s != strings.TrimSpace(s) {
		return false
	}
	n := utf8.RuneCountInString(s)
	if n < displayNameMin || n > displayNameMax {
		return false
	}
	return displayNameRe.MatchString(s)
}

// GetMe returns the authenticated user's row. Backs the frontend's
// HomeScreen bell + ProfileScreen prefill — clients read
// `username_customized` from this payload to decide whether to nudge the
// user toward setting a display name.
func GetMe(c *gin.Context, userRepo repository.UserRepository) {
	userID, ok := middleware.AuthenticatedUserID(c.Request.Context())
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
		return
	}
	u, err := userRepo.FindByID(c.Request.Context(), userID)
	if err != nil {
		log.Printf("ERROR user_fetch_failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch user"})
		return
	}
	c.JSON(http.StatusOK, u)
}
