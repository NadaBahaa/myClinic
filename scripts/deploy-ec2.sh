#!/usr/bin/env bash
# Deploy backend + SPA to EC2 (nginx: API=backend/public, SPA=/var/www/myklinic/dist)
set -euo pipefail

KEY="${MYKLINIC_SSH_KEY:-$HOME/Documents/myklinic-key.pem}"
HOST="${MYKLINIC_HOST:-ubuntu@ec2-13-53-177-111.eu-north-1.compute.amazonaws.com}"
REMOTE="${MYKLINIC_REMOTE:-/var/www/myklinic}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST")
RSYNC=(rsync -avz -e "ssh -i $KEY -o StrictHostKeyChecking=no")

echo "Building frontend…"
(cd "$ROOT" && npm run build:aws)

echo "Syncing backend (checkout, materials, queue, policies)…"
"${RSYNC[@]}" \
  "$ROOT/backend/app/Services/AppointmentCheckoutService.php" \
  "$ROOT/backend/app/Services/MaterialSpreadsheetService.php" \
  "$ROOT/backend/app/Services/SessionRecordService.php" \
  "$ROOT/backend/app/Services/AppointmentService.php" \
  "$ROOT/backend/app/Services/RolePermissionService.php" \
  "$HOST:$REMOTE/backend/app/Services/"

"${RSYNC[@]}" \
  "$ROOT/backend/app/Jobs/" \
  "$HOST:$REMOTE/backend/app/Jobs/"

"${RSYNC[@]}" \
  "$ROOT/backend/app/Policies/MaterialOrToolPolicy.php" \
  "$ROOT/backend/app/Policies/AppointmentPolicy.php" \
  "$HOST:$REMOTE/backend/app/Policies/"

"${RSYNC[@]}" \
  "$ROOT/backend/app/Http/Controllers/Api/V1/AppointmentController.php" \
  "$ROOT/backend/app/Http/Controllers/Api/V1/MaterialOrToolController.php" \
  "$ROOT/backend/app/Http/Controllers/Api/V1/NotificationRecordController.php" \
  "$ROOT/backend/app/Http/Controllers/Api/V1/AuthController.php" \
  "$ROOT/backend/app/Http/Controllers/Api/V1/UserController.php" \
  "$ROOT/backend/app/Http/Controllers/Api/V1/SuperAdminController.php" \
  "$HOST:$REMOTE/backend/app/Http/Controllers/Api/V1/"

"${RSYNC[@]}" \
  "$ROOT/backend/app/Http/Resources/AppointmentResource.php" \
  "$HOST:$REMOTE/backend/app/Http/Resources/"

"${RSYNC[@]}" \
  "$ROOT/backend/app/Providers/AuthServiceProvider.php" \
  "$HOST:$REMOTE/backend/app/Providers/"

"${RSYNC[@]}" \
  "$ROOT/backend/routes/api.php" \
  "$HOST:$REMOTE/backend/routes/"

"${RSYNC[@]}" \
  "$ROOT/backend/database/migrations/2026_06_06_000001_create_jobs_tables.php" \
  "$HOST:$REMOTE/backend/database/migrations/"

"${RSYNC[@]}" \
  "$ROOT/backend/composer.json" \
  "$ROOT/backend/composer.lock" \
  "$HOST:$REMOTE/backend/"

echo "Syncing SPA dist…"
"${RSYNC[@]}" --delete "$ROOT/dist/" "$HOST:$REMOTE/dist/"

echo "Running remote post-deploy…"
"${SSH[@]}" bash -s <<REMOTE_SCRIPT
set -e
cd $REMOTE/backend
sudo composer install --no-dev --optimize-autoloader --no-interaction
sudo php artisan migrate --force
sudo php artisan permissions:sync-role-defaults
sudo php artisan config:cache
sudo php artisan route:cache
sudo chown -R www-data:www-data $REMOTE/dist
REMOTE_SCRIPT

echo "Deploy complete. Hard-refresh browser (Cmd+Shift+R)."
