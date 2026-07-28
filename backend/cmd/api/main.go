package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/mail"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	db "github.com/AliAlfridawi/portfolioWebsite/backend/db/generated"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/auth"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/config"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/content"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/database"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/httpapi"
	mediastore "github.com/AliAlfridawi/portfolioWebsite/backend/internal/media"
)

var version = "development"

func main() {
	if len(os.Args) == 2 && os.Args[1] == "healthcheck" {
		if err := healthcheck(); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		return
	}
	if len(os.Args) == 2 && os.Args[1] == "admin-bootstrap" {
		if err := bootstrapAdmin(); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		return
	}
	if err := run(); err != nil {
		slog.Error("API stopped", "error", err)
		os.Exit(1)
	}
}

func bootstrapAdmin() error {
	databaseURL := os.Getenv("DATABASE_URL")
	email := os.Getenv("ADMIN_BOOTSTRAP_EMAIL")
	displayName := os.Getenv("ADMIN_BOOTSTRAP_DISPLAY_NAME")
	passwordFile := os.Getenv("ADMIN_BOOTSTRAP_PASSWORD_FILE")
	if databaseURL == "" || email == "" || passwordFile == "" {
		return errors.New("DATABASE_URL, ADMIN_BOOTSTRAP_EMAIL, and ADMIN_BOOTSTRAP_PASSWORD_FILE are required")
	}
	address, err := mail.ParseAddress(email)
	if err != nil || address.Address != email {
		return errors.New("ADMIN_BOOTSTRAP_EMAIL must be a plain valid email address")
	}
	if displayName == "" {
		displayName = email
	}
	if len(displayName) > 160 {
		return errors.New("ADMIN_BOOTSTRAP_DISPLAY_NAME must be at most 160 characters")
	}
	passwordBytes, err := os.ReadFile(passwordFile)
	if err != nil {
		return fmt.Errorf("read admin bootstrap password: %w", err)
	}
	password := strings.TrimRight(string(passwordBytes), "\r\n")
	clear(passwordBytes)
	if len(password) < 12 || len(password) > 1024 {
		return errors.New("admin bootstrap password must be between 12 and 1024 bytes")
	}
	passwordHash, err := auth.HashPassword(password)
	password = ""
	if err != nil {
		return fmt.Errorf("hash admin password: %w", err)
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := database.Open(ctx, databaseURL, logger)
	if err != nil {
		return err
	}
	defer pool.Close()

	_, err = db.New(pool).CreateUser(ctx, db.CreateUserParams{
		Email: email, PasswordHash: passwordHash, DisplayName: displayName, Role: db.UserRoleAdmin,
	})
	if err != nil {
		return fmt.Errorf("create admin account (it may already exist): %w", err)
	}
	logger.Info("admin account created", "email", email)
	return nil
}

func healthcheck() error {
	endpoint := os.Getenv("HEALTHCHECK_URL")
	if endpoint == "" {
		endpoint = "http://127.0.0.1:8080/api/v1/healthz"
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 4096))
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("health endpoint returned %s", response.Status)
	}
	return nil
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: cfg.LogLevel}))
	slog.SetDefault(logger)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	dbContext, cancel := context.WithTimeout(ctx, cfg.DatabaseTimeout)
	defer cancel()
	pool, err := database.Open(dbContext, cfg.DatabaseURL, logger)
	if err != nil {
		return err
	}
	defer pool.Close()

	sessionConfig := auth.DefaultSessionConfig()
	sessionConfig.CookieName = cfg.SessionCookieName
	sessionConfig.CookiePath = "/"
	sessionConfig.Secure = cfg.Environment == "production"
	sessionConfig.HTTPOnly = true
	sessionConfig.SameSite = http.SameSiteLaxMode
	sessionConfig.Lifetime = cfg.SessionLifetime
	sessionConfig.IdleTimeout = cfg.SessionIdleTimeout
	if err := sessionConfig.Validate(); err != nil {
		return fmt.Errorf("session configuration: %w", err)
	}

	mediaFiles, err := mediastore.NewStore(cfg.MediaRoot, cfg.MaxUploadBytes)
	if err != nil {
		return fmt.Errorf("media storage configuration: %w", err)
	}
	adapters := database.NewAdapters(pool.Pool, content.NewGoldmarkRenderer())
	adapters.AttachMediaStore(mediaFiles)
	routeDependencies := httpapi.RouteDependencies{
		Public: adapters, Admin: adapters, Auth: adapters, Media: adapters,
		Limiter:        httpapi.NewKeyedLimiter(5, time.Minute),
		Session:        sessionConfig,
		CSRFCookieName: cfg.CSRFCookieName,
		MaxJSONBytes:   cfg.MaxRequestBytes,
		MaxUploadBytes: cfg.MaxUploadBytes,
		Now:            time.Now,
	}

	server := &http.Server{
		Addr: cfg.Address,
		Handler: httpapi.NewRouter(httpapi.Dependencies{
			Config: cfg, Logger: logger, Readiness: pool, Version: version, Routes: routeDependencies,
		}),
		ReadTimeout:       cfg.ReadTimeout,
		ReadHeaderTimeout: cfg.ReadHeaderTimeout,
		WriteTimeout:      cfg.WriteTimeout,
		IdleTimeout:       cfg.IdleTimeout,
	}

	serverErrors := make(chan error, 1)
	go func() {
		logger.Info("API listening", "address", cfg.Address, "environment", cfg.Environment, "version", version)
		serverErrors <- server.ListenAndServe()
	}()

	select {
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
		return nil
	case <-ctx.Done():
		logger.Info("shutdown signal received")
	}

	shutdownContext, shutdownCancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
	defer shutdownCancel()
	if err := server.Shutdown(shutdownContext); err != nil {
		_ = server.Close()
		return err
	}
	return nil
}
