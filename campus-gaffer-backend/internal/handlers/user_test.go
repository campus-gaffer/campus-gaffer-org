package handlers

import (
	"bytes"
	"campus-gaffer-backend/internal/auth"
	"campus-gaffer-backend/internal/middleware"
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/repository"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

// TestValidDisplayName covers the regex + rune-length + trim rules in one
// table. Mirrors the frontend validator — keep both in sync.
func TestValidDisplayName(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want bool
	}{
		{"too short (4 chars)", "abcd", false},
		{"too long (21 chars)", strings.Repeat("a", 21), false},
		{"contains space", "Sam OBrien", false},
		{"contains @ symbol", "user@host", false},
		{"5-char min boundary", "abcde", true},
		{"20-char max boundary", strings.Repeat("a", 20), true},
		{"unicode letters (François)", "François", true},
		{"apostrophe allowed", "O'Brien123", true},
		{"hyphen allowed", "Jean-Luc", true},
		{"dot allowed", "user.name", true},
		{"underscore allowed", "user_name", true},
		{"digits allowed", "user12345", true},
		// "Sam O'Brien" contains a space → invalid per regex.
		{"name with space rejected", "Sam O'Brien", false},
		{"empty string", "", false},
		{"leading whitespace rejected", " abcde", false},
		{"trailing whitespace rejected", "abcde ", false},
		// 20 runes / >20 bytes — utf8.RuneCountInString must count runes.
		{"20 unicode runes ok", strings.Repeat("é", 20), true},
		{"21 unicode runes rejected", strings.Repeat("é", 21), false},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := validDisplayName(tc.in); got != tc.want {
				t.Fatalf("validDisplayName(%q) = %v, want %v", tc.in, got, tc.want)
			}
		})
	}
}

// fakeUserRepo records writes and lets tests script collisions / errors
// without needing a live DB.
type fakeUserRepo struct {
	updateErr     error
	updatedID     string
	updatedName   string
	findResult    *models.User
	findErr       error
	upsertCalls   int
	updateCalls   int
}

func (r *fakeUserRepo) UpsertAuthUser(_ context.Context, _ *models.User) error {
	r.upsertCalls++
	return nil
}

func (r *fakeUserRepo) UpdateUsername(_ context.Context, id, name string) error {
	r.updateCalls++
	r.updatedID = id
	r.updatedName = name
	return r.updateErr
}

func (r *fakeUserRepo) FindByID(_ context.Context, id string) (*models.User, error) {
	if r.findErr != nil {
		return nil, r.findErr
	}
	if r.findResult != nil {
		return r.findResult, nil
	}
	return &models.User{ID: id, Username: r.updatedName, UsernameCustomized: true}, nil
}

type stubVerifier struct {
	claims *auth.Claims
}

func (v *stubVerifier) VerifyBearerToken(_ context.Context, _ string) (*auth.Claims, error) {
	return v.claims, nil
}

func newPatchRouter(t *testing.T, repo repository.UserRepository, subject string) http.Handler {
	t.Helper()
	gin.SetMode(gin.TestMode)
	mw := middleware.NewAuthMiddleware(&stubVerifier{claims: &auth.Claims{Subject: subject}}, repo)
	r := gin.New()
	r.PATCH("/users/me", mw.RequireUser(), mw.RequireSyncedUser(), func(c *gin.Context) {
		PatchMe(c, repo, nil) // nil clerkAdmin → no goroutine fired in tests
	})
	return r
}

func doPatch(handler http.Handler, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPatch, "/users/me", strings.NewReader(body))
	req.Header.Set("Authorization", "Bearer test")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)
	return w
}

// TestPatchMe_RejectsAttackerSuppliedID is the §12 regression — extra
// fields in the body must be ignored. Only display_name is honoured;
// id comes from the JWT.
func TestPatchMe_RejectsAttackerSuppliedID(t *testing.T) {
	repo := &fakeUserRepo{}
	r := newPatchRouter(t, repo, "user_clerk_owner")

	w := doPatch(r, `{"display_name":"valid_name","id":"attacker","user_id":"attacker"}`)

	if w.Code != http.StatusOK {
		t.Fatalf("want 200, got %d: %s", w.Code, w.Body.String())
	}
	if repo.updatedID != "user_clerk_owner" {
		t.Fatalf("UpdateUsername id = %q, want authenticated subject", repo.updatedID)
	}
	if repo.updatedName != "valid_name" {
		t.Fatalf("UpdateUsername name = %q, want \"valid_name\"", repo.updatedName)
	}
}

func TestPatchMe_InvalidName_Returns422(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"too short", `{"display_name":"abcd"}`},
		{"contains space", `{"display_name":"hello world"}`},
		{"contains @", `{"display_name":"foo@bar"}`},
		{"empty", `{"display_name":""}`},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			repo := &fakeUserRepo{}
			r := newPatchRouter(t, repo, "user_abc")
			w := doPatch(r, tc.body)
			if w.Code != http.StatusUnprocessableEntity {
				t.Fatalf("want 422, got %d: %s", w.Code, w.Body.String())
			}
			if repo.updateCalls != 0 {
				t.Fatalf("UpdateUsername should not be called on invalid input, got %d calls", repo.updateCalls)
			}
			var body map[string]string
			_ = json.Unmarshal(w.Body.Bytes(), &body)
			if body["error"] != "ErrInvalidDisplayName" {
				t.Fatalf("error = %q, want ErrInvalidDisplayName", body["error"])
			}
		})
	}
}

func TestPatchMe_DisplayNameTaken_Returns409(t *testing.T) {
	repo := &fakeUserRepo{updateErr: repository.ErrDisplayNameTaken}
	r := newPatchRouter(t, repo, "user_abc")
	w := doPatch(r, `{"display_name":"taken_name"}`)
	if w.Code != http.StatusConflict {
		t.Fatalf("want 409, got %d: %s", w.Code, w.Body.String())
	}
	var body map[string]string
	_ = json.Unmarshal(w.Body.Bytes(), &body)
	if body["error"] != "ErrDisplayNameTaken" {
		t.Fatalf("error = %q, want ErrDisplayNameTaken", body["error"])
	}
}

func TestPatchMe_HappyPath_Returns200WithUser(t *testing.T) {
	repo := &fakeUserRepo{}
	r := newPatchRouter(t, repo, "user_happy")
	w := doPatch(r, `{"display_name":"valid_name"}`)
	if w.Code != http.StatusOK {
		t.Fatalf("want 200, got %d: %s", w.Code, w.Body.String())
	}
	var u models.User
	if err := json.NewDecoder(bytes.NewReader(w.Body.Bytes())).Decode(&u); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if u.ID != "user_happy" || u.Username != "valid_name" || !u.UsernameCustomized {
		t.Fatalf("user payload mismatch: %+v", u)
	}
}
