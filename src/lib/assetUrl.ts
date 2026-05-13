import { resolveLaravelPublicOrigin } from './api';

/**
 * Browser-ready URL for Laravel public disk files (`/storage/...`).
 * - Leaves absolute http(s) URLs unchanged.
 * - Prefixes {@link resolveLaravelPublicOrigin} so `/storage` uses the same base as `/api/v1`
 *   (including the production/XAMPP fallback when `VITE_API_BASE_URL` is unset).
 * - Empty origin (Vite dev): returns the path so `/storage` is proxied (see vite.config.ts).
 */
export function resolveStorageAssetUrl(pathOrUrl: string | undefined | null): string {
  if (pathOrUrl == null || pathOrUrl === '') return '';
  const s = String(pathOrUrl).trim();
  if (/^https?:\/\//i.test(s)) return s;

  const path = s.startsWith('/') ? s : `/${s}`;

  const origin = resolveLaravelPublicOrigin();
  if (!origin) return path;

  return `${origin}${path}`;
}
