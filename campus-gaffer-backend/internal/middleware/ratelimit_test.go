package middleware

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// newTestRouter wires the limiter onto a single route that returns 200 on
// success. keyFn is parameterised so tests can drive distinct buckets.
func newTestRouter(rl *RateLimiter, keyFn func(*gin.Context) string) *gin.Engine {
	r := gin.New()
	r.Use(rl.Middleware(keyFn))
	r.GET("/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})
	return r
}

func doGet(r *gin.Engine, key string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/ping", nil)
	// Stuff the key into a header the test keyFn will read back out.
	req.Header.Set("X-Test-Key", key)
	r.ServeHTTP(w, req)
	return w
}

// Test (a): the 7th request inside a 60-token-per-minute bucket with burst 6
// returns 429 with a Retry-After header and the documented body shape.
func TestRateLimiter_RejectsAfterBurstExhausted(t *testing.T) {
	rl := newRateLimiterWithTTL(rate.Every(time.Minute), 6, time.Minute, time.Hour)
	defer rl.Stop()

	r := newTestRouter(rl, func(c *gin.Context) string {
		return c.GetHeader("X-Test-Key")
	})

	for i := 1; i <= 6; i++ {
		w := doGet(r, "k1")
		if w.Code != http.StatusOK {
			t.Fatalf("request %d: want 200, got %d", i, w.Code)
		}
	}

	w := doGet(r, "k1")
	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("7th request: want 429, got %d (body=%s)", w.Code, w.Body.String())
	}
	if got := w.Header().Get("Retry-After"); got == "" {
		t.Fatalf("Retry-After header missing")
	} else if n, err := strconv.Atoi(got); err != nil || n < 1 {
		t.Fatalf("Retry-After should be a positive int, got %q", got)
	}
	body := w.Body.String()
	if !contains(body, `"error":"rate_limited"`) {
		t.Fatalf("body missing error field: %s", body)
	}
	if !contains(body, `"retry_after_seconds"`) {
		t.Fatalf("body missing retry_after_seconds field: %s", body)
	}
}

// Test (b): two distinct keys hold independent buckets. Exhausting one must
// not affect the other.
func TestRateLimiter_KeysAreIndependent(t *testing.T) {
	rl := newRateLimiterWithTTL(rate.Every(time.Minute), 2, time.Minute, time.Hour)
	defer rl.Stop()

	r := newTestRouter(rl, func(c *gin.Context) string {
		return c.GetHeader("X-Test-Key")
	})

	// Exhaust bucket "a".
	for i := 0; i < 2; i++ {
		if w := doGet(r, "a"); w.Code != http.StatusOK {
			t.Fatalf("a request %d: want 200, got %d", i, w.Code)
		}
	}
	if w := doGet(r, "a"); w.Code != http.StatusTooManyRequests {
		t.Fatalf("a should be exhausted: got %d", w.Code)
	}

	// Bucket "b" must still have a full burst.
	for i := 0; i < 2; i++ {
		if w := doGet(r, "b"); w.Code != http.StatusOK {
			t.Fatalf("b request %d: want 200, got %d", i, w.Code)
		}
	}
}

// Test (c): an idle bucket gets evicted by the reaper after the test-only TTL
// elapses. We don't drive the reaper goroutine here (timing-flaky); we call
// reap() directly with a synthetic "now" to keep the test deterministic.
func TestRateLimiter_ReaperEvictsIdleBuckets(t *testing.T) {
	rl := newRateLimiterWithTTL(rate.Every(time.Minute), 6, 50*time.Millisecond, time.Hour)
	defer rl.Stop()

	r := newTestRouter(rl, func(c *gin.Context) string {
		return c.GetHeader("X-Test-Key")
	})

	if w := doGet(r, "evict-me"); w.Code != http.StatusOK {
		t.Fatalf("seed request: want 200, got %d", w.Code)
	}
	if _, ok := rl.buckets.Load("evict-me"); !ok {
		t.Fatalf("bucket should exist after first request")
	}

	// Advance synthetic time past the TTL and reap.
	rl.reap(time.Now().Add(time.Hour))

	if _, ok := rl.buckets.Load("evict-me"); ok {
		t.Fatalf("bucket should have been evicted by reaper")
	}
}

// Test: OPTIONS preflight is not throttled.
func TestRateLimiter_SkipsOptionsPreflight(t *testing.T) {
	rl := newRateLimiterWithTTL(rate.Every(time.Hour), 1, time.Minute, time.Hour)
	defer rl.Stop()

	r := gin.New()
	r.Use(rl.Middleware(func(c *gin.Context) string { return "anything" }))
	r.OPTIONS("/ping", func(c *gin.Context) { c.Status(http.StatusNoContent) })

	for i := 0; i < 5; i++ {
		w := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodOptions, "/ping", nil)
		r.ServeHTTP(w, req)
		if w.Code != http.StatusNoContent {
			t.Fatalf("OPTIONS %d throttled: %d", i, w.Code)
		}
	}
}

// Test: empty key bypasses the limiter (e.g. unauthenticated request hitting
// a per-user limiter).
func TestRateLimiter_EmptyKeyBypasses(t *testing.T) {
	rl := newRateLimiterWithTTL(rate.Every(time.Hour), 1, time.Minute, time.Hour)
	defer rl.Stop()

	r := newTestRouter(rl, func(c *gin.Context) string { return "" })

	for i := 0; i < 5; i++ {
		if w := doGet(r, ""); w.Code != http.StatusOK {
			t.Fatalf("empty-key request %d throttled: %d", i, w.Code)
		}
	}
}

func contains(haystack, needle string) bool {
	for i := 0; i+len(needle) <= len(haystack); i++ {
		if haystack[i:i+len(needle)] == needle {
			return true
		}
	}
	return false
}
