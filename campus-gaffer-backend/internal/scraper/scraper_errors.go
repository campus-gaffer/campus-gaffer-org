package scraper

import (
	"errors"
	"fmt"
)

type ErrSessionExpired struct {
	Msg            string
	RouteNamespace string
}

var ErrUnauthorized = errors.New("Unauthorized or not logged in")

type ErrRateLimited struct{}

type ErrParseFailed struct {
	msg string
	id  string
}

var ErrPlayerPrivate = errors.New("player info is private")

type ErrDBWrite struct{}

type ErrTimeout struct{}


func (e *ErrSessionExpired) Error() string {
	return fmt.Sprintf("session expired: %s - %s", e.RouteNamespace, e.Msg)
}

func (e *ErrSessionExpired) Is(target error) bool {
	_, ok := target.(*ErrSessionExpired)
	return ok
}

//func (e ErrUnauthorized) Error() string {
//	return "unauthorized"
//}

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
