package auth

import (
	"errors"
	"strings"
	"testing"
)

func TestPasswordHashRoundTripAndEncoding(t *testing.T) {
	hash, err := HashPasswordWithParams("correct horse battery staple", Argon2idParams{Memory: 16 * 1024, Iterations: 1, Parallelism: 1, SaltLength: 16, KeyLength: 32})
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(hash, "$argon2id$v=19$") {
		t.Fatalf("unexpected hash format: %q", hash)
	}
	if err := VerifyPassword("correct horse battery staple", hash); err != nil {
		t.Fatal(err)
	}
	if !errors.Is(VerifyPassword("wrong", hash), ErrPasswordMismatch) {
		t.Fatal("wrong password should not verify")
	}
}

func TestPasswordHashRejectsMalformedOrUnsafeParameters(t *testing.T) {
	for _, value := range []string{"", "$argon2i$v=19$m=16384,t=1,p=1$abc$def", "$argon2id$v=19$m=1,t=1,p=1$YWJj$YWJj", "$argon2id$v=19$m=16384,t=1,p=1$" + strings.Repeat("A", 87) + "$YWJj", "$argon2id$v=19$m=16384,t=1,p=1$YWJj$" + strings.Repeat("A", 172)} {
		if err := VerifyPassword("password", value); !errors.Is(err, ErrInvalidPasswordHash) {
			t.Errorf("%q: got %v", value, err)
		}
	}
}
