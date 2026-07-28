-- name: ListAdminProjects :many
SELECT * FROM projects ORDER BY updated_at DESC LIMIT $1 OFFSET $2;

-- name: CountAdminProjects :one
SELECT count(*)::bigint FROM projects;

-- name: GetAdminProject :one
SELECT * FROM projects WHERE id = $1;

-- name: ListProjectTags :many
SELECT t.* FROM taxonomy_terms t JOIN project_tags pt ON pt.term_id = t.id
WHERE pt.project_id = $1 ORDER BY t.name;

-- name: ListProjectCategories :many
SELECT t.* FROM taxonomy_terms t JOIN project_categories pc ON pc.term_id = t.id
WHERE pc.project_id = $1 ORDER BY t.name;

-- name: CreateProject :one
INSERT INTO projects (created_by, updated_by, title, slug, summary, body_markdown, body_html,
                      role, technologies, outcome, content_status, project_stage, availability,
                      publish_at, featured, sort_order, hero_media_id)
VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
RETURNING *;

-- name: UpdateProject :one
UPDATE projects
SET updated_by = $2, title = $3, slug = $4, summary = $5, body_markdown = $6,
    body_html = $7, role = $8, technologies = $9, outcome = $10,
    content_status = $11, project_stage = $12, availability = $13,
    publish_at = $14, featured = $15, sort_order = $16, hero_media_id = $17,
    published_at = CASE WHEN $11::content_status = 'published' AND published_at IS NULL THEN now()
                        WHEN $11::content_status IN ('draft', 'scheduled') THEN NULL ELSE published_at END,
    archived_at = CASE WHEN $11::content_status = 'archived' THEN COALESCE(archived_at, now()) ELSE NULL END
WHERE id = $1 AND updated_at = $18
RETURNING *;

-- name: ArchiveProject :one
UPDATE projects SET content_status = 'archived', publish_at = NULL,
  archived_at = COALESCE(archived_at, now()), updated_by = $2
WHERE id = $1 AND updated_at = $3 RETURNING *;

-- name: DeleteProject :execrows
DELETE FROM projects WHERE id = $1;

-- name: DeleteProjectTags :exec
DELETE FROM project_tags WHERE project_id = $1;

-- name: AddProjectTags :exec
INSERT INTO project_tags (project_id, term_id)
SELECT $1, unnest($2::uuid[]);

-- name: DeleteProjectCategories :exec
DELETE FROM project_categories WHERE project_id = $1;

-- name: AddProjectCategories :exec
INSERT INTO project_categories (project_id, term_id)
SELECT $1, unnest($2::uuid[]);

-- name: ListProjectLinks :many
SELECT * FROM project_links WHERE project_id = $1 ORDER BY sort_order, label;

-- name: CreateProjectLink :one
INSERT INTO project_links (project_id, label, url, link_kind, sort_order)
VALUES ($1, $2, $3, $4, $5) RETURNING *;

-- name: UpdateProjectLink :one
UPDATE project_links SET label = $2, url = $3, link_kind = $4, sort_order = $5
WHERE id = $1 AND updated_at = $6 RETURNING *;

-- name: DeleteProjectLink :exec
DELETE FROM project_links WHERE id = $1 AND updated_at = $2;
