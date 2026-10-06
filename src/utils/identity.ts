// Who is using this browser? Resolved once, before the store loads, so every
// teacher gets their own local-first buffer (classque_teacher_os_v1:<email>)
// and one teacher's unsynced changes can never be pushed under another login.
//
// Offline-safe: if /api/me cannot be reached (classroom Wi-Fi drop), the last
// signed-in email on this browser is used so roll-call keeps working. That
// identity is "unverified": local edits are buffered, but nothing syncs until
// /api/me confirms the same email again.

import { syncHeaders } from './syncAuth';

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

/** Why the server would not confirm a login (mirrors the sync badge states). */
export type IdentityFailure = 'unauthenticated' | 'rejected' | 'unconfigured' | 'unbound' | 'unusable';

type MeResult =
  | { kind: 'ok'; email: string }
  | { kind: 'rejected'; reason: IdentityFailure } // server answered but no usable login
  | { kind: 'unreachable' }; // offline, timeout, or Access redirected the fetch

/** Reads the `status` field the API puts on its 401/503/403 bodies. */
const failureReason = async (res: Response): Promise<IdentityFailure> => {
  const body = (await res.json().catch(() => null)) as { status?: string } | null;
  if (res.status === 401) return body?.status === 'unauthenticated' ? 'unauthenticated' : 'rejected'; // else: bad SYNC_TOKEN
  if (res.status === 503) return body?.status === 'unbound' ? 'unbound' : 'unconfigured';
  return 'unusable';
};

const fetchMe = async (): Promise<MeResult> => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { kind: 'unreachable' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ME_TIMEOUT_MS);
  try {
    // /api/* also needs the sync token (see functions/api/_middleware.ts), so send it like every sync call.
    const res = await fetch('/api/me', { cache: 'no-store', signal: controller.signal, headers: syncHeaders() });
    if (!res.ok) return { kind: 'rejected', reason: await failureReason(res) };
    const body = (await res.json()) as { email?: string };
    return body?.email ? { kind: 'ok', email: body.email.trim().toLowerCase() } : { kind: 'rejected', reason: 'unusable' };
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
 * Work done as a guest (no login confirmed yet, e.g. the sync token was not entered on a new device) lives in
 * the guest buffer. When a login is confirmed, that work moves into the teacher's own buffer, unless the teacher
 * already has one (then it stays where it is rather than overwriting anything).
 */
const adoptGuestBuffer = (email: string) => {
  const guestKey = bucketKeyFor(null);
  const guest = readStorage(guestKey);
  if (guest === null) return;
  if (readStorage(bucketKeyFor(email)) === null) writeStorage(bucketKeyFor(email), guest);
  else return;
  try {
    localStorage.removeItem(guestKey);
  } catch {
    /* ignore */
  }
};

/**
 * Resolve the signed-in teacher. Must finish before the store module is imported.
 */
export const initIdentity = async (): Promise<Identity> => {
  const me = await fetchMe();

  if (me.kind === 'ok') {
    identity = { email: me.email, verified: true };
    writeStorage(LAST_USER_KEY, me.email);
    adoptGuestBuffer(me.email);

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
  if (!last) {
    // Data saved before per-teacher buffers existed is still this browser's work: keep it visible as the guest
    // buffer until a login is confirmed, then adoptGuestBuffer hands it to that teacher.
    const legacy = readStorage(LEGACY_STORAGE_KEY);
    if (legacy !== null && readStorage(bucketKeyFor(null)) === null) {
      writeStorage(bucketKeyFor(null), legacy);
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }
  return identity;
};

export const getIdentity = (): Readonly<Identity> => identity;

/** localStorage key of the current teacher's local-first buffer. */
export const getStorageKey = (): string => bucketKeyFor(identity.email);

export type VerifyResult = { ok: true } | { ok: false; reason: IdentityFailure | 'offline' };

/**
 * Called before any sync. Returns ok only when the server confirms the same
 * teacher whose buffer is loaded. A different teacher means the page must reload
 * so the right buffer is loaded; nothing is pushed in the meantime.
 */
export const ensureVerified = async (): Promise<VerifyResult> => {
  if (identity.verified) return { ok: true };

  const me = await fetchMe();
  if (me.kind === 'unreachable') return { ok: false, reason: 'offline' };
  if (me.kind === 'rejected') return { ok: false, reason: me.reason };

  if (me.email === identity.email) {
    identity = { email: me.email, verified: true };
    writeStorage(LAST_USER_KEY, me.email);
    return { ok: true };
  }

  // Someone else signed in (or this browser was a guest): reload into their buffer.
  if (identity.email === null) adoptGuestBuffer(me.email);
  writeStorage(LAST_USER_KEY, me.email);
  if (typeof window !== 'undefined') window.location.reload();
  return { ok: false, reason: 'offline' };
};
