export const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * Lightweight API client wrapping fetch with Crate conventions:
 *  - Prefixes VITE_API_URL (empty in dev — Vite proxy forwards to api/)
 *  - credentials: 'include' on every request (required for session cookies)
 *  - JSON Content-Type on mutating requests
 *  - Throws on non-2xx with a structured error message
 */
async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const method = (options.method ?? 'GET').toUpperCase();

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    method,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const { error, details } = data as { error?: string; details?: unknown };
    // `details` is usually a string, but some endpoints return a structured
    // object (e.g. a zod `flatten()`); render that as JSON rather than the
    // useless "[object Object]".
    const detailStr =
      details == null
        ? undefined
        : typeof details === 'string'
          ? details
          : JSON.stringify(details);
    const message = detailStr
      ? `${error ?? 'Error'}: ${detailStr}`
      : (error ?? `Request failed (${res.status})`);
    throw new Error(message);
  }

  // 204 No Content — return undefined
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

export const apiFetch = {
  get: <T = unknown>(path: string) => request<T>(path),

  post: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  del: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'DELETE',
      ...(body != null ? { body: JSON.stringify(body) } : {}),
    }),
};
