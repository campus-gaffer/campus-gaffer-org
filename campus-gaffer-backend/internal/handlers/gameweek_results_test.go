package handlers

import (
	"campus-gaffer-backend/internal/service"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

type stubResultsSvc struct {
	last *service.GameweekResults
	byN  map[int]*service.GameweekResults
	err  error
}

func (s *stubResultsSvc) GetLastCompletedResults(_ context.Context) (*service.GameweekResults, error) {
	return s.last, s.err
}

func (s *stubResultsSvc) GetResultsForGW(_ context.Context, n int) (*service.GameweekResults, error) {
	if s.err != nil {
		return nil, s.err
	}
	if v, ok := s.byN[n]; ok {
		return v, nil
	}
	return nil, service.ErrGameweekNotFound
}

func TestGetLastGWResults_NoCompletedGW_ReturnsNullPayload(t *testing.T) {
	gin.SetMode(gin.TestMode)
	svc := &stubResultsSvc{last: &service.GameweekResults{}}

	r := gin.New()
	r.GET("/gameweeks/last/results", func(c *gin.Context) { GetLastGWResults(c, svc) })

	req := httptest.NewRequest(http.MethodGet, "/gameweeks/last/results", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	// All fields null in JSON.
	body := w.Body.String()
	if !strings.Contains(body, `"gameweek":null`) ||
		!strings.Contains(body, `"match":null`) ||
		!strings.Contains(body, `"top_scorer":null`) {
		t.Errorf("body should have all-null fields, got %s", body)
	}
}

func TestGetLastGWResults_Populated_ReturnsExpectedShape(t *testing.T) {
	gin.SetMode(gin.TestMode)
	gw := 3
	svc := &stubResultsSvc{last: &service.GameweekResults{
		Gameweek: &gw,
		Match:    &service.FeaturedMatch{Home: "Kings", Away: "Trinity", HomeScore: 3, AwayScore: 1},
		TopScorer: &service.TopScorer{Name: "Doyle", Team: "Kings", Points: 11},
	}}

	r := gin.New()
	r.GET("/gameweeks/last/results", func(c *gin.Context) { GetLastGWResults(c, svc) })

	req := httptest.NewRequest(http.MethodGet, "/gameweeks/last/results", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	var body struct {
		Gameweek  *int `json:"gameweek"`
		Match     *struct {
			Home      string `json:"home"`
			Away      string `json:"away"`
			HomeScore int    `json:"home_score"`
			AwayScore int    `json:"away_score"`
		} `json:"match"`
		TopScorer *struct {
			Name   string `json:"name"`
			Team   string `json:"team"`
			Points int    `json:"points"`
		} `json:"top_scorer"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body.Gameweek == nil || *body.Gameweek != 3 {
		t.Errorf("gameweek = %v, want 3", body.Gameweek)
	}
	if body.Match.Home != "Kings" || body.Match.AwayScore != 1 {
		t.Errorf("match = %+v", body.Match)
	}
	if body.TopScorer.Name != "Doyle" || body.TopScorer.Points != 11 {
		t.Errorf("top_scorer = %+v", body.TopScorer)
	}
}

func TestGetGWResults_NonInteger_Returns400(t *testing.T) {
	gin.SetMode(gin.TestMode)
	svc := &stubResultsSvc{}
	r := gin.New()
	r.GET("/gameweeks/:n/results", func(c *gin.Context) { GetGWResults(c, svc) })

	req := httptest.NewRequest(http.MethodGet, "/gameweeks/abc/results", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func TestGetGWResults_OutOfRange_Returns404(t *testing.T) {
	gin.SetMode(gin.TestMode)
	svc := &stubResultsSvc{byN: map[int]*service.GameweekResults{}}
	r := gin.New()
	r.GET("/gameweeks/:n/results", func(c *gin.Context) { GetGWResults(c, svc) })

	req := httptest.NewRequest(http.MethodGet, "/gameweeks/99/results", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404", w.Code)
	}
}

func TestGetGWResults_Found_Returns200(t *testing.T) {
	gin.SetMode(gin.TestMode)
	gw := 2
	svc := &stubResultsSvc{byN: map[int]*service.GameweekResults{
		2: {Gameweek: &gw, Match: &service.FeaturedMatch{Home: "A", Away: "B", HomeScore: 1, AwayScore: 0}},
	}}
	r := gin.New()
	r.GET("/gameweeks/:n/results", func(c *gin.Context) { GetGWResults(c, svc) })

	req := httptest.NewRequest(http.MethodGet, "/gameweeks/2/results", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", w.Code)
	}
}
