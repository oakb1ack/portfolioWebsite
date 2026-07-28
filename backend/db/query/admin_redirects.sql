-- name: CreateProjectRedirect :one
INSERT INTO slug_redirects (content_type, old_slug, project_id)
VALUES ('project', $1, $2) RETURNING *;

-- name: CreatePostRedirect :one
INSERT INTO slug_redirects (content_type, old_slug, post_id)
VALUES ('post', $1, $2) RETURNING *;

-- name: ListRedirects :many
SELECT * FROM slug_redirects ORDER BY created_at DESC LIMIT $1 OFFSET $2;

-- name: DeleteRedirect :exec
DELETE FROM slug_redirects WHERE id = $1;
