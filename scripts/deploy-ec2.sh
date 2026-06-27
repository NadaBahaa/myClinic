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

echo "Syncing backend PHP…"
"${RSYNC[@]}" "$ROOT/backend/app/Services/RolePermissionService.php" "$HOST:$REMOTE/backend/app/Services/"
"${RSYNC[@]}" "$ROOT/backend/app/Console/Commands/SyncRolePermissionsCommand.php" "$HOST:$REMOTE/backend/app/Console/Commands/"
"${RSYNC[@]}" \
  "$ROOT/backend/app/Http/Controllers/Api/V1/AuthController.php" \
  "$ROOT/backend/app/Http/Controllers/Api/V1/UserController.php" \
  "$ROOT/backend/app/Http/Controllers/Api/V1/SuperAdminController.php" \
  "$HOST:$REMOTE/backend/app/Http/Controllers/Api/V1/"

echo "Syncing SPA dist…"
"${RSYNC[@]}" --delete "$ROOT/dist/" "$HOST:$REMOTE/dist/"

echo "Running remote post-deploy…"
"${SSH[@]}" "cd $REMOTE/backend && composer dump-autoload -o && php artisan permissions:sync-role-defaults && php artisan config:cache && php artisan route:cache"

echo "Deploy complete. Hard-refresh browser (Ctrl+Shift+R)."
