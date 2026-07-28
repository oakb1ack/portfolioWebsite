package auth

import (
	"errors"
	"net/http"
	"strings"
	"time"
)

type SessionConfig struct {
	CookieName     string
	CookiePath     string
	CookieDomain   string
	Secure         bool
	HTTPOnly       bool
	SameSite       http.SameSite
	Lifetime       time.Duration
	IdleTimeout    time.Duration
	TokenBytes     int
	CSRFTokenBytes int
}

func DefaultSessionConfig() SessionConfig {
	return SessionConfig{CookieName: "portfolio_session", CookiePath: "/", Secure: true, HTTPOnly: true, SameSite: http.SameSiteLaxMode, Lifetime: 8 * time.Hour, IdleTimeout: 2 * time.Hour, TokenBytes: DefaultTokenBytes, CSRFTokenBytes: DefaultTokenBytes}
}

func (c SessionConfig) Validate() error {
	if c.CookieName == "" || strings.ContainsAny(c.CookieName, " \t\r\n") {
		return errors.New("invalid session cookie name")
	}
	if c.CookiePath == "" || !strings.HasPrefix(c.CookiePath, "/") {
		return errors.New("session cookie path must start with /")
	}
	if c.Lifetime <= 0 || c.Lifetime > 30*24*time.Hour {
		return errors.New("session lifetime must be between 1 and 30 days")
	}
	if c.IdleTimeout <= 0 || c.IdleTimeout > c.Lifetime {
		return errors.New("idle timeout must be positive and no longer than lifetime")
	}
	if c.TokenBytes < 32 || c.CSRFTokenBytes < 32 {
		return errors.New("session and CSRF tokens must be at least 32 bytes")
	}
	if c.SameSite == http.SameSiteNoneMode && !c.Secure {
		return errors.New("SameSite=None requires Secure")
	}
	return nil
}

// Cookie policy guidance: production sessions must use Secure, HttpOnly, and
// SameSite=Lax (or Strict where compatible). Never put the opaque token in a
// URL or localStorage. MaxAge/Expires should be set from Lifetime by handlers.
