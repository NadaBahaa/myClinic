#!/usr/bin/env bash
# Test MySQL connectivity using backend/.env (run before migrate on AWS).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "ERROR: backend/.env not found. Copy .env.aws.example → .env and set DB_* values."
  exit 1
fi

# shellcheck disable=SC1091
source <(grep -E '^DB_(HOST|PORT|DATABASE|USERNAME|PASSWORD)=' .env | sed 's/^/export /')

: "${DB_HOST:?Set DB_HOST in .env}"
: "${DB_DATABASE:?Set DB_DATABASE in .env}"
: "${DB_USERNAME:?Set DB_USERNAME in .env}"
DB_PORT="${DB_PORT:-3306}"

echo "Testing MySQL: ${DB_USERNAME}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}"

if command -v mysql &>/dev/null; then
  if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" ${DB_PASSWORD:+-p"$DB_PASSWORD"} -e "SELECT 1" "$DB_DATABASE" 2>/dev/null; then
    echo "MySQL connection OK (mysql client)."
    exit 0
  fi
fi

php artisan db:show 2>/dev/null && exit 0

php -r "
try {
    \$host = getenv('DB_HOST') ?: '${DB_HOST}';
    \$port = getenv('DB_PORT') ?: '${DB_PORT}';
    \$db   = getenv('DB_DATABASE') ?: '${DB_DATABASE}';
    \$user = getenv('DB_USERNAME') ?: '${DB_USERNAME}';
    \$pass = getenv('DB_PASSWORD') ?: '${DB_PASSWORD}';
    new PDO(\"mysql:host=\$host;port=\$port;dbname=\$db\", \$user, \$pass, [PDO::ATTR_TIMEOUT => 5]);
    echo \"MySQL connection OK (PDO).\n\";
    exit(0);
} catch (Throwable \$e) {
    fwrite(STDERR, \"MySQL connection FAILED: \" . \$e->getMessage() . \"\n\");
    exit(1);
}
"
