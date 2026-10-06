/**
 * Sync token handling. The edge API (`/api/sync`) requires `Authorization: Bearer <SYNC_TOKEN>`.
 * The token is entered once in Settings and kept in this browser only (never in the synced dataset
 * or the JSON backup).
 */
const TOKEN_KEY = 'classque_sync_token';

export const getSyncToken = (): string => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const setSyncToken = (token: string): void => {
  try {
    if (token.trim()) localStorage.setItem(TOKEN_KEY, token.trim());
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
};

export const syncHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const token = getSyncToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
};

export type SyncAuthStatus = 'unknown' | 'ok' | 'missing' | 'rejected' | 'unconfigured' | 'unbound' | 'unauthenticated';
