-- name: ListPublicProjects :many
SELECT p.id, p.title, p.slug, p.summary, p.role, p.technologies, p.outcome,
       p.project_stage, p.availability, p.publish_at,
       p.published_at, p.featured, p.sort_order, p.hero_media_id,
       p.created_at, p.updated_at,
       COALESCE((SELECT jsonb_agg(jsonb_build_object('id', l.id, 'label', l.label,
                 'url', l.url, 'kind', l.link_kind, 'sortOrder', l.sort_order)
                 ORDER BY l.sort_order, l.label) FROM project_links l
                 WHERE l.project_id = p.id), '[]'::jsonb)::jsonb AS links,
       COALESCE((SELECT array_agg(t.slug ORDER BY t.name) FROM project_tags pt
                 JOIN taxonomy_terms t ON t.id = pt.term_id
                 WHERE pt.project_id = p.id AND t.kind = 'tag'), ARRAY[]::text[])::text[] AS tags,
       COALESCE((SELECT array_agg(t.slug ORDER BY t.name) FROM project_categories pc
                 JOIN taxonomy_terms t ON t.id = pc.term_id
                 WHERE pc.project_id = p.id AND t.kind = 'category'), ARRAY[]::text[])::text[] AS categories
FROM projects p
WHERE p.content_status IN ('scheduled', 'published') AND p.availability = 'public'
  AND p.publish_at <= now()
ORDER BY p.featured DESC, p.sort_order, p.publish_at DESC, p.created_at DESC
LIMIT sqlc.arg(limit_count)::int OFFSET sqlc.arg(offset_count)::int;

-- name: CountPublicProjects :one
SELECT count(*)::bigint FROM projects
WHERE content_status IN ('scheduled', 'published') AND availability = 'public'
  AND publish_at <= now();

-- name: GetPublicProjectBySlug :one
SELECT p.id, p.title, p.slug, p.summary, p.role, p.technologies, p.outcome,
       p.body_html, p.project_stage, p.availability, p.publish_at,
       p.published_at, p.featured, p.hero_media_id, p.created_at, p.updated_at,
       COALESCE((SELECT jsonb_agg(jsonb_build_object('id', l.id, 'label', l.label,
                 'url', l.url, 'kind', l.link_kind, 'sortOrder', l.sort_order)
                 ORDER BY l.sort_order, l.label) FROM project_links l
                 WHERE l.project_id = p.id), '[]'::jsonb)::jsonb AS links,
       COALESCE((SELECT array_agg(t.slug ORDER BY t.name) FROM project_tags pt
                 JOIN taxonomy_terms t ON t.id = pt.term_id
                 WHERE pt.project_id = p.id AND t.kind = 'tag'), ARRAY[]::text[])::text[] AS tags,
       COALESCE((SELECT array_agg(t.slug ORDER BY t.name) FROM project_categories pc
                 JOIN taxonomy_terms t ON t.id = pc.term_id
                 WHERE pc.project_id = p.id AND t.kind = 'category'), ARRAY[]::text[])::text[] AS categories
FROM projects p
WHERE p.slug = $1 AND p.content_status IN ('scheduled', 'published')
  AND p.availability = 'public' AND p.publish_at <= now();

-- name: ListPublicPosts :many
SELECT b.id, b.title, b.slug, b.excerpt, b.publish_at,
       b.published_at, b.reading_time_minutes, b.featured, b.featured_media_id,
       b.created_at, b.updated_at,
       COALESCE((SELECT array_agg(t.slug ORDER BY t.name) FROM post_tags pt
                 JOIN taxonomy_terms t ON t.id = pt.term_id
                 WHERE pt.post_id = b.id AND t.kind = 'tag'), ARRAY[]::text[])::text[] AS tags,
       COALESCE((SELECT array_agg(t.slug ORDER BY t.name) FROM post_categories pc
                 JOIN taxonomy_terms t ON t.id = pc.term_id
                 WHERE pc.post_id = b.id AND t.kind = 'category'), ARRAY[]::text[])::text[] AS categories
FROM blog_posts b
WHERE b.content_status IN ('scheduled', 'published') AND b.publish_at <= now()
ORDER BY b.publish_at DESC, b.created_at DESC
LIMIT sqlc.arg(limit_count)::int OFFSET sqlc.arg(offset_count)::int;

-- name: CountPublicPosts :one
SELECT count(*)::bigint FROM blog_posts
WHERE content_status IN ('scheduled', 'published') AND publish_at <= now();

-- name: GetPublicPostBySlug :one
SELECT b.id, b.title, b.slug, b.excerpt, b.body_html, b.publish_at,
       b.published_at, b.reading_time_minutes, b.featured, b.featured_media_id,
       b.created_at, b.updated_at,
       COALESCE((SELECT array_agg(t.slug ORDER BY t.name) FROM post_tags pt
                 JOIN taxonomy_terms t ON t.id = pt.term_id
                 WHERE pt.post_id = b.id AND t.kind = 'tag'), ARRAY[]::text[])::text[] AS tags,
       COALESCE((SELECT array_agg(t.slug ORDER BY t.name) FROM post_categories pc
                 JOIN taxonomy_terms t ON t.id = pc.term_id
                 WHERE pc.post_id = b.id AND t.kind = 'category'), ARRAY[]::text[])::text[] AS categories
FROM blog_posts b
WHERE b.slug = $1 AND b.content_status IN ('scheduled', 'published') AND b.publish_at <= now();

-- name: GetPublicProfile :one
SELECT display_name, headline, education, current_position, statement,
       bio_html, resume_media_id, updated_at
FROM profile WHERE singleton = true;

-- name: ListPublicContactLinks :many
SELECT id, label, kind, url, icon_key, sort_order
FROM contact_links WHERE is_visible ORDER BY sort_order, label;

-- name: GetRedirect :one
SELECT old_slug, content_type, project_id, post_id
FROM slug_redirects WHERE content_type = $1 AND old_slug = $2;
