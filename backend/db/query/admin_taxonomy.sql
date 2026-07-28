-- name: ListTaxonomyTerms :many
SELECT * FROM taxonomy_terms WHERE kind = $1 ORDER BY name LIMIT $2 OFFSET $3;

-- name: CountTaxonomyTerms :one
SELECT count(*)::bigint FROM taxonomy_terms WHERE kind = $1;

-- name: GetTaxonomyTerm :one
SELECT * FROM taxonomy_terms WHERE id = $1;

-- name: CreateTaxonomyTerm :one
INSERT INTO taxonomy_terms (kind, name, slug, description)
VALUES ($1, $2, $3, $4) RETURNING *;

-- name: UpdateTaxonomyTerm :one
UPDATE taxonomy_terms SET name = $2, slug = $3, description = $4
WHERE id = $1 AND updated_at = $5 RETURNING *;

-- name: DeleteTaxonomyTerm :execrows
DELETE FROM taxonomy_terms WHERE id = $1;
