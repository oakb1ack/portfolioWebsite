package httpapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/content"
	"github.com/go-chi/chi/v5"
)

type publicStub struct{}

func (publicStub) ListProjects(context.Context, Page) ([]content.Project, int64, error) {
	return []content.Project{{Content: content.Content{ID: "1", Title: "Visible", Slug: "visible", BodyMarkdown: "secret", BodyHTML: "<p>safe</p>", Status: content.StatusPublished}}}, 1, nil
}
func (publicStub) GetProject(context.Context, string) (content.Project, error) {
	return content.Project{}, ErrNotFound
}
func (publicStub) ListPosts(context.Context, Page) ([]content.BlogPost, int64, error) {
	return nil, 0, nil
}
func (publicStub) GetPost(context.Context, string) (content.BlogPost, error) {
	return content.BlogPost{}, ErrNotFound
}
func (publicStub) GetProfile(context.Context) (content.Profile, error) {
	return content.Profile{}, ErrNotFound
}
func (publicStub) ListContactLinks(context.Context) ([]content.ContactLink, error) { return nil, nil }

func TestPublicProjectsDoNotExposeMarkdown(t *testing.T) {
	r := chi.NewRouter()
	RegisterRoutes(r, RouteDependencies{Public: publicStub{}})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/projects", nil))
	if w.Code != http.StatusOK || strings.Contains(w.Body.String(), "secret") {
		t.Fatalf("status/body = %d/%s", w.Code, w.Body.String())
	}
}
func TestPublicPaginationBounds(t *testing.T) {
	r := chi.NewRouter()
	RegisterRoutes(r, RouteDependencies{Public: publicStub{}})
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/projects?limit=999&offset=-1", nil))
	if !strings.Contains(w.Body.String(), `"limit":100`) {
		t.Fatalf("body=%s", w.Body.String())
	}
}

func TestPublicFiltersParseRepeatedAndCommaSeparatedValues(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/projects?tag=go,postgres&tag=go&category=backend", nil)

	filters, err := publicFilters(request)
	if err != nil {
		t.Fatal(err)
	}
	if got := strings.Join(filters.Tags, ","); got != "go,postgres" {
		t.Fatalf("tags = %q", got)
	}
	if got := strings.Join(filters.Categories, ","); got != "backend" {
		t.Fatalf("categories = %q", got)
	}
}

func TestPublicFiltersRejectInvalidAndExcessValues(t *testing.T) {
	t.Run("invalid slug", func(t *testing.T) {
		request := httptest.NewRequest(http.MethodGet, "/projects?tag=Bad+Slug", nil)
		if _, err := publicFilters(request); err == nil {
			t.Fatal("invalid taxonomy slug accepted")
		}
	})

	t.Run("too many values", func(t *testing.T) {
		request := httptest.NewRequest(http.MethodGet, "/projects?tag="+strings.Repeat("a,", maxTaxonomyFilterValues)+"z", nil)
		if _, err := publicFilters(request); err == nil {
			t.Fatal("excess taxonomy values accepted")
		}
	})
}
