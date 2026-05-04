package scraper

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"
)

// TestGetPlayerDataPrivate hits the real IMLeagues API to confirm that a
// known private profile returns ErrPlayerPrivate cleanly (no panic).
//
// Skipped automatically unless both env vars are set, so this won't run in
// regular `go test ./...` invocations or in CI without a cookie.
//
//	IMLEAGUES_COOKIE          full cookie header string from a logged-in browser
//	IMLEAGUES_PRIVATE_PLAYER  external player ID known to be private
//
// Run with:
//
//	IMLEAGUES_COOKIE='ASP.NET_SessionId=...; ApiTokenForSPA=...' \
//	IMLEAGUES_PRIVATE_PLAYER='<uuid>' \
//	go test -run TestGetPlayerDataPrivate -v ./internal/scraper/
func TestGetPlayerDataPrivate(t *testing.T) {
	cookie := os.Getenv("IMLEAGUES_COOKIE")
	playerID := os.Getenv("IMLEAGUES_PRIVATE_PLAYER")
	if cookie == "" || playerID == "" {
		t.Skip("set IMLEAGUES_COOKIE and IMLEAGUES_PRIVATE_PLAYER to run this live test")
	}

	s := NewIMLeagueScraper(cookie)
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	info, err := s.GetPlayerData(ctx, playerID)

	if !errors.Is(err, ErrPlayerPrivate) {
		t.Fatalf("expected ErrPlayerPrivate, got info=%+v err=%v", info, err)
	}
	if info != nil {
		t.Fatalf("expected nil info on private response, got %+v", info)
	}
	t.Logf("OK: private profile detected cleanly")
}
