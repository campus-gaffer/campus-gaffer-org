import { getAuthToken } from './auth';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8081';

// ApiError preserves the HTTP status so callers can branch on it (422/409/5xx).
// Plain Error throws — kept for older call sites — lose that signal.
export class ApiError extends Error {
  status: number;
  code: string | null;
  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // Try to parse the error code emitted by the Go handlers (see §15).
    let code: string | null = null;
    try {
      const parsed = JSON.parse(body) as { error?: string };
      if (parsed && typeof parsed.error === 'string') code = parsed.error;
    } catch { /* not JSON */ }
    throw new ApiError(res.status, code, `${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── User endpoints ──────────────────────────────────────────────────────────

export type Me = {
  id: string;
  username: string;
  email: string;
  username_customized: boolean;
  created_at: string;
  updated_at: string;
};

export function getMe(signal?: AbortSignal): Promise<Me> {
  return apiFetch<Me>('/users/me', { signal });
}

// patchMe updates the authenticated user's display name. The backend
// derives identity from the JWT; sending an `id` field would be silently
// dropped server-side but we don't send it either.
export function patchMe(displayName: string): Promise<Me> {
  return apiFetch<Me>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify({ display_name: displayName }),
  });
}
