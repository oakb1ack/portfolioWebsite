package auth

import (
	"encoding/base64"
	"testing"
)

func TestOpaqueSessionTokenIsRandomAndHashable(t *testing.T) {
	a, err := GenerateSessionToken()
	if err != nil {
		t.Fatal(err)
	}
	b, err := GenerateSessionToken()
	if err != nil {
		t.Fatal(err)
	}
	if a == b {
		t.Fatal("session tokens repeated")
	}
	raw, err := base64.RawURLEncoding.DecodeString(a)
	if err != nil || len(raw) != DefaultTokenBytes {
		t.Fatalf("invalid token: %v", err)
	}
	h := HashToken(a)
	if !CompareTokenHash(a, h) || CompareTokenHash(b, h) {
		t.Fatal("token hash comparison failed")
	}
}
