-- name: UpsertProfile :one
INSERT INTO profile (singleton, display_name, headline, education, current_position, statement,
                     bio_markdown, bio_html, resume_media_id, updated_by)
VALUES (true, $1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (singleton) DO UPDATE SET display_name = EXCLUDED.display_name,
  headline = EXCLUDED.headline, education = EXCLUDED.education,
  current_position = EXCLUDED.current_position, statement = EXCLUDED.statement,
  bio_markdown = EXCLUDED.bio_markdown,
  bio_html = EXCLUDED.bio_html, resume_media_id = EXCLUDED.resume_media_id,
  updated_by = EXCLUDED.updated_by
  WHERE profile.updated_at = $10
RETURNING *;

-- name: GetAdminProfile :one
SELECT * FROM profile WHERE singleton = true;

-- name: ListAdminContactLinks :many
SELECT * FROM contact_links ORDER BY sort_order, label LIMIT $1 OFFSET $2;

-- name: GetAdminContactLink :one
SELECT * FROM contact_links WHERE id = $1;

-- name: CreateContactLink :one
INSERT INTO contact_links (label, kind, url, icon_key, sort_order, is_visible)
VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;

-- name: UpdateContactLink :one
UPDATE contact_links SET label = $2, kind = $3, url = $4, icon_key = $5, sort_order = $6, is_visible = $7
WHERE id = $1 AND updated_at = $8 RETURNING *;

-- name: DeleteContactLink :execrows
DELETE FROM contact_links WHERE id = $1;

-- name: CountContactLinks :one
SELECT count(*)::bigint FROM contact_links;
