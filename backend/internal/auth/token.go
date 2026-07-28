package auth

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
)

const DefaultTokenBytes = 32

func GenerateOpaqueToken(size int) (string, error) {
	if size < 32 {
		return "", errors.New("token size must be at least 32 bytes")
	}
	b := make([]byte, size)
	if _, err := cryptoRandRead(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func GenerateSessionToken() (string, error) { return GenerateOpaqueToken(DefaultTokenBytes) }
func GenerateCSRFToken() (string, error)    { return GenerateOpaqueToken(DefaultTokenBytes) }

func HashToken(token string) [32]byte { return sha256.Sum256([]byte(token)) }
func CompareTokenHash(token string, expected [32]byte) bool {
	actual := HashToken(token)
	return subtle.ConstantTimeCompare(actual[:], expected[:]) == 1
}

// cryptoRandRead is a variable to make failure handling testable without
// weakening the production default (crypto/rand.Read).
var cryptoRandRead = func(b []byte) (int, error) { return randRead(b) }
