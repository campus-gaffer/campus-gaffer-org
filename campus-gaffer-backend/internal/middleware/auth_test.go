package middleware

import (
	"campus-gaffer-backend/internal/auth"
	"campus-gaffer-backend/internal/models"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

type stubUserRepo struct {
	called bool
	user   *models.User
}

func (s *stubUserRepo) UpsertAuthUser(_ context.Context, user *models.User) error {
	s.called = true
	s.user = user
	return nil
}

func (s *stubUserRepo) UpdateUsername(_ context.Context, _ string, _ string) error {
	return nil
}

func (s *stubUserRepo) FindByID(_ context.Context, _ string) (*models.User, error) {
	return nil, nil
}

type stubVerifier struct {
	claims *auth.Claims
	err    error
	header string
}

func (s *stubVerifier) VerifyBearerToken(_ context.Context, authz string) (*auth.Claims, error) {
	s.header = authz
	if s.err != nil {
		return nil, s.err
	}
	return s.claims, nil
}

func newTestMiddleware(t *testing.T) (*AuthMiddleware, *stubUserRepo) {
	t.Helper()
	verifier, err := auth.NewVerifier(auth.Config{
		Issuer:    "https://x.clerk.accounts.dev",
		SecretKey: "sk_test_x",
	})
	if err != nil {
		t.Fatalf("verifier: %v", err)
	}
	repo := &stubUserRepo{}
	return NewAuthMiddleware(verifier, repo), repo
}

// A request with no Authorization header must be rejected with 401 before any
// token verification network call or user sync happens.
func newRouter(mw *AuthMiddleware, nextCalled *bool) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/squads", mw.RequireUser(), func(c *gin.Context) {
		*nextCalled = true
		c.Status(http.StatusOK)
	})
	return r
}

func TestRequireUser_NoToken_401(t *testing.T) {
	mw, repo := newTestMiddleware(t)
	nextCalled := false
	r := newRouter(mw, &nextCalled)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodPost, "/squads", nil))

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("want 401, got %d", w.Code)
	}
	if nextCalled {
		t.Fatal("downstream handler should not run on auth failure")
	}
	if repo.called {
		t.Fatal("user sync should not run on auth failure")
	}
}

// A malformed bearer token must also yield 401, not 503.
func TestRequireUser_GarbageToken_401(t *testing.T) {
	mw, _ := newTestMiddleware(t)
	nextCalled := false
	r := newRouter(mw, &nextCalled)

	req := httptest.NewRequest(http.MethodPost, "/squads", nil)
	req.Header.Set("Authorization", "Bearer not-a-jwt")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("want 401, got %d", w.Code)
	}
}

func TestRequireUser_ValidToken_SetsContextAndSyncsUser(t *testing.T) {
	repo := &stubUserRepo{}
	verifier := &stubVerifier{
		claims: &auth.Claims{
			Subject:           "user_clerk_123",
			Email:             "manager@example.com",
			PreferredUsername: "manager",
		},
	}
	mw := NewAuthMiddleware(verifier, repo)
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/squads", mw.RequireUser(), func(c *gin.Context) {
		id, ok := AuthenticatedUserID(c.Request.Context())
		if !ok || id != "user_clerk_123" {
			t.Fatalf("want user_clerk_123/true, got %q/%v", id, ok)
		}
		c.Status(http.StatusCreated)
	})

	req := httptest.NewRequest(http.MethodPost, "/squads", nil)
	req.Header.Set("Authorization", "Bearer token")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("want 201, got %d", w.Code)
	}
	if verifier.header != "Bearer token" {
		t.Fatalf("verifier got header %q", verifier.header)
	}
	if !repo.called {
		t.Fatal("user sync should run on auth success")
	}
	if repo.user == nil || repo.user.ID != "user_clerk_123" {
		t.Fatalf("synced user ID = %#v, want user_clerk_123", repo.user)
	}
}

func TestAuthenticatedUserID(t *testing.T) {
	ctx := context.WithValue(context.Background(), claimsContextKey, &auth.Claims{Subject: "user_123"})
	id, ok := AuthenticatedUserID(ctx)
	if !ok || id != "user_123" {
		t.Fatalf("want user_123/true, got %q/%v", id, ok)
	}

	if _, ok := AuthenticatedUserID(context.Background()); ok {
		t.Fatal("missing claims should return false")
	}
}
