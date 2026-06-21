#!/usr/bin/env bash
# Sync Vite dist/ to S3 with correct Content-Type for ES modules.
# Usage: ./deploy/aws/s3-sync.sh my-bucket-name [cloudfront-distribution-id]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BUCKET="${1:?S3 bucket name required}"
DIST_ID="${2:-}"

if [[ ! -f "$ROOT/dist/index.html" ]]; then
  echo "Run: npm run build:aws (or npm run build) first"
  exit 1
fi

echo "Syncing $ROOT/dist → s3://$BUCKET/"

aws s3 sync "$ROOT/dist/" "s3://$BUCKET/" \
  --delete \
  --exclude ".DS_Store" \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" \
  --exclude ".htaccess"

aws s3 cp "$ROOT/dist/index.html" "s3://$BUCKET/index.html" \
  --content-type "text/html; charset=utf-8" \
  --cache-control "no-cache"

# JS/CSS with explicit MIME (S3 default can be application/octet-stream)
while IFS= read -r -d '' file; do
  rel="${file#$ROOT/dist/}"
  case "$file" in
    *.js|*.mjs)
      ct="application/javascript"
      ;;
    *.css)
      ct="text/css"
      ;;
    *.wasm)
      ct="application/wasm"
      ;;
    *)
      continue
      ;;
  esac
  aws s3 cp "$file" "s3://$BUCKET/$rel" \
    --content-type "$ct" \
    --cache-control "public,max-age=31536000,immutable"
done < <(find "$ROOT/dist/assets" -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.css' -o -name '*.wasm' \) -print0 2>/dev/null || true)

if [[ -n "$DIST_ID" ]]; then
  echo "Invalidating CloudFront $DIST_ID …"
  aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*"
fi

echo "Done."
