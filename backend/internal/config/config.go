package config

import (
	"errors"
	"fmt"
	"log/slog"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	defaultAddress          = ":8080"
	defaultMediaRoot        = "/var/lib/portfolio/media"
	defaultShutdownTimeout  = 15 * time.Second
	defaultReadTimeout      = 10 * time.Second
	defaultReadHeader       = 5 * time.Second
	defaultWriteTimeout     = 30 * time.Second
	defaultIdleTimeout      = 60 * time.Second
	defaultDatabaseTimeout  = 5 * time.Second
	defaultMaxRequestBytes  = 1 << 20
	defaultMaxUploadBytes   = 20 << 20
	defaultSessionLifetime  = 12 * time.Hour
	defaultSessionIdle      = 2 * time.Hour
	defaultTrustedProxyMode = "cloudflare"
)

type Config struct {
	Environment        string
	Address            string
	PublicBaseURL      *url.URL
	DatabaseURL        string
	MediaRoot          string
	LogLevel           slog.Level
	ShutdownTimeout    time.Duration
	ReadTimeout        time.Duration
	ReadHeaderTimeout  time.Duration
	WriteTimeout       time.Duration
	IdleTimeout        time.Duration
	DatabaseTimeout    time.Duration
	MaxRequestBytes    int64
	MaxUploadBytes     int64
	SessionLifetime    time.Duration
	SessionIdleTimeout time.Duration
	SessionCookieName  string
	CSRFCookieName     string
	TrustedProxyMode   string
}

func Load() (Config, error) {
	publicBaseURL, err := parsePublicURL(getenv("PUBLIC_BASE_URL", "http://localhost:4200"))
	if err != nil {
		return Config{}, err
	}

	var parseErrors []error
	parseDuration := func(key string, fallback time.Duration) time.Duration {
		value, parseErr := duration(key, fallback)
		if parseErr != nil {
			parseErrors = append(parseErrors, parseErr)
		}
		return value
	}
	parseInteger := func(key string, fallback int64) int64 {
		value, parseErr := integer(key, fallback)
		if parseErr != nil {
			parseErrors = append(parseErrors, parseErr)
		}
		return value
	}
	logLevel, err := parseLogLevel(getenv("LOG_LEVEL", "info"))
	if err != nil {
		parseErrors = append(parseErrors, err)
	}

	cfg := Config{
		Environment:        getenv("APP_ENV", "development"),
		Address:            getenv("API_ADDRESS", defaultAddress),
		PublicBaseURL:      publicBaseURL,
		DatabaseURL:        strings.TrimSpace(os.Getenv("DATABASE_URL")),
		MediaRoot:          getenv("MEDIA_ROOT", defaultMediaRoot),
		LogLevel:           logLevel,
		ShutdownTimeout:    parseDuration("SHUTDOWN_TIMEOUT", defaultShutdownTimeout),
		ReadTimeout:        parseDuration("HTTP_READ_TIMEOUT", defaultReadTimeout),
		ReadHeaderTimeout:  parseDuration("HTTP_READ_HEADER_TIMEOUT", defaultReadHeader),
		WriteTimeout:       parseDuration("HTTP_WRITE_TIMEOUT", defaultWriteTimeout),
		IdleTimeout:        parseDuration("HTTP_IDLE_TIMEOUT", defaultIdleTimeout),
		DatabaseTimeout:    parseDuration("DATABASE_TIMEOUT", defaultDatabaseTimeout),
		MaxRequestBytes:    parseInteger("MAX_REQUEST_BYTES", defaultMaxRequestBytes),
		MaxUploadBytes:     parseInteger("MAX_UPLOAD_BYTES", defaultMaxUploadBytes),
		SessionLifetime:    parseDuration("SESSION_LIFETIME", defaultSessionLifetime),
		SessionIdleTimeout: parseDuration("SESSION_IDLE_TIMEOUT", defaultSessionIdle),
		SessionCookieName:  getenv("SESSION_COOKIE_NAME", "__Host-portfolio_session"),
		CSRFCookieName:     getenv("CSRF_COOKIE_NAME", "__Host-portfolio_csrf"),
		TrustedProxyMode:   getenv("TRUSTED_PROXY_MODE", defaultTrustedProxyMode),
	}

	if validateErr := cfg.Validate(); validateErr != nil {
		parseErrors = append(parseErrors, validateErr)
	}
	if err := errors.Join(parseErrors...); err != nil {
		return Config{}, err
	}
	return cfg, nil
}

func (c Config) Validate() error {
	var problems []error
	switch c.Environment {
	case "development", "test", "production":
	default:
		problems = append(problems, errors.New("APP_ENV must be development, test, or production"))
	}
	if c.DatabaseURL == "" {
		problems = append(problems, errors.New("DATABASE_URL is required"))
	}
	if c.PublicBaseURL == nil || c.PublicBaseURL.Host == "" {
		problems = append(problems, errors.New("PUBLIC_BASE_URL must be an absolute URL"))
	}
	if c.Environment == "production" && c.PublicBaseURL != nil && c.PublicBaseURL.Scheme != "https" {
		problems = append(problems, errors.New("PUBLIC_BASE_URL must use https in production"))
	}
	if c.MaxRequestBytes <= 0 || c.MaxUploadBytes <= 0 {
		problems = append(problems, errors.New("request size limits must be positive"))
	}
	if c.MaxUploadBytes < c.MaxRequestBytes {
		problems = append(problems, errors.New("MAX_UPLOAD_BYTES must be at least MAX_REQUEST_BYTES"))
	}
	if c.SessionLifetime <= 0 {
		problems = append(problems, errors.New("SESSION_LIFETIME must be positive"))
	}
	if c.SessionIdleTimeout <= 0 || c.SessionIdleTimeout > c.SessionLifetime {
		problems = append(problems, errors.New("SESSION_IDLE_TIMEOUT must be positive and no longer than SESSION_LIFETIME"))
	}
	if c.SessionCookieName == "" || c.CSRFCookieName == "" {
		problems = append(problems, errors.New("cookie names must not be empty"))
	}
	if c.Environment == "production" &&
		(!strings.HasPrefix(c.SessionCookieName, "__Host-") || !strings.HasPrefix(c.CSRFCookieName, "__Host-")) {
		problems = append(problems, errors.New("production cookie names must use the __Host- prefix"))
	}
	return errors.Join(problems...)
}

func parsePublicURL(raw string) (*url.URL, error) {
	parsed, err := url.Parse(raw)
	if err != nil {
		return nil, fmt.Errorf("parse PUBLIC_BASE_URL: %w", err)
	}
	if parsed.Scheme == "" || parsed.Host == "" {
		return nil, errors.New("PUBLIC_BASE_URL must be an absolute URL")
	}
	parsed.Path = strings.TrimRight(parsed.Path, "/")
	return parsed, nil
}

func getenv(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func duration(key string, fallback time.Duration) (time.Duration, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback, nil
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return 0, fmt.Errorf("%s must be a duration: %w", key, err)
	}
	if parsed <= 0 {
		return 0, fmt.Errorf("%s must be positive", key)
	}
	return parsed, nil
}

func integer(key string, fallback int64) (int64, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback, nil
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("%s must be an integer: %w", key, err)
	}
	if parsed <= 0 {
		return 0, fmt.Errorf("%s must be positive", key)
	}
	return parsed, nil
}

func parseLogLevel(raw string) (slog.Level, error) {
	var level slog.Level
	if err := level.UnmarshalText([]byte(raw)); err != nil {
		return slog.LevelInfo, fmt.Errorf("LOG_LEVEL: %w", err)
	}
	return level, nil
}
