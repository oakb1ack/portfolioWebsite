package database

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Pool struct {
	*pgxpool.Pool
}

func Open(ctx context.Context, databaseURL string, logger *slog.Logger) (*Pool, error) {
	poolConfig, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse database configuration: %w", err)
	}

	poolConfig.ConnConfig.Tracer = nil
	poolConfig.MaxConnIdleTime = 5 * time.Minute
	poolConfig.MaxConnLifetime = 30 * time.Minute
	poolConfig.HealthCheckPeriod = 30 * time.Second

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("create database pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	logger.Info("database connection established",
		"max_connections", poolConfig.MaxConns,
		"min_connections", poolConfig.MinConns,
	)
	return &Pool{Pool: pool}, nil
}

func (p *Pool) Ready(ctx context.Context) error {
	if err := p.Ping(ctx); err != nil {
		return fmt.Errorf("database readiness check: %w", err)
	}
	return nil
}
