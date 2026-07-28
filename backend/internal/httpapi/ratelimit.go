package httpapi

import (
	"sync"
	"time"
)

// KeyedLimiter is an in-process token bucket intended for a single API
// instance. It is suitable for the current home-server deployment; move the
// counters to shared storage before running multiple API replicas.
type KeyedLimiter struct {
	mu          sync.Mutex
	capacity    float64
	refillEvery time.Duration
	entries     map[string]bucket
	lastCleanup time.Time
}

type bucket struct {
	tokens   float64
	refilled time.Time
}

func NewKeyedLimiter(capacity int, refillEvery time.Duration) *KeyedLimiter {
	if capacity <= 0 {
		panic("rate-limit capacity must be positive")
	}
	if refillEvery <= 0 {
		panic("rate-limit refill interval must be positive")
	}
	return &KeyedLimiter{
		capacity:    float64(capacity),
		refillEvery: refillEvery,
		entries:     make(map[string]bucket),
	}
}

func (l *KeyedLimiter) Allow(key string, now time.Time) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	if l.lastCleanup.IsZero() {
		l.lastCleanup = now
	}
	if now.Sub(l.lastCleanup) >= 10*l.refillEvery {
		l.cleanup(now)
		l.lastCleanup = now
	}

	entry, exists := l.entries[key]
	if !exists {
		entry = bucket{tokens: l.capacity, refilled: now}
	}
	elapsed := now.Sub(entry.refilled)
	if elapsed > 0 {
		entry.tokens += float64(elapsed) / float64(l.refillEvery)
		if entry.tokens > l.capacity {
			entry.tokens = l.capacity
		}
		entry.refilled = now
	}
	allowed := entry.tokens >= 1
	if allowed {
		entry.tokens--
	}
	l.entries[key] = entry
	return allowed
}

func (l *KeyedLimiter) cleanup(now time.Time) {
	staleAfter := time.Duration(l.capacity+1) * l.refillEvery
	for key, entry := range l.entries {
		if now.Sub(entry.refilled) >= staleAfter {
			delete(l.entries, key)
		}
	}
}
