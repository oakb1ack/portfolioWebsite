package httpapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/content"
	"github.com/go-chi/chi/v5"
)

type publicStub struct {
	onListProjects func(Page, PublicFilters)
	onListPosts    func(Page, PublicFilters)
}

func (s publicStub) ListProjects(_ context.Context, page Page, filters PublicFilters) ([]content.Project, int64, error) {
	if s.onListProjects != nil {
		s.onListProjects(page, filters)
	}
	return []content.Project{{Content: content.Content{ID: "1", Title: "Visible", Slug: "visible", BodyMarkdown: "secret", BodyHTML: "<p>safe</p>", Status: content.StatusPublished}}}, 1, nil
}
func (publicStub) GetProject(context.Context, string) (content.Project, error) {
	return content.Project{}, ErrNotFound
}
func (s publicStub) ListPosts(_ context.Context, page Page, filters PublicFilters) ([]content.BlogPost, int64, error) {
	if s.onListPosts != nil {
		s.onListPosts(page, filters)
	}
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

func TestPublicTaxonomyFiltersReachStore(t *testing.T) {
	tests := []struct {
		name string
		path string
		want PublicFilters
	}{
		{
			name: "projects",
			path: "/projects?tag=go,postgres&tag=go&category=backend",
			want: PublicFilters{Tags: []string{"go", "postgres"}, Categories: []string{"backend"}},
		},
		{
			name: "posts",
			path: "/posts?tag=angular&category=frontend,case-study",
			want: PublicFilters{Tags: []string{"angular"}, Categories: []string{"frontend", "case-study"}},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			var got PublicFilters
			stub := publicStub{
				onListProjects: func(_ Page, filters PublicFilters) { got = filters },
				onListPosts:    func(_ Page, filters PublicFilters) { got = filters },
			}
			router := chi.NewRouter()
			RegisterRoutes(router, RouteDependencies{Public: stub})
			response := httptest.NewRecorder()
			router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, test.path, nil))

			if response.Code != http.StatusOK {
				t.Fatalf("status/body = %d/%s", response.Code, response.Body.String())
			}
			if !reflect.DeepEqual(got, test.want) {
				t.Fatalf("filters = %#v, want %#v", got, test.want)
			}
		})
	}
}

func TestPublicTaxonomyFiltersReturnBadRequestBeforeStoreCall(t *testing.T) {
	called := false
	stub := publicStub{
		onListProjects: func(Page, PublicFilters) { called = true },
		onListPosts:    func(Page, PublicFilters) { called = true },
	}
	router := chi.NewRouter()
	RegisterRoutes(router, RouteDependencies{Public: stub})

	for _, path := range []string{"/projects?tag=Bad+Slug", "/posts?category=backend,"} {
		response := httptest.NewRecorder()
		router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, path, nil))
		if response.Code != http.StatusBadRequest || !strings.Contains(response.Body.String(), `"status":400`) {
			t.Fatalf("%s status/body = %d/%s", path, response.Code, response.Body.String())
		}
	}
	if called {
		t.Fatal("store called for invalid taxonomy filter")
	}
}
