interface CustomImportMeta {
  env?: {
    VITE_API_URL?: string;
    PROD?: boolean;
    DEV?: boolean;
  };
}

const metaEnv = (import.meta as unknown as CustomImportMeta).env;
const envApiUrl = metaEnv?.VITE_API_URL;
// In production on Netlify, relative paths ('') route frontend and backend through the same public domain
// In development, default to 'http://localhost:4000' if VITE_API_URL is not specified
const base = envApiUrl !== undefined
  ? envApiUrl.replace(/\/+$/, '')
  : (metaEnv?.PROD ? '' : 'http://localhost:4000');

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(base + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (err: any) {
    if (err?.name === 'TypeError' && (err?.message?.includes('fetch') || err?.message?.includes('Failed') || err?.message?.includes('NetworkError'))) {
      const locationHint = base ? `at ${base}` : 'on this domain';
      throw new Error(`Cannot connect to backend API ${locationHint}. Please ensure the backend server or Netlify Function is running.`);
    }
    throw err;
  }

  let result: any = null;
  const text = await response.text();
  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      result = { error: text };
    }
  }

  if (!response.ok) {
    throw new Error(result?.error || result?.message || `Request failed (${response.status})`);
  }
  return result as T;
}

export function json(method: string, data: unknown): RequestInit {
  return { method, body: JSON.stringify(data) };
}

export function adminApi<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  return api<T>('/api/admin' + path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
}

