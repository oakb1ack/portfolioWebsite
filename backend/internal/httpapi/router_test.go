package httpapi

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/config"
)

type readinessStub struct {
	err error
}

func (s readinessStub) Ready(context.Context) error { return s.err }

func testDependencies() Dependencies {
	return Dependencies{
		Config: config.Config{
			WriteTimeout:    time.Second,
			DatabaseTimeout: time.Second,
		},
		Logger:    slog.New(slog.NewTextHandler(io.Discard, nil)),
		Readiness: readinessStub{},
		Version:   "test",
	}
}

func TestHealth(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/api/v1/healthz", nil)
	response := httptest.NewRecorder()

	NewRouter(testDependencies()).ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
	if !strings.Contains(response.Body.String(), `"status":"ok"`) {
		t.Fatalf("body = %s, want ok status", response.Body.String())
	}
}

func TestReadinessFailureDoesNotLeakDetails(t *testing.T) {
	deps := testDependencies()
	deps.Readiness = readinessStub{err: errors.New("password secret in database error")}
	request := httptest.NewRequest(http.MethodGet, "/api/v1/readyz", nil)
	response := httptest.NewRecorder()

	NewRouter(deps).ServeHTTP(response, request)

	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusServiceUnavailable)
	}
	if strings.Contains(response.Body.String(), "password secret") {
		t.Fatalf("body leaks readiness details: %s", response.Body.String())
	}
}

func TestNotFoundUsesProblemJSON(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/api/v1/missing", nil)
	response := httptest.NewRecorder()

	NewRouter(testDependencies()).ServeHTTP(response, request)

	if response.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusNotFound)
	}
	if got := response.Header().Get("Content-Type"); got != jsonContentType {
		t.Fatalf("Content-Type = %q, want %q", got, jsonContentType)
	}
}
