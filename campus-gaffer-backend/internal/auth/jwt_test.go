package auth

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/clerk/clerk-sdk-go/v2"
)

func TestExtractBearerToken(t *testing.T) {
	cases := []struct {
		name    string
		header  string
		want    string
		wantErr bool
	}{
		{"valid", "Bearer abc.def.ghi", "abc.def.ghi", false},
		{"missing prefix", "abc.def.ghi", "", true},
		{"empty after prefix", "Bearer ", "", true},
		{"wrong case", "bearer abc", "", true},
		{"empty header", "", "", true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := extractBearerToken(tc.header)
			if tc.wantErr {
				if !errors.Is(err, ErrMissingToken) {
					t.Fatalf("want ErrMissingToken, got %v", err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tc.want {
				t.Fatalf("want %q, got %q", tc.want, got)
			}
		})
	}
}

// TestLookupKeyAmplificationGuard verifies that an unknown kid against a fresh
// cache is rejected as an invalid token WITHOUT triggering a network refresh.
// This is the guard against using random kids to amplify requests to Clerk.
func TestLookupKeyAmplificationGuard(t *testing.T) {
	v := &Verifier{
		issuer: "https://x.clerk.accounts.dev",
		keys:   map[string]*clerk.JSONWebKey{"known": {KeyID: "known"}},
		// fetchedAt = now means the cache is fresh; refreshKeys must not run.
		fetchedAt: time.Now(),
	}

	if _, err := v.lookupKey(context.Background(), "known"); err != nil {
		t.Fatalf("known kid should resolve, got %v", err)
	}

	_, err := v.lookupKey(context.Background(), "bogus")
	if !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("unknown kid on fresh cache should be ErrInvalidToken, got %v", err)
	}
	if errors.Is(err, ErrKeysUnavailable) {
		t.Fatalf("unknown kid on fresh cache must not attempt a network refresh")
	}
}

func TestLookupKeyEmptyKid(t *testing.T) {
	v := &Verifier{keys: map[string]*clerk.JSONWebKey{}, fetchedAt: time.Now()}
	if _, err := v.lookupKey(context.Background(), ""); !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("empty kid should be ErrInvalidToken, got %v", err)
	}
}

func TestNewVerifierValidation(t *testing.T) {
	if _, err := NewVerifier(Config{SecretKey: "sk_test"}); err == nil {
		t.Fatal("missing issuer should error")
	}
	if _, err := NewVerifier(Config{Issuer: "https://x.clerk.accounts.dev"}); err == nil {
		t.Fatal("missing secret key should error")
	}
	if _, err := NewVerifier(Config{Issuer: "https://x.clerk.accounts.dev", SecretKey: "sk_test"}); err != nil {
		t.Fatalf("valid config should not error, got %v", err)
	}
}
