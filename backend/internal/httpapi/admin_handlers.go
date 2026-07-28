package httpapi

import (
	"errors"
	"net/http"

	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/content"
	"github.com/go-chi/chi/v5"
)

func registerAdminRoutes(r chi.Router, d RouteDependencies) {
	r.Route("/admin", func(a chi.Router) {
		a.Use(noStore)
		a.Use(func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if d.Admin == nil {
					unavailable(w, r)
					return
				}
				next.ServeHTTP(w, r)
			})
		})
		a.Use(func(next http.Handler) http.Handler { return requireSession(d, next) })
		a.Get("/projects", adminProjects(d))
		a.Get("/projects/{id}", getProject(d))
		a.Get("/posts", adminPosts(d))
		a.Get("/posts/{id}", getPost(d))
		a.Get("/contact-links", adminLinks(d))
		a.Get("/profile", adminProfile(d))
		a.Get("/taxonomy/{kind}", taxonomy(d))
		a.Get("/media", adminMedia(d))
		a.With(func(next http.Handler) http.Handler { return requireCSRF(d, next) }).
			Post("/media", uploadMedia(d))
		a.Group(func(write chi.Router) {
			write.Use(func(next http.Handler) http.Handler { return requireCSRF(d, next) })
			write.Use(requireJSON)
			write.Post("/projects", createProject(d))
			write.Put("/projects/{id}", updateProject(d))
			write.Delete("/projects/{id}", deleteProject(d))
			write.Post("/posts", createPost(d))
			write.Put("/posts/{id}", updatePost(d))
			write.Delete("/posts/{id}", deletePost(d))
			write.Put("/profile", updateProfile(d))
			write.Post("/contact-links", createLink(d))
			write.Put("/contact-links/{id}", updateLink(d))
			write.Delete("/contact-links/{id}", deleteLink(d))
			write.Post("/taxonomy/{kind}", createTaxonomy(d))
			write.Put("/taxonomy/{kind}/{id}", updateTaxonomy(d))
			write.Delete("/taxonomy/{kind}/{id}", deleteTaxonomy(d))
			write.Delete("/media/{id}", deleteMedia(d))
		})
	})
}

type projectRequest struct {
	content.ProjectInput
	Status content.Status `json:"status"`
}

func adminProjects(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		x, n, e := d.Admin.ListAdminProjects(r.Context(), page(r))
		if e != nil {
			server(w, r)
			return
		}
		out := make([]content.AdminProjectDTO, 0, len(x))
		for _, v := range x {
			out = append(out, adminProject(v))
		}
		writeJSON(w, 200, PageResult[content.AdminProjectDTO]{out, n, page(r).Limit, page(r).Offset})
	}
}
func getProject(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		v, e := d.Admin.GetAdminProject(r.Context(), chi.URLParam(r, "id"))
		if errors.Is(e, ErrNotFound) {
			notFound(w, r)
			return
		}
		if e != nil {
			server(w, r)
			return
		}
		writeJSON(w, 200, adminProject(v))
	}
}
func createProject(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var in projectRequest
		if !decodeOK(w, r, &in, d) {
			return
		}
		if e := in.ProjectInput.Validate(); e != nil {
			writeProblem(w, r, 422, "Validation Failed", e.Error())
			return
		}
		if !validRequestedStatus(in.Status) {
			writeProblem(w, r, http.StatusUnprocessableEntity, "Validation Failed", "Invalid content status.")
			return
		}
		s, ok := sessionFromContext(r.Context())
		if !ok {
			writeProblem(w, r, 401, "Unauthorized", "Authentication is required.")
			return
		}
		v, e := d.Admin.CreateProject(r.Context(), s.AdminID, in.ProjectInput, parseStatus(string(in.Status)))
		if e != nil {
			writeStoreError(w, r, e)
			return
		}
		writeJSON(w, 201, adminProject(v))
	}
}
func updateProject(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var in projectRequest
		if !decodeOK(w, r, &in, d) {
			return
		}
		if e := in.ProjectInput.Validate(); e != nil {
			writeProblem(w, r, http.StatusUnprocessableEntity, "Validation Failed", e.Error())
			return
		}
		if in.ExpectedUpdatedAt == nil || in.Status == "" || !validRequestedStatus(in.Status) {
			writeProblem(w, r, http.StatusUnprocessableEntity, "Validation Failed", "expected_updated_at and a valid status are required.")
			return
		}
		s, _ := sessionFromContext(r.Context())
		v, e := d.Admin.UpdateProject(r.Context(), chi.URLParam(r, "id"), s.AdminID, in.ProjectInput, parseStatus(string(in.Status)))
		if e != nil {
			writeStoreError(w, r, e)
			return
		}
		writeJSON(w, 200, adminProject(v))
	}
}
func deleteProject(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		s, _ := sessionFromContext(r.Context())
		e := d.Admin.DeleteProject(r.Context(), chi.URLParam(r, "id"), s.AdminID)
		if e != nil {
			writeStoreError(w, r, e)
			return
		}
		writeJSON(w, 204, nil)
	}
}

type postRequest struct {
	content.PostInput
	Status content.Status `json:"status"`
}

func adminPosts(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		x, n, e := d.Admin.ListAdminPosts(r.Context(), page(r))
		if e != nil {
			server(w, r)
			return
		}
		o := make([]content.AdminBlogPostDTO, 0, len(x))
		for _, v := range x {
			o = append(o, adminPost(v))
		}
		writeJSON(w, 200, PageResult[content.AdminBlogPostDTO]{o, n, page(r).Limit, page(r).Offset})
	}
}
func getPost(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		v, e := d.Admin.GetAdminPost(r.Context(), chi.URLParam(r, "id"))
		if errors.Is(e, ErrNotFound) {
			notFound(w, r)
			return
		}
		if e != nil {
			server(w, r)
			return
		}
		writeJSON(w, 200, adminPost(v))
	}
}
func createPost(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var in postRequest
		if !decodeOK(w, r, &in, d) {
			return
		}
		if e := in.PostInput.Validate(); e != nil {
			writeProblem(w, r, 422, "Validation Failed", e.Error())
			return
		}
		if !validRequestedStatus(in.Status) {
			writeProblem(w, r, http.StatusUnprocessableEntity, "Validation Failed", "Invalid content status.")
			return
		}
		s, _ := sessionFromContext(r.Context())
		v, e := d.Admin.CreatePost(r.Context(), s.AdminID, in.PostInput, parseStatus(string(in.Status)))
		if e != nil {
			writeStoreError(w, r, e)
			return
		}
		writeJSON(w, 201, adminPost(v))
	}
}
func updatePost(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var in postRequest
		if !decodeOK(w, r, &in, d) {
			return
		}
		if e := in.PostInput.Validate(); e != nil {
			writeProblem(w, r, http.StatusUnprocessableEntity, "Validation Failed", e.Error())
			return
		}
		if in.ExpectedUpdatedAt == nil || in.Status == "" || !validRequestedStatus(in.Status) {
			writeProblem(w, r, http.StatusUnprocessableEntity, "Validation Failed", "expected_updated_at and a valid status are required.")
			return
		}
		s, _ := sessionFromContext(r.Context())
		v, e := d.Admin.UpdatePost(r.Context(), chi.URLParam(r, "id"), s.AdminID, in.PostInput, parseStatus(string(in.Status)))
		if e != nil {
			writeStoreError(w, r, e)
			return
		}
		writeJSON(w, 200, adminPost(v))
	}
}
func deletePost(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		s, _ := sessionFromContext(r.Context())
		e := d.Admin.DeletePost(r.Context(), chi.URLParam(r, "id"), s.AdminID)
		if e != nil {
			writeStoreError(w, r, e)
			return
		}
		writeJSON(w, 204, nil)
	}
}
func updateProfile(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var in content.ProfileInput
		if !decodeOK(w, r, &in, d) {
			return
		}
		if e := in.Validate(); e != nil {
			writeProblem(w, r, 422, "Validation Failed", e.Error())
			return
		}
		s, _ := sessionFromContext(r.Context())
		v, e := d.Admin.UpdateProfile(r.Context(), s.AdminID, in)
		if e != nil {
			writeStoreError(w, r, e)
			return
		}
		writeJSON(w, http.StatusOK, adminProfileDTO(v))
	}
}
func adminProfile(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		v, e := d.Admin.GetAdminProfile(r.Context())
		if errors.Is(e, ErrNotFound) {
			notFound(w, r)
			return
		}
		if e != nil {
			server(w, r)
			return
		}
		writeJSON(w, http.StatusOK, adminProfileDTO(v))
	}
}
func adminLinks(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		v, e := d.Admin.ListContactLinksAdmin(r.Context())
		if e != nil {
			server(w, r)
			return
		}
		writeJSON(w, 200, v)
	}
}
func createLink(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var in content.ContactLinkInput
		if !decodeOK(w, r, &in, d) {
			return
		}
		if e := in.Validate(); e != nil {
			writeProblem(w, r, http.StatusUnprocessableEntity, "Validation Failed", e.Error())
			return
		}
		s, _ := sessionFromContext(r.Context())
		v, e := d.Admin.CreateContactLink(r.Context(), s.AdminID, in)
		if e != nil {
			writeStoreError(w, r, e)
			return
		}
		writeJSON(w, 201, v)
	}
}
func updateLink(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var in content.ContactLinkInput
		if !decodeOK(w, r, &in, d) {
			return
		}
		if e := in.Validate(); e != nil {
			writeProblem(w, r, http.StatusUnprocessableEntity, "Validation Failed", e.Error())
			return
		}
		if in.ExpectedUpdatedAt == nil {
			writeProblem(w, r, http.StatusUnprocessableEntity, "Validation Failed", "expected_updated_at is required.")
			return
		}
		s, _ := sessionFromContext(r.Context())
		v, e := d.Admin.UpdateContactLink(r.Context(), chi.URLParam(r, "id"), s.AdminID, in)
		if e != nil {
			writeStoreError(w, r, e)
			return
		}
		writeJSON(w, 200, v)
	}
}
func deleteLink(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		s, _ := sessionFromContext(r.Context())
		e := d.Admin.DeleteContactLink(r.Context(), chi.URLParam(r, "id"), s.AdminID)
		if e != nil {
			writeStoreError(w, r, e)
			return
		}
		writeJSON(w, 204, nil)
	}
}
func taxonomy(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		v, e := d.Admin.ListTaxonomy(r.Context(), chi.URLParam(r, "kind"))
		if e != nil {
			server(w, r)
			return
		}
		writeJSON(w, 200, v)
	}
}
func createTaxonomy(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var in TaxonomyInput
		if !decodeOK(w, r, &in, d) {
			return
		}
		in.Kind = chi.URLParam(r, "kind")
		if !validTaxonomyInput(in) {
			writeProblem(w, r, http.StatusUnprocessableEntity, "Validation Failed", "A valid taxonomy kind, name, and slug are required.")
			return
		}
		s, _ := sessionFromContext(r.Context())
		v, e := d.Admin.CreateTaxonomy(r.Context(), s.AdminID, in)
		if e != nil {
			writeStoreError(w, r, e)
			return
		}
		writeJSON(w, 201, v)
	}
}
func updateTaxonomy(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var in TaxonomyInput
		if !decodeOK(w, r, &in, d) {
			return
		}
		in.Kind = chi.URLParam(r, "kind")
		if !validTaxonomyInput(in) || in.ExpectedUpdatedAt == nil {
			writeProblem(w, r, http.StatusUnprocessableEntity, "Validation Failed", "A valid taxonomy payload and expected_updated_at are required.")
			return
		}
		s, _ := sessionFromContext(r.Context())
		v, e := d.Admin.UpdateTaxonomy(r.Context(), chi.URLParam(r, "id"), s.AdminID, in)
		if e != nil {
			writeStoreError(w, r, e)
			return
		}
		writeJSON(w, 200, v)
	}
}
func deleteTaxonomy(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		s, _ := sessionFromContext(r.Context())
		e := d.Admin.DeleteTaxonomy(r.Context(), chi.URLParam(r, "id"), s.AdminID)
		if e != nil {
			writeStoreError(w, r, e)
			return
		}
		writeJSON(w, 204, nil)
	}
}
func decodeOK(w http.ResponseWriter, r *http.Request, v any, d RouteDependencies) bool {
	if e := decodeJSON(w, r, v, d.MaxJSONBytes); e != nil {
		writeProblem(w, r, 400, "Bad Request", "The request body is invalid.")
		return false
	}
	return true
}
func writeStoreError(w http.ResponseWriter, r *http.Request, e error) {
	switch {
	case errors.Is(e, ErrNotFound):
		notFound(w, r)
	case errors.Is(e, ErrConflict):
		writeProblem(w, r, 409, "Conflict", "The resource conflicts with existing data or has changed.")
	default:
		server(w, r)
	}
}
func adminProject(v content.Project) content.AdminProjectDTO {
	return content.AdminProjectDTO{ProjectDTO: projectPublic(v), Status: v.Status, BodyMarkdown: v.BodyMarkdown, PublishAt: v.PublishAt, ArchivedAt: v.ArchivedAt, UpdatedAt: v.UpdatedAt, TagIDs: v.TagIDs, CategoryIDs: v.CategoryIDs}
}
func adminPost(v content.BlogPost) content.AdminBlogPostDTO {
	return content.AdminBlogPostDTO{BlogPostDTO: postPublic(v), Status: v.Status, BodyMarkdown: v.BodyMarkdown, PublishAt: v.PublishAt, ArchivedAt: v.ArchivedAt, UpdatedAt: v.UpdatedAt, ReadingTimeMinutes: v.ReadingTimeMinutes, TagIDs: v.TagIDs, CategoryIDs: v.CategoryIDs}
}

func adminProfileDTO(v content.Profile) content.AdminProfileDTO {
	return content.AdminProfileDTO{
		ProfileDTO: content.ProfileDTO{
			ID: v.ID, Name: v.Name, Headline: v.Headline, Education: v.Education,
			CurrentRole: v.CurrentRole, Statement: v.Statement, BioHTML: v.BioHTML,
			ResumeMediaID: v.ResumeMediaID,
		},
		BioMarkdown: v.BioMarkdown,
		UpdatedAt:   v.UpdatedAt,
	}
}

func validRequestedStatus(status content.Status) bool {
	return status == "" || status == content.StatusDraft || status == content.StatusScheduled ||
		status == content.StatusPublished || status == content.StatusArchived
}

func validTaxonomyInput(input TaxonomyInput) bool {
	if input.Kind != "tag" && input.Kind != "category" {
		return false
	}
	return input.Name != "" && content.ValidateSlug(input.Slug) == nil
}
