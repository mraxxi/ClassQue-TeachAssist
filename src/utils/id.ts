// Collision-proof record IDs. Teachers share one D1 database, so IDs must never
// repeat across users or devices (timestamps did: two teachers adding a cohort in
// the same millisecond would have overwritten each other on sync).

const randomUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // crypto.randomUUID needs a secure context (https / localhost); fall back to
  // getRandomValues for e.g. a dev server opened over a LAN IP.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

/** e.g. newId('cohort') -> "cohort-3f2b8c1e-…" (prefix kept for easier debugging) */
export const newId = (prefix: string): string => `${prefix}-${randomUuid()}`;
