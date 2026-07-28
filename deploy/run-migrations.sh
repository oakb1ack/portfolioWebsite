#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"

# Keep the lock, marker creation, migration, and marker insert in one psql
# transaction. A failed migration rolls back and can be retried safely.
exec psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('portfolio:migrations', 0));
CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
SELECT NOT EXISTS (
  SELECT 1 FROM schema_migrations WHERE version = '001_portfolio_foundation'
) AS needs_migration \gset
\if :needs_migration
\i /migrations/001_portfolio_foundation.up.sql
INSERT INTO schema_migrations (version) VALUES ('001_portfolio_foundation');
\endif
COMMIT;
SQL
