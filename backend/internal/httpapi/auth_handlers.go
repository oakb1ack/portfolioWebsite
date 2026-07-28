package httpapi

import (
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/auth"
	"github.com/go-chi/chi/v5"
)

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func registerAuthRoutes(r chi.Router, d RouteDependencies) {
	r.Route("/auth", func(authRoutes chi.Router) {
		authRoutes.Use(noStore)
		authRoutes.Use(requireJSON)
		authRoutes.Post("/login", login(d))
		authRoutes.Post("/logout", requireSession(d, requireCSRF(d, logout(d))))
		authRoutes.Get("/session", sessionInfo(d))
		authRoutes.Get("/csrf", requireSession(d, csrf(d)))
	})
}
func login(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if d.Auth == nil {
			unavailable(w, r)
			return
		}
		if d.Limiter != nil && !d.Limiter.Allow(clientIP(r.RemoteAddr), d.Now()) {
			writeProblem(w, r, 429, "Too Many Requests", "Too many login attempts.")
			return
		}
		var in loginRequest
		if err := decodeJSON(w, r, &in, d.MaxJSONBytes); err != nil {
			writeProblem(w, r, 400, "Bad Request", "The request body is invalid.")
			return
		}
		in.Username = strings.TrimSpace(in.Username)
		if in.Username == "" || len(in.Username) > 254 || in.Password == "" || len(in.Password) > 1024 {
			writeProblem(w, r, http.StatusUnauthorized, "Unauthorized", "Invalid credentials.")
			return
		}
		u, findErr := d.Auth.FindUser(r.Context(), in.Username)
		passwordHash := d.DummyPasswordHash
		if findErr == nil && u.Active {
			passwordHash = u.PasswordHash
		}
		passwordErr := auth.VerifyPassword(in.Password, passwordHash)
		if findErr != nil || !u.Active || passwordErr != nil {
			writeProblem(w, r, 401, "Unauthorized", "Invalid credentials.")
			return
		}
		tok, e := auth.GenerateOpaqueToken(d.Session.TokenBytes)
		if e != nil {
			server(w, r)
			return
		}
		csrfTok, e := auth.GenerateOpaqueToken(d.Session.CSRFTokenBytes)
		if e != nil {
			server(w, r)
			return
		}
		now := d.Now()
		expiresAt := now.Add(d.Session.Lifetime)
		idleExpiresAt := now.Add(d.Session.IdleTimeout)
		if idleExpiresAt.After(expiresAt) {
			idleExpiresAt = expiresAt
		}
		s := auth.Session{
			AdminID: u.ID, TokenHash: auth.HashToken(tok), CSRFTokenHash: auth.HashToken(csrfTok),
			CreatedAt: now, LastSeenAt: now, ExpiresAt: expiresAt, IdleExpiresAt: idleExpiresAt,
		}
		if e = d.Auth.CreateSession(r.Context(), s); e != nil {
			server(w, r)
			return
		}
		setCookie(w, d.Session.CookieName, tok, d.Session, true, now)
		setCookie(w, d.CSRFCookieName, csrfTok, d.Session, false, now)
		writeJSON(w, 200, map[string]any{"authenticated": true, "expires_at": s.ExpiresAt})
	}
}
func logout(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c, e := r.Cookie(d.Session.CookieName)
		if e == nil && d.Auth != nil {
			if s, e := d.Auth.FindByTokenHash(r.Context(), auth.HashToken(c.Value)); e == nil {
				_ = d.Auth.Revoke(r.Context(), s.ID, d.Now())
			}
		}
		clearCookie(w, d.Session.CookieName, d.Session)
		clearCookie(w, d.CSRFCookieName, d.Session)
		writeJSON(w, 204, nil)
	}
}
func sessionInfo(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c, e := r.Cookie(d.Session.CookieName)
		if e != nil || d.Auth == nil {
			writeJSON(w, 200, map[string]any{"authenticated": false})
			return
		}
		s, e := d.Auth.FindByTokenHash(r.Context(), auth.HashToken(c.Value))
		writeJSON(w, 200, map[string]any{"authenticated": e == nil && s.Active(d.Now(), d.Session.IdleTimeout), "expires_at": s.ExpiresAt})
	}
}
func csrf(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c, e := r.Cookie(d.CSRFCookieName)
		if e != nil || c.Value == "" {
			writeProblem(w, r, 401, "Unauthorized", "Authentication is required.")
			return
		}
		writeJSON(w, 200, map[string]string{"csrf_token": c.Value})
	}
}
func setCookie(w http.ResponseWriter, name, value string, c auth.SessionConfig, httpOnly bool, now time.Time) {
	http.SetCookie(w, &http.Cookie{Name: name, Value: value, Path: c.CookiePath, Domain: c.CookieDomain, Secure: c.Secure, HttpOnly: httpOnly, SameSite: c.SameSite, MaxAge: int(c.Lifetime / time.Second), Expires: now.Add(c.Lifetime)})
}
func clearCookie(w http.ResponseWriter, name string, c auth.SessionConfig) {
	http.SetCookie(w, &http.Cookie{Name: name, Value: "", Path: c.CookiePath, Domain: c.CookieDomain, Secure: c.Secure, HttpOnly: true, SameSite: c.SameSite, MaxAge: -1, Expires: time.Unix(1, 0)})
}

func clientIP(remoteAddress string) string {
	host, _, err := net.SplitHostPort(remoteAddress)
	if err == nil {
		return host
	}
	return remoteAddress
}
