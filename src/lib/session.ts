import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './api';

export interface SessionUser {
  did: string;
  handle: string | null;
  displayName?: string | null;
  avatar?: string | null;
}

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface UseSessionResult {
  status: SessionStatus;
  user: SessionUser | null;
  /** Re-fetch session state (e.g. after returning from OAuth callback). */
  refresh: () => Promise<void>;
  /** Calls POST /oauth/logout and clears local state. */
  logout: () => Promise<void>;
}

/**
 * React hook for the current crate.social session.
 *
 * Fetches `GET /api/session` on mount. Returns `loading` until the request
 * settles, then either `authenticated` (with `user`) or `unauthenticated`.
 */
export function useSession(): UseSessionResult {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch.get<SessionUser>('/api/session');
      setUser(data);
      setStatus('authenticated');
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await apiFetch.post('/oauth/logout');
    } catch {
      // ignore — we clear local state regardless so the UI matches reality
    }
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  return { status, user, refresh, logout };
}
