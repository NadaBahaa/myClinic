#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/../backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [[ -f "$ROOT/.env" ]]; then
  # shellcheck disable=SC1091
  source <(grep -E '^(DB_HOST|DB_PORT|DB_DATABASE|DB_USERNAME|DB_PASSWORD)=' "$ROOT/.env" | sed 's/^/export /')
fi

: "${DB_HOST:=127.0.0.1}"
: "${DB_PORT:=3306}"
: "${DB_DATABASE:?Set DB_DATABASE in backend/.env}"
: "${DB_USERNAME:?Set DB_USERNAME in backend/.env}"
: "${DB_PASSWORD:=}"

OUTPUT="$BACKUP_DIR/${DB_DATABASE}-${TIMESTAMP}.sql.gz"

echo "Backing up ${DB_DATABASE} to ${OUTPUT}..."
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" ${DB_PASSWORD:+-p"$DB_PASSWORD"} \
  --single-transaction --routines --triggers "$DB_DATABASE" | gzip > "$OUTPUT"

UPLOADS="$BACKUP_DIR/uploads-${TIMESTAMP}.tar.gz"
if [[ -d "$ROOT/storage/app/public" ]]; then
  echo "Archiving uploads to ${UPLOADS}..."
  tar -czf "$UPLOADS" -C "$ROOT/storage/app" public
fi

echo "Done."
