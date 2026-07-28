#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'
usage() { printf 'Usage: %s [--dry-run]\n' "$0"; }
dry_run=0
if [[ "${1:-}" == "--dry-run" ]]; then dry_run=1; elif [[ $# -ne 0 ]]; then usage >&2; exit 64; fi
repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
# shellcheck source=/dev/null
if [[ -f "$repo_root/.env" ]]; then set -a; source "$repo_root/.env"; set +a; fi
: "${PORTFOLIO_DATA_ROOT:?PORTFOLIO_DATA_ROOT is required}"
: "${PORTFOLIO_BACKUP_ROOT:?PORTFOLIO_BACKUP_ROOT is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
data_root=$(realpath -m -- "$PORTFOLIO_DATA_ROOT")
backup_root=$(realpath -m -- "$PORTFOLIO_BACKUP_ROOT")
media_root="$data_root/media"
[[ "$data_root" != / && "$backup_root" != / ]] || { echo 'Refusing root directory.' >&2; exit 1; }
if command -v podman >/dev/null 2>&1; then
  compose=(podman compose --project-directory "$repo_root" -f "$repo_root/compose.yml")
elif command -v docker >/dev/null 2>&1; then
  compose=(docker compose --project-directory "$repo_root" -f "$repo_root/compose.yml")
else
  echo 'Podman or Docker with Compose support is required.' >&2
  exit 69
fi
stamp=$(date -u +%Y%m%dT%H%M%SZ)
destination="$backup_root/$stamp"
if (( dry_run )); then
  printf 'Would create %s, dump %s, archive %s, and optionally run restic.\n' "$destination" "$POSTGRES_DB" "$media_root"
  exit 0
fi
mkdir -p -- "$destination"
chmod 700 -- "$destination"
trap 'rm -f -- "$destination/database.sql" "$destination/media.tar.gz" "$destination/SHA256SUMS"' EXIT
"${compose[@]}" exec -T db pg_dump --format=custom --no-owner --no-privileges --dbname="$POSTGRES_DB" > "$destination/database.sql"
tar --directory="$media_root" --create --gzip --file="$destination/media.tar.gz" .
(cd "$destination" && sha256sum database.sql media.tar.gz > SHA256SUMS)
if [[ -n "${RESTIC_REPOSITORY:-}" ]]; then
  : "${RESTIC_PASSWORD_FILE:?RESTIC_PASSWORD_FILE is required when RESTIC_REPOSITORY is set}"
  restic backup --tag portfolio -- "$destination"
fi
find "$backup_root" -mindepth 1 -maxdepth 1 -type d -regextype posix-extended -regex '.*/[0-9]{8}T[0-9]{6}Z' -mtime +30 -exec rm -rf -- {} +
trap - EXIT
printf 'Backup complete: %s\n' "$destination"
