package middleware

import (
	"campus-gaffer-backend/internal/auth"
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type authContextKey string

const (
	claimsContextKey  authContextKey = "auth_claims"
	syncErrContextKey authContextKey = "auth_sync_err"
)

type TokenVerifier interface {
	VerifyBearerToken(ctx context.Context, authz string) (*auth.Claims, error)
}

type AuthMiddleware struct {
	verifier TokenVerifier
	users    repository.UserRepository
}

func NewAuthMiddleware(verifier TokenVerifier, users repository.UserRepository) *AuthMiddleware {
	return &AuthMiddleware{
		verifier: verifier,
		users:    users,
	}
}

func (m *AuthMiddleware) RequireUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, err := m.verifier.VerifyBearerToken(c.Request.Context(), c.GetHeader("Authorization"))
		if err != nil {
			// Bad/missing token is the client's fault (401). A JWKS fetch
			// failure is ours (503) — the token may be perfectly valid.
			status := http.StatusUnauthorized
			if errors.Is(err, auth.ErrKeysUnavailable) {
				status = http.StatusServiceUnavailable
			}
			c.AbortWithStatusJSON(status, gin.H{"error": "authentication required"})
			return
		}

		// Best-effort user sync. Read endpoints tolerate failure; writes chain
		// RequireSyncedUser below to enforce success.
		user := &models.User{
			ID:       claims.Subject,
			Username: deriveUsername(claims),
			Email:    deriveEmail(claims),
		}
		syncErr := m.users.UpsertAuthUser(c.Request.Context(), user)
		if syncErr != nil {
			log.Printf("auth: user sync failed for %s: %v", claims.Subject, syncErr)
		}

		ctx := context.WithValue(c.Request.Context(), claimsContextKey, claims)
		if syncErr != nil {
			ctx = context.WithValue(ctx, syncErrContextKey, syncErr)
		}
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

// RequireSyncedUser aborts with 503 when the upstream RequireUser middleware
// failed to upsert the users row. Apply on write paths whose business logic
// assumes the user record exists (e.g. POST /squads).
func (m *AuthMiddleware) RequireSyncedUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		if err, ok := c.Request.Context().Value(syncErrContextKey).(error); ok && err != nil {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "user sync failed; retry"})
			return
		}
		c.Next()
	}
}

func AuthenticatedUserID(ctx context.Context) (string, bool) {
	claims, ok := ctx.Value(claimsContextKey).(*auth.Claims)
	if !ok || claims == nil || claims.Subject == "" {
		return "", false
	}
	return claims.Subject, true
}

func deriveUsername(claims *auth.Claims) string {
	for _, candidate := range []string{claims.Username, claims.PreferredUsername, claims.Email} {
		candidate = strings.TrimSpace(candidate)
		if candidate != "" {
			return candidate
		}
	}
	suffix := claims.Subject
	if len(suffix) > 8 {
		suffix = suffix[:8]
	}
	return fmt.Sprintf("Manager-%s", suffix)
}

func deriveEmail(claims *auth.Claims) string {
	email := strings.TrimSpace(claims.Email)
	if email != "" {
		return email
	}
	return claims.Subject + "@local.invalid"
}
