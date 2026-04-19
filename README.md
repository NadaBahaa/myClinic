# Beauty Clinic Management App

## Local development

1. Copy `backend/.env.example` to `backend/.env`, configure MySQL, then run `php artisan migrate` and `php artisan db:seed` in `backend/`.
2. From the project root, run **`npm run dev:all`** — starts Laravel on `http://127.0.0.1:8001` and the Vite dev server. Open the URL Vite prints (e.g. `http://localhost:5173`).
3. Leave root `.env` with **`VITE_API_BASE_URL` empty** so the dev server proxies `/api/*` to Laravel (avoids `ERR_CONNECTION_REFUSED` when the API is not running separately).

Use XAMPP instead of `artisan serve`? Set `VITE_API_BASE_URL` in `.env` to your `.../backend/public/api/v1` URL and run `npm run dev` only.
