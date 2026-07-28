package httpapi

import (
	"context"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/auth"
	"github.com/go-chi/chi/v5"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type authStub struct {
	hash    string
	session auth.Session
}

func (s authStub) FindUser(context.Context, string) (AuthUser, error) {
	return AuthUser{ID: "admin", Username: "admin", PasswordHash: s.hash, Active: true}, nil
}
func (s authStub) CreateSession(context.Context, auth.Session) error { return nil }
func (s authStub) FindByTokenHash(context.Context, [32]byte) (auth.Session, error) {
	return s.session, nil
}
func (s authStub) Touch(context.Context, string, time.Time, time.Time) error { return nil }
func (s authStub) Revoke(context.Context, string, time.Time) error           { return nil }
func TestLoginSetsSecureSessionAndCSRF(t *testing.T) {
	hash, _ := auth.HashPassword("password")
	r := chi.NewRouter()
	cfg := auth.DefaultSessionConfig()
	cfg.Secure = true
	RegisterRoutes(r, RouteDependencies{Auth: authStub{hash: hash}, Session: cfg, Now: time.Now})
	req := httptest.NewRequest(http.MethodPost, "/auth/login", strings.NewReader(`{"username":"admin","password":"password"}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != 200 {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}
	cs := w.Result().Cookies()
	if len(cs) != 2 || !cs[0].Secure || !cs[0].HttpOnly {
		t.Fatalf("cookies=%#v", cs)
	}
}
