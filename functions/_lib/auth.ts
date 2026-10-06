// Shared helper (not a route): resolves the signed-in teacher's email.
// Production: verifies the Cloudflare Access JWT (Cf-Access-Jwt-Assertion).
// Local dev: falls back to DEV_USER_EMAIL when Access is not configured.

export interface AuthEnv {
  CF_ACCESS_TEAM_DOMAIN?: string; // e.g. "myteam.cloudflareaccess.com"
  CF_ACCESS_AUD?: string; // Application Audience (AUD) tag
  DEV_USER_EMAIL?: string; // Only honoured when CF_ACCESS_AUD is unset
}

interface AccessJwk extends JsonWebKey {
  kid: string;
}

interface AccessJwtPayload {
  email?: string;
  aud?: string | string[];
  iss?: string;
  exp?: number;
  nbf?: number;
}

const CERTS_TTL_MS = 60 * 60 * 1000;
let cachedCerts: { teamDomain: string; keys: AccessJwk[]; fetchedAt: number } | null = null;

const normaliseTeamDomain = (raw: string) =>
  raw.replace(/^https?:\/\//, '').replace(/\/+$/, '');

const base64UrlDecode = (input: string): Uint8Array => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const decodeJsonSegment = <T>(segment: string): T =>
  JSON.parse(new TextDecoder().decode(base64UrlDecode(segment))) as T;

const getAccessCerts = async (teamDomain: string, forceRefresh = false): Promise<AccessJwk[]> => {
  const fresh =
    cachedCerts &&
    cachedCerts.teamDomain === teamDomain &&
    Date.now() - cachedCerts.fetchedAt < CERTS_TTL_MS;
  if (fresh && !forceRefresh) return cachedCerts!.keys;

  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Failed to fetch Access certs (${res.status})`);
  const body = (await res.json()) as { keys?: AccessJwk[] };
  const keys = body.keys || [];
  cachedCerts = { teamDomain, keys, fetchedAt: Date.now() };
  return keys;
};

const verifyAccessJwt = async (
  token: string,
  teamDomain: string,
  audience: string
): Promise<AccessJwtPayload | null> => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerSeg, payloadSeg, signatureSeg] = parts;

  const header = decodeJsonSegment<{ alg?: string; kid?: string }>(headerSeg);
  if (header.alg !== 'RS256' || !header.kid) return null;

  let keys = await getAccessCerts(teamDomain);
  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    // Access rotates keys; refetch once before giving up.
    keys = await getAccessCerts(teamDomain, true);
    jwk = keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlDecode(signatureSeg),
    new TextEncoder().encode(`${headerSeg}.${payloadSeg}`)
  );
  if (!valid) return null;

  const payload = decodeJsonSegment<AccessJwtPayload>(payloadSeg);
  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(audience)) return null;
  if (payload.iss !== `https://${teamDomain}`) return null;
  if (!payload.exp || payload.exp < now) return null;
  if (payload.nbf && payload.nbf > now) return null;
  return payload;
};

/**
 * Returns the verified, lower-cased email of the signed-in teacher,
 * or null when the request carries no valid identity.
 */
export const getAuthenticatedEmail = async (
  request: Request,
  env: AuthEnv
): Promise<string | null> => {
  if (env.CF_ACCESS_AUD && env.CF_ACCESS_TEAM_DOMAIN) {
    const token =
      request.headers.get('Cf-Access-Jwt-Assertion') ||
      getCookie(request, 'CF_Authorization');
    if (!token) return null;
    try {
      const payload = await verifyAccessJwt(
        token,
        normaliseTeamDomain(env.CF_ACCESS_TEAM_DOMAIN),
        env.CF_ACCESS_AUD
      );
      return payload?.email ? payload.email.trim().toLowerCase() : null;
    } catch {
      return null;
    }
  }

  if (env.DEV_USER_EMAIL) return env.DEV_USER_EMAIL.trim().toLowerCase();
  return null;
};

const getCookie = (request: Request, name: string): string | null => {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;
  for (const part of cookie.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
};

export const unauthorizedResponse = () =>
  new Response(
    JSON.stringify({ error: 'Not signed in. Please log in through Cloudflare Access.', status: 'unauthenticated' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
