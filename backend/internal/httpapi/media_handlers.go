package httpapi

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/content"
	"github.com/go-chi/chi/v5"
)

func publicMedia(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if d.Media == nil {
			unavailable(w, r)
			return
		}
		asset, file, err := d.Media.OpenPublicMedia(r.Context(), chi.URLParam(r, "id"))
		if errors.Is(err, ErrNotFound) {
			notFound(w, r)
			return
		}
		if err != nil {
			server(w, r)
			return
		}
		defer file.Close()

		w.Header().Set("Content-Type", asset.MIMEType)
		w.Header().Set("Content-Disposition", "inline")
		w.Header().Set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800")
		w.Header().Set("ETag", fmt.Sprintf(`"%s-%d"`, asset.ID, asset.UpdatedAt.Unix()))
		modified := asset.UpdatedAt
		if modified.IsZero() {
			modified = asset.CreatedAt
		}
		http.ServeContent(w, r, asset.ID, modified, file)
	}
}

func adminMedia(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if d.Media == nil {
			unavailable(w, r)
			return
		}
		pagination := page(r)
		items, total, err := d.Media.ListAdminMedia(r.Context(), pagination)
		if err != nil {
			server(w, r)
			return
		}
		out := make([]content.AdminMediaDTO, 0, len(items))
		for _, item := range items {
			out = append(out, adminMediaDTO(item))
		}
		writeJSON(w, http.StatusOK, PageResult[content.AdminMediaDTO]{
			Items: out, Total: total, Limit: pagination.Limit, Offset: pagination.Offset,
		})
	}
}

func uploadMedia(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if d.Media == nil {
			unavailable(w, r)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, d.MaxUploadBytes+(1<<20))
		if err := r.ParseMultipartForm(2 << 20); err != nil {
			writeProblem(w, r, http.StatusRequestEntityTooLarge, "Upload Rejected", "The multipart upload is invalid or too large.")
			return
		}
		file, header, err := r.FormFile("file")
		if err != nil {
			writeProblem(w, r, http.StatusUnprocessableEntity, "Validation Failed", "A file field is required.")
			return
		}
		defer file.Close()
		altText := r.FormValue("alt_text")
		if len(altText) > 500 {
			writeProblem(w, r, http.StatusUnprocessableEntity, "Validation Failed", "alt_text must be at most 500 characters.")
			return
		}
		session, ok := sessionFromContext(r.Context())
		if !ok {
			writeProblem(w, r, http.StatusUnauthorized, "Unauthorized", "Authentication is required.")
			return
		}
		asset, err := d.Media.CreateMedia(r.Context(), session.AdminID, header.Filename, file, altText)
		if err != nil {
			writeStoreError(w, r, err)
			return
		}
		w.Header().Set("Location", "/api/v1/admin/media/"+asset.ID)
		writeJSON(w, http.StatusCreated, adminMediaDTO(asset))
	}
}

func deleteMedia(d RouteDependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if d.Media == nil {
			unavailable(w, r)
			return
		}
		if err := d.Media.DeleteMedia(r.Context(), chi.URLParam(r, "id")); err != nil {
			writeStoreError(w, r, err)
			return
		}
		writeJSON(w, http.StatusNoContent, nil)
	}
}

func adminMediaDTO(asset content.Media) content.AdminMediaDTO {
	return content.AdminMediaDTO{
		MediaDTO: content.MediaDTO{
			ID: asset.ID, PublicURL: "/api/v1/media/" + asset.ID, MIMEType: asset.MIMEType,
			Width: asset.Width, Height: asset.Height, AltText: asset.AltText,
		},
		OriginalName: asset.OriginalName,
		SizeBytes:    asset.SizeBytes,
		CreatedAt:    asset.CreatedAt,
		UpdatedAt:    asset.UpdatedAt,
	}
}
