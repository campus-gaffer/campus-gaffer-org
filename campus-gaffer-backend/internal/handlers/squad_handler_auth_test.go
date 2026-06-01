package handlers

import (
	"campus-gaffer-backend/internal/auth"
	"campus-gaffer-backend/internal/middleware"
	"campus-gaffer-backend/internal/models"
	"campus-gaffer-backend/internal/service"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type authRouteVerifier struct {
	claims *auth.Claims
}

func (v *authRouteVerifier) VerifyBearerToken(_ context.Context, _ string) (*auth.Claims, error) {
	return v.claims, nil
}

type authRouteUserRepo struct{}

func (r *authRouteUserRepo) UpsertAuthUser(_ context.Context, _ *models.User) error {
	return nil
}

func (r *authRouteUserRepo) UpdateUsername(_ context.Context, _ string, _ string) error {
	return nil
}

func (r *authRouteUserRepo) FindByID(_ context.Context, _ string) (*models.User, error) {
	return nil, nil
}

type recordingSquadService struct {
	req service.CreateSquadRequest
}

func (s *recordingSquadService) CreateSquad(_ context.Context, req service.CreateSquadRequest) (*models.Squad, []models.SquadPlayer, error) {
	s.req = req
	return &models.Squad{
		Id:     uuid.MustParse("11111111-1111-4111-8111-111111111111"),
		UserID: req.UserID,
	}, nil, nil
}

func (s *recordingSquadService) GetSquad(context.Context, uuid.UUID, string) (*models.Squad, []models.SquadPlayer, error) {
	return nil, nil, service.ErrSquadNotFound
}

func (s *recordingSquadService) GetSquadByUserID(context.Context, string) (*models.Squad, error) {
	return nil, service.ErrSquadNotFound
}

func (s *recordingSquadService) GetSquadPoints(context.Context, uuid.UUID, string) (*service.SquadPointsResponse, error) {
	return nil, service.ErrSquadNotFound
}

func TestCreateSquad_UsesAuthenticatedUserID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	svc := &recordingSquadService{}
	handler := NewSquadHandler(svc)
	authMiddleware := middleware.NewAuthMiddleware(
		&authRouteVerifier{claims: &auth.Claims{Subject: "user_clerk_owner"}},
		&authRouteUserRepo{},
	)

	r := gin.New()
	r.POST("/squads", authMiddleware.RequireUser(), handler.CreateSquad)

	body := `{
		"user_id": "attacker_supplied_user",
		"gameweek": 1,
		"starters": [
			"00000000-0000-4000-8000-000000000001",
			"00000000-0000-4000-8000-000000000002",
			"00000000-0000-4000-8000-000000000003",
			"00000000-0000-4000-8000-000000000004",
			"00000000-0000-4000-8000-000000000005",
			"00000000-0000-4000-8000-000000000006"
		],
		"bench": [
			"00000000-0000-4000-8000-000000000007",
			"00000000-0000-4000-8000-000000000008",
			"00000000-0000-4000-8000-000000000009",
			"00000000-0000-4000-8000-000000000010"
		]
	}`
	req := httptest.NewRequest(http.MethodPost, "/squads", strings.NewReader(body))
	req.Header.Set("Authorization", "Bearer valid")
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("want 201, got %d: %s", w.Code, w.Body.String())
	}
	if svc.req.UserID != "user_clerk_owner" {
		t.Fatalf("UserID = %q, want authenticated subject", svc.req.UserID)
	}
}
