package handlers

import (
	"campus-gaffer-backend/internal/service"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SquadHandler struct {
	svc service.SquadService
}

func NewSquadHandler(svc service.SquadService) *SquadHandler {
	return &SquadHandler{svc: svc}
}

type createSquadBody struct {
	UserID   string   `json:"user_id" binding:"required"`
	Gameweek int      `json:"gameweek" binding:"required,min=1"`
	Starters []string `json:"starters" binding:"required"`
	Bench    []string `json:"bench" binding:"required"`
}

func (h *SquadHandler) CreateSquad(c *gin.Context) {
	var body createSquadBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := uuid.Parse(body.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user_id"})
		return
	}
	starters, err := parseUUIDs(body.Starters)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid starter id: " + err.Error()})
		return
	}
	bench, err := parseUUIDs(body.Bench)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid bench id: " + err.Error()})
		return
	}

	req := service.CreateSquadRequest{
		UserID:   userID,
		Gameweek: body.Gameweek,
		Starters: starters,
		Bench:    bench,
	}
	squad, players, err := h.svc.CreateSquad(c.Request.Context(), req)
	if err != nil {
		if isSquadValidationErr(err) {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create squad"})
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{"squad": squad, "players": players})
}

func (h *SquadHandler) GetSquad(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid squad id"})
		return
	}
	squad, players, err := h.svc.GetSquad(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrSquadNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "squad not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch squad"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"squad": squad, "players": players})
}

func (h *SquadHandler) GetSquadPoints(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid squad id"})
		return
	}
	resp, err := h.svc.GetSquadPoints(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrSquadNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "squad not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch points"})
		}
		return
	}
	c.JSON(http.StatusOK, resp)
}

func isSquadValidationErr(err error) bool {
	return errors.Is(err, service.ErrWrongStarterCount) ||
		errors.Is(err, service.ErrWrongBenchCount) ||
		errors.Is(err, service.ErrDuplicatePlayer) ||
		errors.Is(err, service.ErrBudgetExceeded) ||
		errors.Is(err, service.ErrSquadExists)
}

func parseUUIDs(ss []string) ([]uuid.UUID, error) {
	ids := make([]uuid.UUID, len(ss))
	for i, s := range ss {
		id, err := uuid.Parse(s)
		if err != nil {
			return nil, err
		}
		ids[i] = id
	}
	return ids, nil
}
