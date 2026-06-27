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

**This EC2 host uses split roots:** SPA at `/var/www/myklinic/dist`, API at `/var/www/myklinic/backend/public`. After `npm run build`, copy `dist/` to the server:

```bash
./scripts/deploy-ec2.sh
# or manually rsync dist/ → /var/www/myklinic/dist/ (sudo + www-data)
```

After super-admin changes role tab visibility, run on the server:

```bash
cd /var/www/myklinic/backend
sudo php artisan permissions:sync-role-defaults
```

This applies saved role defaults to all users (fixes stale `perm_*` columns).

`backend/public/.htaccess` already sets JS/CSS MIME types and SPA routing.

---

## Database (fix `Connection refused`)

That error means Laravel cannot reach MySQL. Your log shows database **`laravel`** — that is the default from `.env.example`; production must use real credentials.

### 1. Create `backend/.env` on the server

```bash
cd backend
cp .env.aws.example .env
php artisan key:generate
nano .env   # set DB_* and APP_URL
```

### 2. Option A — MySQL on the same EC2 box

```bash
sudo apt update && sudo apt install -y mysql-server
sudo systemctl enable mysql && sudo systemctl start mysql

sudo mysql <<'SQL'
CREATE DATABASE beauty_clinic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'clinic'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON beauty_clinic.* TO 'clinic'@'localhost';
FLUSH PRIVILEGES;
SQL
```

In `.env`:

```env
DB_HOST=127.0.0.1
DB_DATABASE=beauty_clinic
DB_USERNAME=clinic
DB_PASSWORD=YOUR_STRONG_PASSWORD
```

### 3. Option B — Amazon RDS (recommended)

1. Create RDS MySQL instance (database name: `beauty_clinic`).
2. Security group: allow **inbound TCP 3306** from your **EC2 security group** (not `0.0.0.0/0`).
3. In `.env`:

```env
DB_HOST=your-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
DB_DATABASE=beauty_clinic
DB_USERNAME=admin
DB_PASSWORD=your-rds-password
```

### 4. Test before migrate

```bash
cd backend
chmod +x scripts/check-database.sh
./scripts/check-database.sh
```

### 5. Deploy commands (order matters)

```bash
php artisan config:clear          # clear old cached config first
php artisan migrate --force       # only after DB test passes
php artisan config:cache
php artisan route:cache
```

If you already ran `config:cache` with wrong DB settings, run **`config:clear`** after fixing `.env`, then cache again.

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
