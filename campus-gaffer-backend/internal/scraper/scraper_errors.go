package scraper

import (
	"encoding/json"
	"errors"

	//"errors"
	"fmt"
	strs "strings"
	//"github.com/google/uuid"
)

type ErrSessionExpired struct {
	msg            string
	routeNamespace string
}

type ErrUnauthorized struct{}

type ErrRateLimited struct{}

type ErrParseFailed struct {
	msg string
	id  string
}

var ErrPlayerPrivate = errors.New("Player's information is private")

type ErrDBWrite struct{}

type ErrTimeout struct{}

// helper local to scraper pkg
func isPrivateResponse(env responseEnvelope) bool {
	// Shape A: envelope-level (the one panicking now)
	if env.Code == 99 && env.Message != nil && strs.Contains(*env.Message, "private") {
		return true
	}
	// Shape B: data-level (the one in private_player.json)
	if len(env.Data) > 0 && string(env.Data) != "null" {
		var probe struct {
			Code    *int    `json:"code"`
			Message *string `json:"message"`
		}
		if json.Unmarshal(env.Data, &probe) == nil &&
			probe.Code != nil && *probe.Code == 99 &&
			probe.Message != nil && strs.Contains(*probe.Message, "private") {
			return true
		}
	}
	return false
}

func (e *ErrSessionExpired) Error() string {
	return fmt.Sprintf("session expired: %s - %s", e.routeNamespace, e.msg)
}

func (e ErrUnauthorized) Error() string {
	return "unauthorized"
}

func (e ErrRateLimited) Error() string {
	return "rate limited"
}

func (e ErrParseFailed) Error() string {
	return "parse failed"
}

func (e ErrDBWrite) Error() string {
	return "db write failed"
}

func (e ErrTimeout) Error() string {
	return "timeout"
}
