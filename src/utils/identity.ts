// Who is using this browser? Resolved once, before the store loads, so every
// teacher gets their own local-first buffer (classque_teacher_os_v1:<email>)
// and one teacher's unsynced changes can never be pushed under another login.
//
// Offline-safe: if /api/me cannot be reached (classroom Wi-Fi drop), the last
// signed-in email on this browser is used so roll-call keeps working. That
// identity is "unverified": local edits are buffered, but nothing syncs until
// /api/me confirms the same email again.

const LEGACY_STORAGE_KEY = 'classque_teacher_os_v1';
const LAST_USER_KEY = 'classque_last_user';
const GUEST_BUCKET = 'guest';
const ME_TIMEOUT_MS = 5000;

export const SIGN_OUT_URL = '/cdn-cgi/access/logout';

interface Identity {
  /** Email whose buffer this browser session reads and writes (null = guest). */
  email: string | null;
  /** True once /api/me has confirmed `email` this session. */
  verified: boolean;
}

let identity: Identity = { email: null, verified: false };

type MeResult =
  | { kind: 'ok'; email: string }
  | { kind: 'rejected' } // server answered but no usable login (401/403/503…)
  | { kind: 'unreachable' }; // offline, timeout, or Access redirected the fetch

const fetchMe = async (): Promise<MeResult> => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { kind: 'unreachable' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ME_TIMEOUT_MS);
  try {
    const res = await fetch('/api/me', { cache: 'no-store', signal: controller.signal });
    if (!res.ok) return { kind: 'rejected' };
    const body = (await res.json()) as { email?: string };
    return body?.email ? { kind: 'ok', email: body.email.trim().toLowerCase() } : { kind: 'rejected' };
  } catch {
    return { kind: 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
};

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage full or blocked: the app still works in memory */
  }
};

const bucketKeyFor = (email: string | null) =>
  `${LEGACY_STORAGE_KEY}:${email ?? GUEST_BUCKET}`;

/**
 * Resolve the signed-in teacher. Must finish before the store module is imported.
 */
export const initIdentity = async (): Promise<Identity> => {
  const me = await fetchMe();

  if (me.kind === 'ok') {
    identity = { email: me.email, verified: true };
    writeStorage(LAST_USER_KEY, me.email);

    // Before per-user buffers existed, one shared key held this browser's data.
    // The first teacher to sign in here inherits it (so no offline work is lost);
    // the shared key is then removed so a second teacher cannot inherit it too.
    const bucket = bucketKeyFor(me.email);
    const legacy = readStorage(LEGACY_STORAGE_KEY);
    if (legacy !== null) {
      if (readStorage(bucket) === null) writeStorage(bucket, legacy);
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    return identity;
  }

  // Not confirmed: keep working locally as the last signed-in teacher, if any.
  const last = readStorage(LAST_USER_KEY);
  identity = { email: last || null, verified: false };
  return identity;
};

export const getIdentity = (): Readonly<Identity> => identity;

/** localStorage key of the current teacher's local-first buffer. */
export const getStorageKey = (): string => bucketKeyFor(identity.email);

/**
 * Called before any sync. Returns true only when the server confirms the same
 * teacher whose buffer is loaded. A different teacher means the page must reload
 * so the right buffer is loaded; nothing is pushed in the meantime.
 */
export const ensureVerified = async (): Promise<boolean> => {
  if (identity.verified) return true;

  const me = await fetchMe();
  if (me.kind !== 'ok') return false;

  if (me.email === identity.email) {
    identity = { email: me.email, verified: true };
    writeStorage(LAST_USER_KEY, me.email);
    return true;
  }

  // Someone else signed in (or this browser was a guest): reload into their buffer.
  if (typeof window !== 'undefined') window.location.reload();
  return false;
};
