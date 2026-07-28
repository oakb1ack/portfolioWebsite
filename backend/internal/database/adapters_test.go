package database

import (
	"errors"
	"testing"
	"time"

	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/content"
	"github.com/AliAlfridawi/portfolioWebsite/backend/internal/httpapi"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

func TestMapDBError(t *testing.T) {
	if !errors.Is(mapDBError(pgx.ErrNoRows), httpapi.ErrNotFound) {
		t.Fatal("no rows must map to not found")
	}
	for _, code := range []string{"23505", "23503", "23514"} {
		if !errors.Is(mapDBError(&pgconn.PgError{Code: code}), httpapi.ErrConflict) {
			t.Fatalf("%s must map to conflict", code)
		}
	}
	original := errors.New("database unavailable")
	if !errors.Is(mapDBError(original), original) {
		t.Fatal("unrelated errors must be preserved")
	}
}

func TestUUIDValueRoundTripAndRejectsInvalid(t *testing.T) {
	const input = "01234567-89ab-cdef-0123-456789abcdef"
	u, err := uuidValue(input)
	if err != nil {
		t.Fatal(err)
	}
	if got := uuidString(u); got != input {
		t.Fatalf("round trip = %q", got)
	}
	if _, err := uuidValue("not-a-uuid"); err == nil {
		t.Fatal("invalid UUID accepted")
	}
}

func TestStatusTimes(t *testing.T) {
	now := time.Date(2026, time.January, 1, 12, 0, 0, 0, time.UTC)
	future := now.Add(time.Hour)
	if got, err := statusTimes(content.StatusScheduled, &future, now); err != nil || got == nil || !got.Equal(future) {
		t.Fatalf("scheduled status: %v %v", got, err)
	}
	if _, err := statusTimes(content.StatusScheduled, &now, now); err == nil {
		t.Fatal("scheduled content accepted non-future publish time")
	}
	if got, err := statusTimes(content.StatusDraft, &future, now); err != nil || got != nil {
		t.Fatalf("draft status: %v %v", got, err)
	}
	if got, err := statusTimes(content.StatusPublished, nil, now); err != nil || got == nil || !got.Equal(now) {
		t.Fatalf("published status: %v %v", got, err)
	}
}

func TestBytes32DoesNotAliasInput(t *testing.T) {
	input := make([]byte, 32)
	input[0] = 7
	got := bytes32(input)
	input[0] = 9
	if got[0] != 7 {
		t.Fatal("session hash mapping aliases database input")
	}
}
