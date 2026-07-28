package auth

import (
	"context"
	"time"
)

type Session struct {
	ID            string
	AdminID       string
	TokenHash     [32]byte
	CSRFTokenHash [32]byte
	CreatedAt     time.Time
	LastSeenAt    time.Time
	ExpiresAt     time.Time
	IdleExpiresAt time.Time
	RevokedAt     *time.Time
}

// SessionStore is deliberately independent of sqlc-generated types. An
// adapter owns mapping, transactions, and database-specific error handling.
type SessionStore interface {
	Create(ctx context.Context, session Session) error
	FindByTokenHash(ctx context.Context, tokenHash [32]byte) (Session, error)
	Touch(ctx context.Context, sessionID string, lastSeenAt, idleExpiresAt time.Time) error
	Revoke(ctx context.Context, sessionID string, revokedAt time.Time) error
}

func (s Session) Active(now time.Time, idleTimeout time.Duration) bool {
	idleActive := now.Sub(s.LastSeenAt) <= idleTimeout
	if !s.IdleExpiresAt.IsZero() {
		idleActive = now.Before(s.IdleExpiresAt)
	}
	return s.ID != "" && s.RevokedAt == nil && now.Before(s.ExpiresAt) && idleActive
}
