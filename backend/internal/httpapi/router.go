package httpapi

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/config"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type ReadinessChecker interface {
	Ready(context.Context) error
}

type Dependencies struct {
	Config    config.Config
	Logger    *slog.Logger
	Readiness ReadinessChecker
	Version   string
	Routes    RouteDependencies
}

func NewRouter(deps Dependencies) http.Handler {
	router := chi.NewRouter()
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(securityHeaders)
	router.Use(requestLogger(deps.Logger))
	router.Use(recoverer(deps.Logger))
	router.Use(middleware.Timeout(deps.Config.WriteTimeout))

	router.Route("/api/v1", func(api chi.Router) {
		api.Get("/healthz", healthHandler(deps.Version))
		api.Get("/readyz", readinessHandler(deps.Readiness, deps.Config.DatabaseTimeout))

		api.Group(func(public chi.Router) {
			public.Use(cachePublic(time.Minute))
			public.Get("/", indexHandler(deps.Version))
		})
		RegisterRoutes(api, deps.Routes)
	})

	router.NotFound(func(w http.ResponseWriter, r *http.Request) {
		writeProblem(w, r, http.StatusNotFound, "Not Found", "The requested API resource does not exist.")
	})
	router.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		writeProblem(w, r, http.StatusMethodNotAllowed, "Method Not Allowed", "This resource does not support the requested method.")
	})
	return router
}

func indexHandler(version string) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{
			"name":    "portfolio-api",
			"version": version,
			"status":  "ok",
		})
	}
}

func healthHandler(version string) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{
			"status":  "ok",
			"version": version,
		})
	}
}

func readinessHandler(checker ReadinessChecker, timeout time.Duration) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), timeout)
		defer cancel()
		if checker == nil {
			writeProblem(w, r, http.StatusServiceUnavailable, "Not Ready", "Database readiness checker is unavailable.")
			return
		}
		if err := checker.Ready(ctx); err != nil {
			writeProblem(w, r, http.StatusServiceUnavailable, "Not Ready", "A required dependency is unavailable.")
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
	}
}

func notImplementedHandler(detail string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeProblem(w, r, http.StatusNotImplemented, "Not Implemented", detail)
	}
}
