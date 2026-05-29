// Package auth verifies Clerk session JWTs.
//
// Signature verification, claim parsing and clock-skew handling are delegated
// to the official Clerk Go SDK (github.com/clerk/clerk-sdk-go/v2). We only own
// two things on top of the SDK:
//
//  1. A small cache of the JSON Web Key Set so we don't call Clerk's backend
//     API on every request (the SDK's jwt.GetJSONWebKey is uncached).
//  2. An explicit issuer pin. The SDK only checks the issuer is *some* Clerk
//     domain; we additionally require it to equal our configured instance.
package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwks"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
)

var (
	ErrMissingToken = errors.New("missing bearer token")
	ErrInvalidToken = errors.New("invalid token")
	// ErrKeysUnavailable signals an infrastructure problem (JWKS fetch failed),
	// not a bad token. Callers should surface this as 503, not 401.
	ErrKeysUnavailable = errors.New("signing keys unavailable")
)

// clockLeeway tolerates small clock differences between this server and Clerk.
// Clerk session tokens are short-lived (~60s), so some leeway avoids spurious
// 401s without materially widening the validity window.
const clockLeeway = 30 * time.Second

// jwksTTL bounds how often we refetch the key set from Clerk.
const jwksTTL = 15 * time.Minute

type Config struct {
	// Issuer is the expected `iss` claim, e.g. https://your-app.clerk.accounts.dev.
	Issuer string
	// SecretKey is the Clerk backend secret key (sk_...). Required by the SDK
	// to fetch the JWKS from Clerk's backend API.
	SecretKey string
}

// Claims is the subset of verified token data the rest of the app consumes.
type Claims struct {
	Subject           string
	Issuer            string
	Email             string
	Username          string
	PreferredUsername string
}

type Verifier struct {
	issuer     string
	jwksClient *jwks.Client

	mu        sync.RWMutex
	keys      map[string]*clerk.JSONWebKey
	fetchedAt time.Time
}

func NewVerifier(cfg Config) (*Verifier, error) {
	if cfg.Issuer == "" {
		return nil, fmt.Errorf("auth: issuer is required")
	}
	if cfg.SecretKey == "" {
		return nil, fmt.Errorf("auth: secret key is required")
	}
	// Configure the SDK's global backend with our secret key. This backend is
	// what the jwks client below uses to reach Clerk's API.
	clerk.SetKey(cfg.SecretKey)
	return &Verifier{
		issuer:     strings.TrimRight(cfg.Issuer, "/"),
		jwksClient: &jwks.Client{Backend: clerk.GetBackend()},
		keys:       map[string]*clerk.JSONWebKey{},
	}, nil
}

func (v *Verifier) VerifyBearerToken(ctx context.Context, authz string) (*Claims, error) {
	token, err := extractBearerToken(authz)
	if err != nil {
		return nil, err
	}
	return v.VerifyToken(ctx, token)
}

func (v *Verifier) VerifyToken(ctx context.Context, token string) (*Claims, error) {
	// Decode (no verification) only to read the `kid` so we can select the key.
	unverified, err := jwt.Decode(ctx, &jwt.DecodeParams{Token: token})
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}

	key, err := v.lookupKey(ctx, unverified.KeyID)
	if err != nil {
		return nil, err
	}

	claims, err := jwt.Verify(ctx, &jwt.VerifyParams{
		Token:  token,
		JWK:    key,
		Leeway: clockLeeway,
		// Capture any custom claims (e.g. email/username added via a Clerk JWT
		// template) into a map so we can read them below.
		CustomClaimsConstructor: func(context.Context) any { return &map[string]any{} },
	})
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}

	// Defense-in-depth: the SDK only checks the issuer is a Clerk domain.
	// Pin it to our configured instance so a token from another Clerk tenant
	// can never be accepted (even if its key somehow validated).
	if strings.TrimRight(claims.Issuer, "/") != v.issuer {
		return nil, fmt.Errorf("%w: unexpected issuer", ErrInvalidToken)
	}
	if claims.Subject == "" {
		return nil, fmt.Errorf("%w: missing subject", ErrInvalidToken)
	}

	return &Claims{
		Subject: claims.Subject,
		Issuer:  claims.Issuer,
		// email/username are not present on default Clerk session tokens.
		// They are populated only if a custom JWT template adds them; the
		// middleware falls back to a sub-derived value otherwise.
		Email:             customString(claims.Custom, "email"),
		Username:          customString(claims.Custom, "username"),
		PreferredUsername: customString(claims.Custom, "preferred_username"),
	}, nil
}

// lookupKey returns the cached JWK for kid, refreshing the cache from Clerk at
// most once per jwksTTL. An unknown kid against a fresh cache is rejected
// without a network call, so tokens with random `kid` values cannot be used to
// amplify requests against Clerk's API.
func (v *Verifier) lookupKey(ctx context.Context, kid string) (*clerk.JSONWebKey, error) {
	if kid == "" {
		return nil, fmt.Errorf("%w: missing kid", ErrInvalidToken)
	}

	v.mu.RLock()
	key, ok := v.keys[kid]
	fresh := time.Since(v.fetchedAt) < jwksTTL
	v.mu.RUnlock()
	if ok {
		return key, nil
	}
	if fresh {
		// Cache is current and the kid isn't in it — treat as an invalid key
		// rather than hammering Clerk for every unknown kid.
		return nil, fmt.Errorf("%w: unknown signing key", ErrInvalidToken)
	}

	if err := v.refreshKeys(ctx); err != nil {
		return nil, err
	}

	v.mu.RLock()
	defer v.mu.RUnlock()
	if key, ok := v.keys[kid]; ok {
		return key, nil
	}
	return nil, fmt.Errorf("%w: unknown signing key", ErrInvalidToken)
}

func (v *Verifier) refreshKeys(ctx context.Context) error {
	set, err := v.jwksClient.Get(ctx, &jwks.GetParams{})
	if err != nil {
		return fmt.Errorf("%w: %v", ErrKeysUnavailable, err)
	}
	if set == nil || len(set.Keys) == 0 {
		return fmt.Errorf("%w: empty key set", ErrKeysUnavailable)
	}

	keys := make(map[string]*clerk.JSONWebKey, len(set.Keys))
	for _, k := range set.Keys {
		if k != nil && k.KeyID != "" {
			keys[k.KeyID] = k
		}
	}

	v.mu.Lock()
	v.keys = keys
	v.fetchedAt = time.Now()
	v.mu.Unlock()
	return nil
}

func extractBearerToken(authz string) (string, error) {
	const prefix = "Bearer "
	if !strings.HasPrefix(authz, prefix) {
		return "", ErrMissingToken
	}
	token := strings.TrimSpace(strings.TrimPrefix(authz, prefix))
	if token == "" {
		return "", ErrMissingToken
	}
	return token, nil
}

// customString reads a string field from the custom-claims map, if present.
func customString(custom any, key string) string {
	m, ok := custom.(*map[string]any)
	if !ok || m == nil {
		return ""
	}
	s, _ := (*m)[key].(string)
	return s
}
