package auth

import (
	"net/http"
	"testing"
	"time"
)

func TestDefaultSessionConfigIsValid(t *testing.T) {
	if err := DefaultSessionConfig().Validate(); err != nil {
		t.Fatal(err)
	}
}

func TestSessionConfigRejectsUnsafeCookiePolicy(t *testing.T) {
	c := DefaultSessionConfig()
	c.SameSite = http.SameSiteNoneMode
	c.Secure = false
	if err := c.Validate(); err == nil {
		t.Fatal("expected SameSite=None validation error")
	}
	c = DefaultSessionConfig()
	c.IdleTimeout = 2 * c.Lifetime
	if err := c.Validate(); err == nil {
		t.Fatal("expected timeout validation error")
	}
}

func TestSessionActive(t *testing.T) {
	now := time.Now()
	s := Session{ID: "s", LastSeenAt: now.Add(-time.Minute), ExpiresAt: now.Add(time.Hour)}
	if !s.Active(now, time.Hour) {
		t.Fatal("expected active session")
	}
	if s.Active(now.Add(2*time.Hour), time.Hour) {
		t.Fatal("expired session reported active")
	}
	revoked := now
	s.RevokedAt = &revoked
	if s.Active(now, time.Hour) {
		t.Fatal("revoked session reported active")
	}
}
