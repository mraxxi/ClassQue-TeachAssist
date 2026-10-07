/**
 * Sync status shown by the badge, Settings and diagnostics. The edge API is protected by the Cloudflare Access
 * login (see functions/_lib/auth.ts); the browser sends no secret of its own.
 *  - unauthenticated: no valid login (401)    - unbound: the D1 binding is missing (503)
 *  - unconfigured: the server answered 503 for another reason
 */
export type SyncAuthStatus = 'unknown' | 'ok' | 'unconfigured' | 'unbound' | 'unauthenticated';
