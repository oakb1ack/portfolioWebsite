package httpapi

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/content"
	"github.com/go-chi/chi/v5"
)

func registerPublicRoutes(r chi.Router, d RouteDependencies) {
	r.Group(func(public chi.Router) {
		public.Use(cachePublic(time.Minute))
		public.Get("/projects", publicProjects(d))
		public.Get("/projects/{slug}", publicProject(d))
		public.Get("/posts", publicPosts(d))
		public.Get("/posts/{slug}", publicPost(d))
		public.Get("/profile", publicProfile(d))
		public.Get("/contact-links", publicLinks(d))
		public.Get("/media/{id}", publicMedia(d))
	})
}
func page(r *http.Request) Page {
	l, o := 20, 0
	if n, e := strconv.Atoi(r.URL.Query().Get("limit")); e == nil && n > 0 {
		l = n
	}
	if l > 100 {
		l = 100
	}
	if n, e := strconv.Atoi(r.URL.Query().Get("offset")); e == nil && n >= 0 {
		o = n
	}
	return Page{l, o}
}

const maxTaxonomyFilterValues = 20

func publicFilters(r *http.Request) (PublicFilters, error) {
	tags, err := taxonomyFilterValues(r, "tag")
	if err != nil {
		return PublicFilters{}, err
	}
	categories, err := taxonomyFilterValues(r, "category")
	if err != nil {
		return PublicFilters{}, err
	}
	return PublicFilters{Tags: tags, Categories: categories}, nil
}

func taxonomyFilterValues(r *http.Request, key string) ([]string, error) {
	rawValues, present := r.URL.Query()[key]
	if !present {
		return []string{}, nil
	}

	values := make([]string, 0, len(rawValues))
	seen := make(map[string]struct{})
	valueCount := 0
	for _, raw := range rawValues {
		for _, part := range strings.Split(raw, ",") {
			valueCount++
			if valueCount > maxTaxonomyFilterValues {
				return nil, fmt.Errorf("%s accepts at most %d values", key, maxTaxonomyFilterValues)
			}
			slug := strings.TrimSpace(part)
			if err := content.ValidateSlug(slug); err != nil {
				return nil, fmt.Errorf("%s must contain valid taxonomy slugs", key)
			}
			if _, exists := seen[slug]; exists {
				continue
			}
			seen[slug] = struct{}{}
			values = append(values, slug)
		}
	}
	return values, nil
}

func publicProjects(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if d.Public == nil {
			unavailable(w, r)
			return
		}
		filters, err := publicFilters(r)
		if err != nil {
			invalidPublicFilters(w, r, err)
			return
		}
		pagination := page(r)
		x, n, e := d.Public.ListProjects(r.Context(), pagination, filters)
		if e != nil {
			server(w, r)
			return
		}
		out := make([]content.ProjectDTO, 0, len(x))
		for _, v := range x {
			out = append(out, projectPublic(v))
		}
		writeJSON(w, http.StatusOK, PageResult[content.ProjectDTO]{out, n, pagination.Limit, pagination.Offset})
	}
}
func publicProject(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if d.Public == nil {
			unavailable(w, r)
			return
		}
		v, e := d.Public.GetProject(r.Context(), chi.URLParam(r, "slug"))
		if errors.Is(e, ErrNotFound) {
			notFound(w, r)
			return
		}
		if e != nil {
			server(w, r)
			return
		}
		writeJSON(w, http.StatusOK, projectPublic(v))
	}
}
func publicPosts(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if d.Public == nil {
			unavailable(w, r)
			return
		}
		filters, err := publicFilters(r)
		if err != nil {
			invalidPublicFilters(w, r, err)
			return
		}
		pagination := page(r)
		x, n, e := d.Public.ListPosts(r.Context(), pagination, filters)
		if e != nil {
			server(w, r)
			return
		}
		out := make([]content.BlogPostDTO, 0, len(x))
		for _, v := range x {
			out = append(out, postPublic(v))
		}
		writeJSON(w, http.StatusOK, PageResult[content.BlogPostDTO]{out, n, pagination.Limit, pagination.Offset})
	}
}
func publicPost(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if d.Public == nil {
			unavailable(w, r)
			return
		}
		v, e := d.Public.GetPost(r.Context(), chi.URLParam(r, "slug"))
		if errors.Is(e, ErrNotFound) {
			notFound(w, r)
			return
		}
		if e != nil {
			server(w, r)
			return
		}
		writeJSON(w, http.StatusOK, postPublic(v))
	}
}
func publicProfile(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if d.Public == nil {
			unavailable(w, r)
			return
		}
		v, e := d.Public.GetProfile(r.Context())
		if errors.Is(e, ErrNotFound) {
			notFound(w, r)
			return
		}
		if e != nil {
			server(w, r)
			return
		}
		writeJSON(w, http.StatusOK, content.ProfileDTO{
			ID: v.ID, Name: v.Name, Headline: v.Headline, Education: v.Education,
			CurrentRole: v.CurrentRole, Statement: v.Statement, BioHTML: v.BioHTML,
			ResumeMediaID: v.ResumeMediaID,
		})
	}
}
func publicLinks(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if d.Public == nil {
			unavailable(w, r)
			return
		}
		x, e := d.Public.ListContactLinks(r.Context())
		if e != nil {
			server(w, r)
			return
		}
		out := make([]content.ContactLinkDTO, 0, len(x))
		for _, v := range x {
			out = append(out, content.ContactLinkDTO{
				ID: v.ID, Label: v.Label, Kind: v.Kind, URL: v.URL,
				IconKey: v.IconKey, SortOrder: v.SortOrder,
			})
		}
		writeJSON(w, 200, out)
	}
}
func projectPublic(v content.Project) content.ProjectDTO {
	return content.ProjectDTO{
		ID: v.ID, Title: v.Title, Slug: v.Slug, Summary: v.Summary,
		BodyHTML: v.BodyHTML, PublishedAt: v.PublishedAt,
		FeaturedMediaID: v.FeaturedMediaID, Featured: v.Featured,
		Tags: v.Tags, Categories: v.Categories, Outcome: v.Outcome, Role: v.Role,
		Technologies: v.Technologies, Stage: v.Stage, Availability: v.Availability,
		Links: v.Links, SortOrder: v.SortOrder,
	}
}
func postPublic(v content.BlogPost) content.BlogPostDTO {
	return content.BlogPostDTO{
		ID: v.ID, Title: v.Title, Slug: v.Slug, Summary: v.Summary,
		BodyHTML: v.BodyHTML, PublishedAt: v.PublishedAt,
		FeaturedMediaID: v.FeaturedMediaID, Featured: v.Featured,
		Tags: v.Tags, Categories: v.Categories,
		ReadingTimeMinutes: v.ReadingTimeMinutes,
	}
}
func unavailable(w http.ResponseWriter, r *http.Request) {
	writeProblem(w, r, 503, "Service Unavailable", "The content service is unavailable.")
}
func server(w http.ResponseWriter, r *http.Request) {
	writeProblem(w, r, 500, "Internal Server Error", "The server could not complete the request.")
}
func notFound(w http.ResponseWriter, r *http.Request) {
	writeProblem(w, r, 404, "Not Found", "The requested resource does not exist.")
}
func invalidPublicFilters(w http.ResponseWriter, r *http.Request, err error) {
	writeProblem(w, r, http.StatusBadRequest, "Bad Request", err.Error()+".")
}
func parseStatus(raw string) content.Status {
	s := content.Status(strings.TrimSpace(raw))
	if s == "" {
		return content.StatusDraft
	}
	return s
}
