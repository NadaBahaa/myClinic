#!/usr/bin/env bash
# Fail fast if PHP classes referenced in git are missing on disk (common after incomplete deploy).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"

MISSING=0

check_class() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "MISSING: $file"
    MISSING=1
  fi
}

check_class app/Services/SmsMisrService.php
check_class app/Services/AppointmentAuthorizationService.php
check_class app/Services/AppointmentService.php
check_class app/Services/SessionRecordService.php
check_class config/smsmisr.php

if [[ "$MISSING" -ne 0 ]]; then
  echo ""
  echo "Required application files are missing. If you deploy from git, commit and push them first."
  exit 1
fi

composer install --no-dev --optimize-autoloader --no-interaction
php artisan package:discover --ansi

if php artisan migrate:status 2>/dev/null | grep -q Pending; then
  echo ""
  echo "WARNING: Pending migrations detected. Run: php artisan migrate --force"
  echo "Missing tables (e.g. service_material) cause 500 errors on /api/v1/services."
fi

echo "Deploy preflight OK."
