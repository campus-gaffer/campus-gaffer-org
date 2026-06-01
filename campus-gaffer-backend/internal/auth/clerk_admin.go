package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// ErrClerkSyncFailed signals that the Clerk admin API rejected the request
// or was unreachable. Callers treat this as best-effort — PATCH /users/me
// logs but does not surface the failure to the client.
var ErrClerkSyncFailed = errors.New("clerk sync failed")

// clerkAPIBase is the Clerk backend admin API root. Overridable by tests via
// NewClerkAdminWithBaseURL.
const clerkAPIBase = "https://api.clerk.com/v1"

// ClerkAdmin issues authenticated calls to Clerk's backend admin API.
// Distinct from the JWT verifier in jwt.go — that consumes Clerk-issued
// tokens, this one mutates the user record stored in Clerk.
type ClerkAdmin struct {
	secretKey  string
	baseURL    string
	httpClient *http.Client
}

func NewClerkAdmin(secretKey string) *ClerkAdmin {
	return &ClerkAdmin{
		secretKey: secretKey,
		baseURL:   clerkAPIBase,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// NewClerkAdminWithBaseURL is a test seam: swap the API root for an httptest
// server. Production callers should use NewClerkAdmin.
func NewClerkAdminWithBaseURL(secretKey, baseURL string) *ClerkAdmin {
	c := NewClerkAdmin(secretKey)
	c.baseURL = baseURL
	return c
}

// UpdateDisplayName mirrors the user's chosen display name to Clerk by
// writing it into public_metadata.displayName. The DB remains the
// authoritative source; this call is best-effort so other Clerk-aware
// surfaces (e.g. SignIn UI, dashboards) see the same value.
//
// We intentionally write public_metadata (not Clerk's `username` field) so
// our looser regex (5-20, includes apostrophes/dots/dashes) is not bound by
// Clerk's stricter username constraints.
func (c *ClerkAdmin) UpdateDisplayName(ctx context.Context, userID, displayName string) error {
	if userID == "" {
		return fmt.Errorf("%w: empty userID", ErrClerkSyncFailed)
	}

	payload := map[string]any{
		"public_metadata": map[string]any{
			"displayName": displayName,
		},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("%w: marshal: %v", ErrClerkSyncFailed, err)
	}

	endpoint := c.baseURL + "/users/" + url.PathEscape(userID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPatch, endpoint, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("%w: build request: %v", ErrClerkSyncFailed, err)
	}
	req.Header.Set("Authorization", "Bearer "+c.secretKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrClerkSyncFailed, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}
	// Drain body for log context but cap it so a misbehaving upstream can't
	// blow up our log line.
	snippet, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
	return fmt.Errorf("%w: status=%d body=%s", ErrClerkSyncFailed, resp.StatusCode, string(snippet))
}
