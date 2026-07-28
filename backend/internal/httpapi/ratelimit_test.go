package httpapi

import (
	"testing"
	"time"
)

func TestKeyedLimiter(t *testing.T) {
	limiter := NewKeyedLimiter(2, time.Minute)
	now := time.Date(2026, 7, 27, 0, 0, 0, 0, time.UTC)

	if !limiter.Allow("client-a", now) || !limiter.Allow("client-a", now) {
		t.Fatal("initial capacity should be available")
	}
	if limiter.Allow("client-a", now) {
		t.Fatal("third immediate attempt should be denied")
	}
	if !limiter.Allow("client-b", now) {
		t.Fatal("different clients should have independent buckets")
	}
	if !limiter.Allow("client-a", now.Add(time.Minute)) {
		t.Fatal("one token should refill after the configured interval")
	}
}
