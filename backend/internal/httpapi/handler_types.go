package httpapi

import (
	"context"
	"errors"
	"io"
	"net/http"
	"time"

	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/auth"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/content"
	"github.com/go-chi/chi/v5"
)

var (
	ErrNotFound = errors.New("not found")
	ErrConflict = errors.New("conflict")
)

type Page struct{ Limit, Offset int }

// PublicFilters uses OR semantics within each field and AND semantics between
// fields. Empty slices disable the corresponding taxonomy filter.
type PublicFilters struct {
	Tags       []string
	Categories []string
}

type PageResult[T any] struct {
	Items  []T   `json:"items"`
	Total  int64 `json:"total"`
	Limit  int   `json:"limit"`
	Offset int   `json:"offset"`
}

// PublicStore is intentionally expressed in domain models, not sqlc rows.
type PublicStore interface {
	ListProjects(context.Context, Page, PublicFilters) ([]content.Project, int64, error)
	GetProject(context.Context, string) (content.Project, error)
	ListPosts(context.Context, Page, PublicFilters) ([]content.BlogPost, int64, error)
	GetPost(context.Context, string) (content.BlogPost, error)
	GetProfile(context.Context) (content.Profile, error)
	ListContactLinks(context.Context) ([]content.ContactLink, error)
}

type ContentAdminStore interface {
	ListAdminProjects(context.Context, Page) ([]content.Project, int64, error)
	GetAdminProject(context.Context, string) (content.Project, error)
	CreateProject(context.Context, string, content.ProjectInput, content.Status) (content.Project, error)
	UpdateProject(context.Context, string, string, content.ProjectInput, content.Status) (content.Project, error)
	DeleteProject(context.Context, string, string) error
	ListAdminPosts(context.Context, Page) ([]content.BlogPost, int64, error)
	GetAdminPost(context.Context, string) (content.BlogPost, error)
	CreatePost(context.Context, string, content.PostInput, content.Status) (content.BlogPost, error)
	UpdatePost(context.Context, string, string, content.PostInput, content.Status) (content.BlogPost, error)
	DeletePost(context.Context, string, string) error
	GetAdminProfile(context.Context) (content.Profile, error)
	UpdateProfile(context.Context, string, content.ProfileInput) (content.Profile, error)
	ListContactLinksAdmin(context.Context) ([]content.ContactLink, error)
	CreateContactLink(context.Context, string, content.ContactLinkInput) (content.ContactLink, error)
	UpdateContactLink(context.Context, string, string, content.ContactLinkInput) (content.ContactLink, error)
	DeleteContactLink(context.Context, string, string) error
	ListTaxonomy(context.Context, string) ([]TaxonomyTerm, error)
	CreateTaxonomy(context.Context, string, TaxonomyInput) (TaxonomyTerm, error)
	UpdateTaxonomy(context.Context, string, string, TaxonomyInput) (TaxonomyTerm, error)
	DeleteTaxonomy(context.Context, string, string) error
}

type TaxonomyTerm struct {
	ID          string    `json:"id"`
	Kind        string    `json:"kind"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
type TaxonomyInput struct {
	Kind              string     `json:"-"`
	Name              string     `json:"name"`
	Slug              string     `json:"slug"`
	Description       string     `json:"description"`
	ExpectedUpdatedAt *time.Time `json:"expected_updated_at"`
}

type AuthUser struct {
	ID, Username, PasswordHash string
	Active                     bool
}
type AuthStore interface {
	FindUser(context.Context, string) (AuthUser, error)
	CreateSession(context.Context, auth.Session) error
	FindByTokenHash(context.Context, [32]byte) (auth.Session, error)
	Touch(context.Context, string, time.Time, time.Time) error
	Revoke(context.Context, string, time.Time) error
}

type MediaStore interface {
	ListAdminMedia(context.Context, Page) ([]content.Media, int64, error)
	CreateMedia(context.Context, string, string, io.Reader, string) (content.Media, error)
	OpenPublicMedia(context.Context, string) (content.Media, io.ReadSeekCloser, error)
	DeleteMedia(context.Context, string) error
}

type RouteDependencies struct {
	Public            PublicStore
	Admin             ContentAdminStore
	Auth              AuthStore
	Media             MediaStore
	Limiter           *KeyedLimiter
	Session           auth.SessionConfig
	CSRFCookieName    string
	MaxJSONBytes      int64
	MaxUploadBytes    int64
	Now               func() time.Time
	DummyPasswordHash string
}

func RegisterRoutes(r chi.Router, deps RouteDependencies) {
	if deps.Now == nil {
		deps.Now = time.Now
	}
	if deps.MaxJSONBytes <= 0 {
		deps.MaxJSONBytes = 1 << 20
	}
	if deps.MaxUploadBytes <= 0 {
		deps.MaxUploadBytes = 20 << 20
	}
	if deps.CSRFCookieName == "" {
		deps.CSRFCookieName = "__Host-portfolio_csrf"
	}
	if deps.DummyPasswordHash == "" {
		// Use the same Argon2id cost as a real password so unknown and disabled
		// users follow the same expensive verification path.
		deps.DummyPasswordHash, _ = auth.HashPassword("portfolio-dummy-password")
	}
	registerPublicRoutes(r, deps)
	registerAuthRoutes(r, deps)
	registerAdminRoutes(r, deps)
}

type contextKey string

const sessionContextKey contextKey = "portfolio.session"

func sessionFromContext(ctx context.Context) (auth.Session, bool) {
	s, ok := ctx.Value(sessionContextKey).(auth.Session)
	return s, ok
}

func requireSession(deps RouteDependencies, next http.Handler) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie(deps.Session.CookieName)
		if err != nil || c.Value == "" || deps.Auth == nil {
			writeProblem(w, r, http.StatusUnauthorized, "Unauthorized", "Authentication is required.")
			return
		}
		s, err := deps.Auth.FindByTokenHash(r.Context(), auth.HashToken(c.Value))
		if err != nil || !s.Active(deps.Now(), deps.Session.IdleTimeout) {
			writeProblem(w, r, http.StatusUnauthorized, "Unauthorized", "Authentication is required.")
			return
		}
		now := deps.Now()
		idleExpiresAt := now.Add(deps.Session.IdleTimeout)
		if idleExpiresAt.After(s.ExpiresAt) {
			idleExpiresAt = s.ExpiresAt
		}
		if err := deps.Auth.Touch(r.Context(), s.ID, now, idleExpiresAt); err != nil {
			writeProblem(w, r, http.StatusUnauthorized, "Unauthorized", "Authentication is required.")
			return
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), sessionContextKey, s)))
	})
}

func requireCSRF(deps RouteDependencies, next http.Handler) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		s, ok := sessionFromContext(r.Context())
		if !ok || !auth.CSRFTokenMatches(r.Header.Get("X-CSRF-Token"), s.CSRFTokenHash) {
			writeProblem(w, r, http.StatusForbidden, "Forbidden", "A valid CSRF token is required.")
			return
		}
		next.ServeHTTP(w, r)
	})
}
