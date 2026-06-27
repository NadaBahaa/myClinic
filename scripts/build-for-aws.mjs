#!/usr/bin/env node
/**
 * Production build for AWS / Apache (single-server deploy).
 * 1. Runs Vite with same-origin API URL (/api/v1)
 * 2. Copies dist → backend/public (index.html + assets/)
 * 3. Copies MIME + SPA .htaccess rules (already in backend/public/.htaccess)
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const dist = join(root, 'dist')
const publicDir = join(root, 'backend/public')
const assetsDir = join(publicDir, 'assets')

const env = {
  ...process.env,
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || '/api/v1',
  VITE_BASE_PATH: process.env.VITE_BASE_PATH || '/',
}

console.log('Building frontend (VITE_API_BASE_URL=%s)', env.VITE_API_BASE_URL)
execSync('npx vite build', { cwd: root, stdio: 'inherit', env })

if (!existsSync(join(dist, 'index.html'))) {
  console.error('Build failed: dist/index.html not found. Run from project root.')
  process.exit(1)
}

console.log('Copying dist → backend/public …')
cpSync(join(dist, 'index.html'), join(publicDir, 'index.html'))

if (existsSync(assetsDir)) {
  rmSync(assetsDir, { recursive: true, force: true })
}
mkdirSync(assetsDir, { recursive: true })

if (existsSync(join(dist, 'assets'))) {
  cpSync(join(dist, 'assets'), assetsDir, { recursive: true })
}

cpSync(join(root, 'deploy/aws/static.htaccess'), join(dist, '.htaccess'))

// Some EC2 nginx configs serve SPA from /var/www/myklinic/dist (API stays in backend/public).
const serverDist = join(root, 'dist')
console.log('SPA also ready at project dist/ (copy to /var/www/myklinic/dist on EC2 if nginx uses it)')

console.log('Done. Document root: backend/public (or dist/ for split nginx setup)')
console.log('  - SPA:  index.html')
console.log('  - API:  /api/v1/* → Laravel index.php')
console.log('Set APP_URL and run: cd backend && php artisan config:cache')
