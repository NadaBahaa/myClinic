# AWS deployment

## The MIME error you saw

```
Failed to load module script: Expected a JavaScript module script but the server
responded with a MIME type of "application/octet-stream"
```

This happens when:

1. **Production build was not deployed** — the browser loads `/src/main.tsx` (dev source) instead of `/assets/index-*.js` from `npm run build`.
2. **Wrong Content-Type** — S3 or Apache serves `.js` as `application/octet-stream` instead of `application/javascript`.

The Chrome messages about `runtime.lastError` / `message channel closed` come from **browser extensions**, not this app.

---

## Recommended: single EC2 server (Apache/nginx + Laravel)

Document root must be **`backend/public`**, not the project root or `src/`.

```bash
# From project root
npm run build:aws

cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

Point Apache/nginx to `backend/public`. See `deploy/aws/nginx.conf` for nginx.

`backend/public/.htaccess` already sets JS/CSS MIME types and SPA routing.

---

## Split deploy: S3 + CloudFront (frontend) + ALB (API)

### Frontend

```bash
npm run build
# Set API URL to your backend domain:
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1 npm run build

./deploy/aws/s3-sync.sh your-frontend-bucket E1234567890
```

Enable **SPA fallback** on CloudFront/S3: all 404 → `index.html`.

### Backend

Deploy Laravel to EC2/ECS with `APP_URL=https://api.yourdomain.com`. CORS must allow your CloudFront origin if cookies/tokens cross-origin.

---

## Environment variables (production build)

| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `/api/v1` | Same server (default in `build:aws`) |
| `VITE_API_BASE_URL` | `https://api.example.com/api/v1` | Separate API host |
| `VITE_BASE_PATH` | `/` | Subpath deploy e.g. `/clinic/` |

---

## Verify after deploy

1. View page source — script must be `/assets/index-*.js`, **not** `/src/main.tsx`.
2. Network tab — JS files show `Content-Type: application/javascript`.
3. API calls go to your real domain, not `localhost`.
