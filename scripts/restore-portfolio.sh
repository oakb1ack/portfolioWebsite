#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'
usage() { printf 'Usage: %s --backup DIR [--dry-run] [--yes]\n' "$0"; }
backup=''; dry_run=0; yes=0
while (($#)); do
  case "$1" in
    --backup) (($# >= 2)) || { usage >&2; exit 64; }; backup=$2; shift 2 ;;
    --dry-run) dry_run=1; shift ;;
    --yes) yes=1; shift ;;
    *) usage >&2; exit 64 ;;
  esac
done
[[ -n "$backup" ]] || { usage >&2; exit 64; }
repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
# shellcheck source=/dev/null
if [[ -f "$repo_root/.env" ]]; then set -a; source "$repo_root/.env"; set +a; fi
: "${PORTFOLIO_DATA_ROOT:?PORTFOLIO_DATA_ROOT is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
backup=$(realpath -m -- "$backup")
data_root=$(realpath -m -- "$PORTFOLIO_DATA_ROOT")
media_root="$data_root/media"
db_dump="$backup/database.sql"; media_archive="$backup/media.tar.gz"
[[ -d "$backup" && -f "$db_dump" && -f "$media_archive" && -f "$backup/SHA256SUMS" ]] || { echo 'Invalid backup directory.' >&2; exit 1; }
[[ "$data_root" != / && "$backup" != / ]] || { echo 'Refusing root directory.' >&2; exit 1; }
(cd "$backup" && sha256sum --check SHA256SUMS)
if command -v podman >/dev/null 2>&1; then
  compose=(podman compose --project-directory "$repo_root" -f "$repo_root/compose.yml")
elif command -v docker >/dev/null 2>&1; then
  compose=(docker compose --project-directory "$repo_root" -f "$repo_root/compose.yml")
else
  echo 'Podman or Docker with Compose support is required.' >&2
  exit 69
fi
if (( dry_run )); then printf 'Dry run: backup is valid; would replace database %s and media under %s.\n' "$POSTGRES_DB" "$media_root"; exit 0; fi
if (( ! yes )); then
  printf 'This replaces the portfolio database and media. Type RESTORE to continue: '
  read -r confirmation
  [[ "$confirmation" == RESTORE ]] || { echo 'Restore cancelled.'; exit 0; }
fi
"${compose[@]}" stop api web caddy cloudflared >/dev/null 2>&1 || true
"${compose[@]}" up -d db
"${compose[@]}" exec -T db dropdb --if-exists -U "$POSTGRES_USER" "$POSTGRES_DB"
"${compose[@]}" exec -T db createdb -U "$POSTGRES_USER" "$POSTGRES_DB"
"${compose[@]}" exec -T db pg_restore --exit-on-error --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$db_dump"
mkdir -p -- "$media_root"
find "$media_root" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
tar --directory="$media_root" --extract --gzip --file="$media_archive"
"${compose[@]}" run --rm migrate
"${compose[@]}" up -d api web caddy cloudflared
"${compose[@]}" ps
printf 'Restore complete. Verify the public site, /api/v1/readyz, admin login, and representative media.\n'
