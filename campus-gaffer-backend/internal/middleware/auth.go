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

const claimsContextKey authContextKey = "auth_claims"

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

		// Best-effort user sync. squads.user_id is set from the verified token
		// subject and has no FK to users, so a sync hiccup must not block an
		// otherwise-authenticated write. Log and continue.
		user := &models.User{
			ID:       claims.Subject,
			Username: deriveUsername(claims),
			Email:    deriveEmail(claims),
		}
		if err := m.users.UpsertAuthUser(c.Request.Context(), user); err != nil {
			log.Printf("auth: user sync failed for %s: %v", claims.Subject, err)
		}

		ctx := context.WithValue(c.Request.Context(), claimsContextKey, claims)
		c.Request = c.Request.WithContext(ctx)
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
