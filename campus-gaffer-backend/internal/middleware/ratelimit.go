package middleware

import (
	"math"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// Default idle window after which a bucket is evicted by the reaper.
const (
	defaultIdleTTL      = 10 * time.Minute
	defaultReapInterval = 5 * time.Minute
)

// RateLimiter holds a per-key token-bucket limiter. Buckets are created on
// first use and garbage-collected by a background reaper after they go idle.
//
// Use one RateLimiter instance per (limit, burst) pair — e.g. a global per-IP
// limiter and a per-user limiter on write paths are two separate instances.
type RateLimiter struct {
	limit  rate.Limit
	burst  int
	idleTTL time.Duration

	buckets sync.Map // key string -> *bucket

	stopOnce sync.Once
	stopCh   chan struct{}
}

type bucket struct {
	limiter  *rate.Limiter
	lastSeen atomic[time.Time]
}

// atomic is a tiny generic wrapper so we can atomically swap lastSeen without
// taking a mutex on the hot path. sync.Map handles the key-level concurrency.
type atomic[T any] struct {
	mu sync.Mutex
	v  T
}

func (a *atomic[T]) load() T {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.v
}

func (a *atomic[T]) store(v T) {
	a.mu.Lock()
	a.v = v
	a.mu.Unlock()
}

// NewRateLimiter constructs a limiter with the given refill rate and burst.
// The reaper runs every 5 minutes and drops buckets idle for >10 minutes.
// Call Stop() to shut down the reaper (mostly for tests).
func NewRateLimiter(r rate.Limit, burst int) *RateLimiter {
	return newRateLimiterWithTTL(r, burst, defaultIdleTTL, defaultReapInterval)
}

// newRateLimiterWithTTL is the test seam — production callers should use
// NewRateLimiter. It lets tests use a tight idle window without sleeping
// for ten minutes.
func newRateLimiterWithTTL(r rate.Limit, burst int, idleTTL, reapInterval time.Duration) *RateLimiter {
	rl := &RateLimiter{
		limit:   r,
		burst:   burst,
		idleTTL: idleTTL,
		stopCh:  make(chan struct{}),
	}
	go rl.reapLoop(reapInterval)
	return rl
}

// Stop terminates the reaper goroutine. Safe to call multiple times.
func (rl *RateLimiter) Stop() {
	rl.stopOnce.Do(func() { close(rl.stopCh) })
}

func (rl *RateLimiter) reapLoop(interval time.Duration) {
	t := time.NewTicker(interval)
	defer t.Stop()
	for {
		select {
		case <-rl.stopCh:
			return
		case now := <-t.C:
			rl.reap(now)
		}
	}
}

func (rl *RateLimiter) reap(now time.Time) {
	rl.buckets.Range(func(k, v any) bool {
		b := v.(*bucket)
		if now.Sub(b.lastSeen.load()) > rl.idleTTL {
			rl.buckets.Delete(k)
		}
		return true
	})
}

func (rl *RateLimiter) getBucket(key string) *bucket {
	if v, ok := rl.buckets.Load(key); ok {
		b := v.(*bucket)
		b.lastSeen.store(time.Now())
		return b
	}
	b := &bucket{limiter: rate.NewLimiter(rl.limit, rl.burst)}
	b.lastSeen.store(time.Now())
	actual, _ := rl.buckets.LoadOrStore(key, b)
	stored := actual.(*bucket)
	stored.lastSeen.store(time.Now())
	return stored
}

// Middleware returns a gin handler that consumes one token from the bucket
// identified by keyFn(c). If keyFn returns "" the request is passed through
// unthrottled — use this to skip rate-limiting when the key isn't available
// (e.g. unauthenticated request hitting a per-user limiter).
//
// CORS preflight (OPTIONS) is never throttled; preflights are not a real
// request and consuming tokens for them would punish legitimate browsers.
func (rl *RateLimiter) Middleware(keyFn func(*gin.Context) string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}
		key := keyFn(c)
		if key == "" {
			c.Next()
			return
		}
		b := rl.getBucket(key)
		reservation := b.limiter.Reserve()
		if !reservation.OK() {
			// burst == 0 (misconfiguration); fail closed.
			rl.respond429(c, 1)
			return
		}
		delay := reservation.Delay()
		if delay > 0 {
			// Token not available now. Cancel the reservation (we don't want to
			// hold the slot) and reject the request.
			reservation.Cancel()
			retry := int(math.Ceil(delay.Seconds()))
			if retry < 1 {
				retry = 1
			}
			rl.respond429(c, retry)
			return
		}
		c.Next()
	}
}

func (rl *RateLimiter) respond429(c *gin.Context, retryAfter int) {
	c.Header("Retry-After", itoa(retryAfter))
	c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
		"error":               "rate_limited",
		"retry_after_seconds": retryAfter,
	})
}

// itoa is a tiny allocation-free int->string for small positive ints.
func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var buf [20]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	return string(buf[i:])
}

// ByClientIP keys rate-limit buckets on the client IP as resolved by gin
// (respects trusted proxies / X-Forwarded-For when configured).
func ByClientIP(c *gin.Context) string {
	return c.ClientIP()
}

// ByUserSub keys rate-limit buckets on the authenticated Clerk subject.
// Returns "" when no authenticated user is present so the middleware can
// pass the request through (the auth middleware itself handles the 401).
func ByUserSub(c *gin.Context) string {
	sub, ok := AuthenticatedUserID(c.Request.Context())
	if !ok || sub == "" {
		return ""
	}
	return "user:" + sub
}
