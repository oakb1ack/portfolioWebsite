package config

import (
	"strings"
	"testing"
)

func TestLoadRequiresDatabaseURL(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("PUBLIC_BASE_URL", "http://localhost:4200")

	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "DATABASE_URL") {
		t.Fatalf("Load() error = %v, want DATABASE_URL error", err)
	}
}

func TestProductionRequiresHTTPSAndHostCookies(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://portfolio:secret@localhost/portfolio")
	t.Setenv("PUBLIC_BASE_URL", "http://portfolio.example")
	t.Setenv("APP_ENV", "production")
	t.Setenv("SESSION_COOKIE_NAME", "session")

	_, err := Load()
	if err == nil {
		t.Fatal("Load() error = nil, want production validation errors")
	}
	if !strings.Contains(err.Error(), "https") {
		t.Errorf("Load() error = %v, want https error", err)
	}
	if !strings.Contains(err.Error(), "__Host-") {
		t.Errorf("Load() error = %v, want cookie prefix error", err)
	}
}

func TestLoadRejectsMalformedOperationalValues(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://portfolio:secret@localhost/portfolio")
	t.Setenv("PUBLIC_BASE_URL", "http://localhost:4200")
	t.Setenv("HTTP_READ_TIMEOUT", "eventually")
	t.Setenv("MAX_UPLOAD_BYTES", "-1")
	t.Setenv("LOG_LEVEL", "verbose-ish")

	_, err := Load()
	if err == nil {
		t.Fatal("Load() error = nil, want malformed configuration errors")
	}
	for _, expected := range []string{"HTTP_READ_TIMEOUT", "MAX_UPLOAD_BYTES", "LOG_LEVEL"} {
		if !strings.Contains(err.Error(), expected) {
			t.Errorf("Load() error = %v, want %s", err, expected)
		}
	}
}
