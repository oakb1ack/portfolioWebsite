package auth

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"golang.org/x/crypto/argon2"
)

// Argon2id parameters are deliberately encoded with every password hash so
// parameters can be increased later without invalidating existing passwords.
type Argon2idParams struct {
	Memory      uint32 // KiB
	Iterations  uint32
	Parallelism uint8
	SaltLength  uint32
	KeyLength   uint32
}

var DefaultArgon2idParams = Argon2idParams{
	Memory: 64 * 1024, Iterations: 3, Parallelism: 1, SaltLength: 16, KeyLength: 32,
}

var (
	ErrInvalidPasswordHash = errors.New("invalid password hash")
	ErrPasswordMismatch    = errors.New("password mismatch")
)

const (
	maxEncodedSaltLength = 86  // 64 raw bytes, unpadded base64
	maxEncodedKeyLength  = 171 // 128 raw bytes, unpadded base64
)

func (p Argon2idParams) validate() error {
	if p.Memory < 16*1024 || p.Memory > 1024*1024 || p.Iterations == 0 || p.Iterations > 20 || p.Parallelism == 0 || p.Parallelism > 32 || p.SaltLength < 16 || p.SaltLength > 64 || p.KeyLength < 16 || p.KeyLength > 128 {
		return fmt.Errorf("%w: unsupported Argon2id parameters", ErrInvalidPasswordHash)
	}
	return nil
}

func HashPassword(password string) (string, error) {
	return HashPasswordWithParams(password, DefaultArgon2idParams)
}

func HashPasswordWithParams(password string, params Argon2idParams) (string, error) {
	if password == "" {
		return "", errors.New("password must not be empty")
	}
	if err := params.validate(); err != nil {
		return "", err
	}
	salt := make([]byte, params.SaltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("generate password salt: %w", err)
	}
	key := argon2.IDKey([]byte(password), salt, params.Iterations, params.Memory, params.Parallelism, params.KeyLength)
	enc := base64.RawStdEncoding
	return fmt.Sprintf("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s", params.Memory, params.Iterations, params.Parallelism, enc.EncodeToString(salt), enc.EncodeToString(key)), nil
}

// VerifyPassword returns ErrPasswordMismatch for both a wrong password and a
// well-formed hash with a non-matching derived key. Callers should not expose
// these distinctions to clients.
func VerifyPassword(password, encoded string) error {
	params, salt, expected, err := parsePasswordHash(encoded)
	if err != nil {
		return err
	}
	actual := argon2.IDKey([]byte(password), salt, params.Iterations, params.Memory, params.Parallelism, params.KeyLength)
	if !constantTimeEqual(actual, expected) {
		return ErrPasswordMismatch
	}
	return nil
}

func parsePasswordHash(encoded string) (Argon2idParams, []byte, []byte, error) {
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[1] != "argon2id" || parts[2] != "v=19" {
		return Argon2idParams{}, nil, nil, ErrInvalidPasswordHash
	}
	var p Argon2idParams
	for _, item := range strings.Split(parts[3], ",") {
		kv := strings.SplitN(item, "=", 2)
		if len(kv) != 2 {
			return Argon2idParams{}, nil, nil, ErrInvalidPasswordHash
		}
		n, err := strconv.ParseUint(kv[1], 10, 32)
		if err != nil {
			return Argon2idParams{}, nil, nil, ErrInvalidPasswordHash
		}
		switch kv[0] {
		case "m":
			p.Memory = uint32(n)
		case "t":
			p.Iterations = uint32(n)
		case "p":
			if n > 255 {
				return Argon2idParams{}, nil, nil, ErrInvalidPasswordHash
			}
			p.Parallelism = uint8(n)
		default:
			return Argon2idParams{}, nil, nil, ErrInvalidPasswordHash
		}
	}
	enc := base64.RawStdEncoding
	if len(parts[4]) > maxEncodedSaltLength || len(parts[5]) > maxEncodedKeyLength {
		return Argon2idParams{}, nil, nil, ErrInvalidPasswordHash
	}
	salt, err := enc.DecodeString(parts[4])
	if err != nil || len(salt) < 16 || len(salt) > 64 {
		return Argon2idParams{}, nil, nil, ErrInvalidPasswordHash
	}
	expected, err := enc.DecodeString(parts[5])
	if err != nil || len(expected) < 16 || len(expected) > 128 {
		return Argon2idParams{}, nil, nil, ErrInvalidPasswordHash
	}
	p.SaltLength, p.KeyLength = uint32(len(salt)), uint32(len(expected))
	if err := p.validate(); err != nil {
		return Argon2idParams{}, nil, nil, err
	}
	return p, salt, expected, nil
}

func constantTimeEqual(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	var diff byte
	for i := range a {
		diff |= a[i] ^ b[i]
	}
	return diff == 0
}
