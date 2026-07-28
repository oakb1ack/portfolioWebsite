-- name: CreateMediaAsset :one
INSERT INTO media_assets (uploaded_by, storage_key, original_filename, mime_type, byte_size,
                          sha256, width, height, alt_text)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;

-- name: GetMediaAsset :one
SELECT * FROM media_assets WHERE id = $1;

-- name: GetPublicMediaAsset :one
SELECT m.* FROM media_assets m
WHERE m.id = $1 AND (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.hero_media_id = m.id
      AND p.content_status IN ('scheduled', 'published')
      AND p.availability = 'public' AND p.publish_at <= now()
  )
  OR EXISTS (
    SELECT 1 FROM blog_posts b
    WHERE b.featured_media_id = m.id
      AND b.content_status IN ('scheduled', 'published')
      AND b.publish_at <= now()
  )
  OR EXISTS (SELECT 1 FROM profile p WHERE p.resume_media_id = m.id)
);

-- name: ListMediaAssets :many
SELECT * FROM media_assets ORDER BY created_at DESC LIMIT $1 OFFSET $2;

-- name: CountMediaAssets :one
SELECT count(*)::bigint FROM media_assets;

-- name: UpdateMediaAsset :one
UPDATE media_assets SET original_filename = $2, mime_type = $3, alt_text = $4,
  width = $5, height = $6
WHERE id = $1 AND updated_at = $7
RETURNING *;

-- name: DeleteMediaAsset :execrows
DELETE FROM media_assets m
WHERE m.id = $1
  AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.hero_media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM blog_posts b WHERE b.featured_media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM profile p WHERE p.resume_media_id = m.id);
