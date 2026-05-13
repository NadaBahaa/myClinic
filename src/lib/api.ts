// Core API client with Bearer token auth and 401 handling
// - Dev: leave VITE_API_BASE_URL empty → Vite proxies `/api/*` to Laravel (see vite.config.ts)
// - Production / XAMPP: set VITE_API_BASE_URL to full API URL (no trailing slash)

function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.trim().replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return '/api/v1';
  }
  return 'http://localhost/Beauty%20Clinic%20Management%20App%20(Final-2)/backend/public/api/v1';
}

/**
 * Laravel `public/` URL prefix (no trailing slash): same host as the JSON API without `/api/v1`.
 * Empty string in Vite dev → use relative `/storage/...` and the dev-server `/storage` proxy.
 * Uses the same rules as the JSON API base URL so `/storage` resolves like `/api/v1` when `VITE_API_BASE_URL` is unset.
 */
export function resolveLaravelPublicOrigin(): string {
  const base = resolveApiBaseUrl();
  return base.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '');
}

const BASE_URL = resolveApiBaseUrl();

const TOKEN_KEY = 'beauty_clinic_token';
const inflightGetRequests = new Map<string, Promise<unknown>>();
const recentGetCache = new Map<string, { ts: number; data: unknown }>();
const rateLimitedUntil = new Map<string, number>();
/** Same-path GET coalescing window (avoids burst duplicate calls from remounts / Strict Mode). */
const GET_DEDUPE_WINDOW_MS = 4000;

/** Fired after login, logout, or session restore so listeners can reload auth-dependent data. */
export const AUTH_SESSION_CHANGED = 'auth:session-changed';

export function dispatchAuthSessionChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_CHANGED));
}

/** Clears GET dedupe / rate-limit maps so the next user never sees cached responses. */
export function clearApiResponseCaches(): void {
  inflightGetRequests.clear();
  recentGetCache.clear();
  rateLimitedUntil.clear();
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  clearApiResponseCaches();
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

/** Laravel `JsonResource` responses are shaped as `{ data: T }` (single model, collection, or paginator). */
export function unwrapLaravelData<T>(json: unknown): T {
  if (json !== null && typeof json === 'object' && 'data' in json) {
    const inner = (json as { data: unknown }).data;
    if (inner !== undefined) return inner as T;
  }
  return json as T;
}

function extractApiErrorMessage(payload: any, status: number): string {
  const fallback = `HTTP ${status}`;
  if (!payload || typeof payload !== 'object') return fallback;
  if (typeof payload.message === 'string' && payload.message.trim() !== '') {
    return payload.message;
  }
  if (payload.errors && typeof payload.errors === 'object') {
    const firstError = Object.values(payload.errors).find((v) => Array.isArray(v) && v.length > 0) as string[] | undefined;
    if (firstError?.[0]) return firstError[0];
  }
  return fallback;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const isGetWithoutBody = method === 'GET' && options.body === undefined;
  const requestUrl = `${BASE_URL}${path}`;
  const dedupeKey = `${method}:${requestUrl}`;

  if (isGetWithoutBody) {
    const blockedUntil = rateLimitedUntil.get(dedupeKey) ?? 0;
    if (Date.now() < blockedUntil) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }

    const cached = recentGetCache.get(dedupeKey);
    if (cached && Date.now() - cached.ts < GET_DEDUPE_WINDOW_MS) {
      return cached.data as T;
    }

    const existing = inflightGetRequests.get(dedupeKey);
    if (existing) {
      return existing as Promise<T>;
    }
  }

  const execute = async (): Promise<T> => {
    const maxAttempts = isGetWithoutBody ? 4 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const token = getToken();

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(requestUrl, {
        method: options.method ?? 'GET',
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });

      const contentType = response.headers.get('content-type') ?? '';
      const data = contentType.includes('application/json') ? await response.json().catch(() => null) : null;

      if (response.status === 401) {
        const loginFail = path === '/auth/login' && method === 'POST';
        if (loginFail) {
          throw new Error(extractApiErrorMessage(data, 401));
        }
        removeToken();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error(extractApiErrorMessage(data, 401) || 'Unauthorized');
      }

      if (response.ok) {
        return data as T;
      }

      if (response.status === 429 && isGetWithoutBody && attempt < maxAttempts - 1) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : NaN;
        const waitMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? Math.min(retryAfterSeconds * 1000, 30_000)
          : Math.min(1500 * 2 ** attempt, 10_000);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      if (response.status === 429 && isGetWithoutBody) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : NaN;
        const cooldownMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? retryAfterSeconds * 1000
          : 3000;
        rateLimitedUntil.set(dedupeKey, Date.now() + cooldownMs);
      }

      const message = extractApiErrorMessage(data, response.status);
      throw new Error(message);
    }

    throw new Error('Too many requests. Please wait a moment and try again.');
  };

  if (!isGetWithoutBody) {
    return execute();
  }

  const inFlight = execute()
    .then((result) => {
      recentGetCache.set(dedupeKey, { ts: Date.now(), data: result });
      return result;
    })
    .finally(() => {
      inflightGetRequests.delete(dedupeKey);
    });

  inflightGetRequests.set(dedupeKey, inFlight as Promise<unknown>);
  return inFlight as Promise<T>;
}

/** Download file (e.g. CSV export) with auth; returns blob and suggested filename from Content-Disposition if present. */
export async function apiDownload(path: string): Promise<{ blob: Blob; filename?: string }> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, { headers });

  if (response.status === 401) {
    removeToken();
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new Error('Unauthorized');
  }

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  let filename: string | undefined;
  if (disposition) {
    const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
    if (match) filename = match[1].replace(/['"]/g, '').trim();
  }
  return { blob, filename };
}

/** Multipart file upload (for patient photos) */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    removeToken();
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new Error('Unauthorized');
  }

  const data = await response.json();

  if (!response.ok) throw new Error(extractApiErrorMessage(data, response.status));

  return unwrapLaravelData<T>(data);
}
