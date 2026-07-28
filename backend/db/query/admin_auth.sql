-- name: CreateUser :one
INSERT INTO users (email, password_hash, display_name, role)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: ListUsers :many
SELECT * FROM users ORDER BY created_at LIMIT $1 OFFSET $2;

-- name: UpdateUser :one
UPDATE users SET email = $2, display_name = $3, role = $4, status = $5
WHERE id = $1 AND updated_at = $6 RETURNING *;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;

-- name: UpdateUserLastLogin :exec
UPDATE users SET last_login_at = now() WHERE id = $1;

-- name: CreateSession :one
INSERT INTO sessions (user_id, token_id_hash, csrf_token_hash, expires_at, idle_expires_at, ip_address, user_agent)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetActiveSessionByTokenHash :one
SELECT s.* FROM sessions s JOIN users u ON u.id = s.user_id
WHERE s.token_id_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now()
  AND s.idle_expires_at > now()
  AND u.status = 'active';

-- name: TouchSession :exec
UPDATE sessions SET last_seen_at = now(), idle_expires_at = $2
WHERE id = $1 AND revoked_at IS NULL AND expires_at > now() AND $2 <= expires_at;

-- name: RevokeSession :exec
UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL;

-- name: RevokeAllUserSessions :exec
UPDATE sessions SET revoked_at = now()
WHERE user_id = $1 AND revoked_at IS NULL;

-- name: DeleteExpiredSessions :exec
DELETE FROM sessions WHERE expires_at < now() OR revoked_at < now() - interval '30 days';

-- name: CountUsers :one
SELECT count(*)::bigint FROM users;
