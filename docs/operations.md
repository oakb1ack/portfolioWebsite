# Portfolio operations

This deployment is designed for a home server:

`Internet -> Cloudflare Tunnel -> Caddy -> Angular web /api Go service`

PostgreSQL is private to the Compose network. Uploaded media is stored in the host-owned `PORTFOLIO_DATA_ROOT/media` path. The API is the only service that writes media. The admin hostname should be protected by a Cloudflare Access application policy as well as the API's own authenticated, CSRF-protected session. Cloudflare Access is an outer gate; the API must not trust Access headers as authorization.

Caddy returns `404` for `/admin`, `/api/v1/admin`, and `/api/v1/auth` on the
public hostname. Those routes are available only through `ADMIN_HOST`, so the
public hostname cannot bypass the Access policy.

## First setup

1. Install Podman with `podman-compose`, or Docker Engine with the Compose plugin, on the server.
2. Create the configured directories, owned by the deployment operator: `PORTFOLIO_DATA_ROOT/postgres`, `PORTFOLIO_DATA_ROOT/media`, and `PORTFOLIO_BACKUP_ROOT`.
3. Copy `.env.example` to `.env`, replace every placeholder, and use restrictive permissions (`chmod 600 .env`). Use a URL-safe random PostgreSQL password because it is embedded in the internal connection URL.
4. Configure the Cloudflare Tunnel ingress to send both public and admin hostnames to `http://caddy:80` from the tunnel container. Enable a Cloudflare Access application for `ADMIN_HOST`; leave the public host outside that policy.
5. Check the rendered configuration and start it:

```sh
podman compose config
podman compose up -d --build
podman compose ps
```

With Docker, use `docker compose` in place of `podman compose`.

The API health endpoints are `/api/v1/healthz` and `/api/v1/readyz`. Caddy uses the readiness route for its container healthcheck. The API image is the current `backend/Dockerfile` distroless image, so it intentionally has no shell or wget healthcheck; Compose uses Caddy as the external health probe. The web container is built by `deploy/frontend.Dockerfile`.

The `migrate` service runs the checked-in migration using a PostgreSQL advisory transaction lock and a `schema_migrations` marker. API startup waits for that service to complete successfully. Do not run the down migration against production as an operational rollback.

Create the initial administrator once migrations are healthy. Put the password
in a root-owned mode-`0600` file outside the repository, then run:

```sh
podman compose run --rm \
  -v /srv/portfolio-secrets/admin-password:/run/secrets/admin-password:ro \
  -e ADMIN_BOOTSTRAP_EMAIL=you@example.com \
  -e ADMIN_BOOTSTRAP_DISPLAY_NAME='Site administrator' \
  -e ADMIN_BOOTSTRAP_PASSWORD_FILE=/run/secrets/admin-password \
  api admin-bootstrap
```

The command hashes the password with Argon2id and inserts one admin row. It
does not run automatically during API startup and will fail rather than
overwrite an existing account. With Docker, replace `podman compose` with
`docker compose`.

## Routine operation

Use `podman compose logs -f api` or `podman compose logs -f caddy` for diagnosis. Deploy a new version with `podman compose build --pull api web && podman compose up -d api web caddy cloudflared`. Keep the host and container images patched, and rotate the tunnel token and application secrets if exposure is suspected.

## Backups

Run the host-side job at least daily after setting `PORTFOLIO_BACKUP_ROOT`:

```sh
scripts/backup-portfolio.sh
```

Each backup contains a custom-format PostgreSQL dump, a gzip media archive, and SHA-256 checksums. Local backups older than 30 days are removed. To send the same backup to an optional restic repository, set `RESTIC_REPOSITORY` and `RESTIC_PASSWORD_FILE` in the environment or `.env`, then configure a restic retention policy separately. Test the repository with `restic snapshots` and periodically perform a restore drill.

The backup job reads `.env`, so keep that file private. It automatically uses
Podman when available and falls back to Docker. Use
`scripts/backup-portfolio.sh --dry-run` to validate configuration without
writing a backup.

## Restore and verification

Stop writes before restoring. Choose a single backup directory and validate it first:

```sh
scripts/restore-portfolio.sh --backup /srv/portfolio-backups/20260727T120000Z --dry-run
scripts/restore-portfolio.sh --backup /srv/portfolio-backups/20260727T120000Z
```

The non-dry run requires typing `RESTORE`; automation must pass `--yes` explicitly. It recreates only the configured portfolio database and the configured media directory, reruns the forward migrations, then starts the stack. Never pass a broad path such as `/`, `/srv`, or the repository root as a data root. Afterward verify `docker compose ps`, `curl -fsS https://$PUBLIC_HOST/api/v1/readyz`, public project/blog content, the Cloudflare Access challenge and API admin login, and a representative uploaded file. Record the restore date and any missing content.

## Security and resource notes

The database has no published host port. Caddy is the only HTTP entry point, and the tunnel makes outbound connections so router ports are not required. Containers use pinned image versions, `no-new-privileges`, read-only roots where practical, and a small writable media mount for the API. Keep the home server's disk usage monitored; PostgreSQL, media, and local backups are separate paths but share the host's storage.
