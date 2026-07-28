package auth

import "crypto/subtle"

// CSRFTokenMatches compares a request token to the session-bound token in
// constant time. Store only HashToken(csrfToken) with the session.
func CSRFTokenMatches(submitted string, expectedHash [32]byte) bool {
	actual := HashToken(submitted)
	return subtle.ConstantTimeCompare(actual[:], expectedHash[:]) == 1
}
