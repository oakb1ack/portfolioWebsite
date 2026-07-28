-- name: ListAdminPosts :many
SELECT * FROM blog_posts ORDER BY updated_at DESC LIMIT $1 OFFSET $2;

-- name: CountAdminPosts :one
SELECT count(*)::bigint FROM blog_posts;

-- name: GetAdminPost :one
SELECT * FROM blog_posts WHERE id = $1;

-- name: ListPostTags :many
SELECT t.* FROM taxonomy_terms t JOIN post_tags pt ON pt.term_id = t.id
WHERE pt.post_id = $1 ORDER BY t.name;

-- name: ListPostCategories :many
SELECT t.* FROM taxonomy_terms t JOIN post_categories pc ON pc.term_id = t.id
WHERE pc.post_id = $1 ORDER BY t.name;

-- name: CreatePost :one
INSERT INTO blog_posts (created_by, updated_by, title, slug, excerpt, body_markdown, body_html,
                        content_status, publish_at, reading_time_minutes, featured, featured_media_id)
VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;

-- name: UpdatePost :one
UPDATE blog_posts
SET updated_by = $2, title = $3, slug = $4, excerpt = $5, body_markdown = $6,
    body_html = $7, content_status = $8, publish_at = $9, reading_time_minutes = $10,
    featured = $11, featured_media_id = $12,
    published_at = CASE WHEN $8::content_status = 'published' AND published_at IS NULL THEN now()
                        WHEN $8::content_status IN ('draft', 'scheduled') THEN NULL ELSE published_at END,
    archived_at = CASE WHEN $8::content_status = 'archived' THEN COALESCE(archived_at, now()) ELSE NULL END
WHERE id = $1 AND updated_at = $13
RETURNING *;

-- name: ArchivePost :one
UPDATE blog_posts SET content_status = 'archived', publish_at = NULL,
  archived_at = COALESCE(archived_at, now()), updated_by = $2
WHERE id = $1 AND updated_at = $3 RETURNING *;

-- name: DeletePost :execrows
DELETE FROM blog_posts WHERE id = $1;

-- name: DeletePostTags :exec
DELETE FROM post_tags WHERE post_id = $1;

-- name: AddPostTags :exec
INSERT INTO post_tags (post_id, term_id) SELECT $1, unnest($2::uuid[]);

-- name: DeletePostCategories :exec
DELETE FROM post_categories WHERE post_id = $1;

-- name: AddPostCategories :exec
INSERT INTO post_categories (post_id, term_id) SELECT $1, unnest($2::uuid[]);
