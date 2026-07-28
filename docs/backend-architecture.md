# Backend architecture

## Goal

The backend is a long-lived content platform for the portfolio, not a
frontend-specific data shim. The first delivery supports projects, blog posts,
taxonomy, profile data, contact links, media, and one administrator. Research
and papers are intentionally deferred until that product surface is designed.

## Runtime topology

```text
Browser
  |
Cloudflare (public site; Access policy on admin hostname)
  |
Cloudflare Tunnel (outbound connection from the home server)
  |
Caddy
  |-- /api/* --> Go API
  `-- /*     --> Angular static site

Go API --> PostgreSQL
Go API --> application-owned media directory
```

The browser uses the same origin for Angular and `/api`, avoiding a separate
CORS and cross-site cookie boundary. PostgreSQL and media are not exposed to
the internet.

## Package boundaries

- `cmd/api`: process startup, dependency wiring, graceful shutdown, and the
  container-native health-check command.
- `internal/config`: validated environment configuration.
- `internal/httpapi`: versioned routes, transport DTOs, middleware, errors,
  caching, rate limiting, and authentication enforcement.
- `internal/auth`: Argon2id passwords, opaque hashed sessions, CSRF primitives,
  and persistence-neutral authentication contracts.
- `internal/content`: lifecycle, slug, validation, Markdown, and content DTOs
  independent of PostgreSQL and HTTP.
- `internal/media`: atomic filesystem storage with server-generated keys,
  content hashing, MIME checks, and path traversal protection.
- `internal/database`: PostgreSQL pool and sqlc adapter wiring.
- `db/query` and `db/generated`: reviewed SQL and generated pgx/v5 access code.
- `migrations`: forward and rollback database changes.

Business rules belong in domain packages and PostgreSQL constraints. HTTP
handlers must not become a second, divergent source of truth.

## Content rules

Projects and blog posts have an editorial lifecycle:

- `draft`: admin-only and not eligible for public reads.
- `scheduled`: public once `publish_at <= now()`; no background worker is
  required.
- `published`: immediately public.
- `archived`: admin-only.

Project stage (`current`, `completed`, or `archived`) is separate from
editorial visibility. Project availability (`public` or `private`) describes
the underlying work, not whether the portfolio page is published.

Slugs may change while a record is private. Once a record is publicly
eligible, its slug is immutable. Old-slug redirect storage remains available
for a future explicit migration workflow.

Markdown source is returned only to authenticated admin endpoints. The Go API
stores canonical sanitized HTML for public responses.

Updates use the prior `updated_at` value as an optimistic concurrency token.
A stale write receives `409 Conflict` instead of silently overwriting another
edit. Full revision history is intentionally deferred.

## Public API shape

All routes are under `/api/v1`.

- `GET /projects`
- `GET /projects/{slug}`
- `GET /posts`
- `GET /posts/{slug}`
- `GET /profile`
- `GET /contact-links`
- `GET /media/{id}`
- `GET /healthz`
- `GET /readyz`

Public list responses are paginated. Taxonomy is included in each content
response; query-level taxonomy filtering is reserved for the next frontend
integration slice. Draft Markdown, internal storage keys, admin IDs, and
lifecycle metadata are not public response fields.

## Admin API shape

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/session`
- `GET /auth/csrf`
- CRUD under `/admin/projects`, `/admin/posts`, `/admin/taxonomy`,
  `/admin/profile`, `/admin/contact-links`, and `/admin/media`

All admin mutations require both an active PostgreSQL-backed session and a
session-bound CSRF token. Login attempts are rate-limited. Session cookies are
`Secure`, `HttpOnly`, `SameSite=Lax`, and use the `__Host-` prefix in
production. Only token hashes and CSRF token hashes are stored.

## Media

Clients upload files through the admin API. The API:

1. enforces request and media-specific size limits;
2. detects and allow-lists the content type;
3. writes to a staging file while calculating SHA-256;
4. validates image metadata when supported;
5. atomically renames the file to a server-generated key; and
6. stores only the key and metadata in PostgreSQL.

No arbitrary filesystem path is accepted from a client. Initial storage keeps
original files only; derived responsive variants can be added behind the same
media ID later.

## Production gates

Before internet-facing deployment:

- all migrations apply and roll back against a disposable PostgreSQL instance;
- API unit, race, and integration tests pass;
- the Angular production build and container images succeed;
- Cloudflare Access protects the admin hostname;
- database and media backups run automatically to local and offsite targets;
- a restore is performed and verified from the offsite copy;
- secrets are provided outside source control; and
- health/readiness checks and structured logs are observable.
