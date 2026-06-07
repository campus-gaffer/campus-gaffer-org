package auth

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestClerkAdmin_UpdateDisplayName_Success(t *testing.T) {
	var gotPath, gotMethod, gotAuth, gotContentType string
	var gotBody map[string]any

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotMethod = r.Method
		gotAuth = r.Header.Get("Authorization")
		gotContentType = r.Header.Get("Content-Type")
		raw, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(raw, &gotBody)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"id":"user_abc"}`))
	}))
	defer srv.Close()

	c := NewClerkAdminWithBaseURL("sk_test_secret", srv.URL)
	err := c.UpdateDisplayName(context.Background(), "user_abc", "Gaffer42")
	if err != nil {
		t.Fatalf("expected nil err, got %v", err)
	}

	if gotMethod != http.MethodPatch {
		t.Errorf("method = %q, want PATCH", gotMethod)
	}
	if gotPath != "/users/user_abc" {
		t.Errorf("path = %q, want /users/user_abc", gotPath)
	}
	if gotAuth != "Bearer sk_test_secret" {
		t.Errorf("Authorization = %q, want Bearer sk_test_secret", gotAuth)
	}
	if !strings.HasPrefix(gotContentType, "application/json") {
		t.Errorf("Content-Type = %q, want application/json", gotContentType)
	}
	meta, _ := gotBody["public_metadata"].(map[string]any)
	if meta == nil || meta["displayName"] != "Gaffer42" {
		t.Errorf("body public_metadata.displayName mismatch: %v", gotBody)
	}
}

func TestClerkAdmin_UpdateDisplayName_4xx(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusUnprocessableEntity)
		_, _ = w.Write([]byte(`{"errors":[{"message":"invalid metadata"}]}`))
	}))
	defer srv.Close()

	c := NewClerkAdminWithBaseURL("sk_test_secret", srv.URL)
	err := c.UpdateDisplayName(context.Background(), "user_abc", "Gaffer42")
	if err == nil {
		t.Fatal("expected error on 422, got nil")
	}
	if !errors.Is(err, ErrClerkSyncFailed) {
		t.Errorf("err does not wrap ErrClerkSyncFailed: %v", err)
	}
}

func TestClerkAdmin_UpdateDisplayName_EmptyUserID(t *testing.T) {
	c := NewClerkAdmin("sk_test")
	err := c.UpdateDisplayName(context.Background(), "", "Gaffer42")
	if !errors.Is(err, ErrClerkSyncFailed) {
		t.Fatalf("expected ErrClerkSyncFailed on empty userID, got %v", err)
	}
}
