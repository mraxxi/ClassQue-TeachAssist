// Cloudflare Pages Function middleware for every /api/* route.
//
// Authentication: a single shared secret (`SYNC_TOKEN`) sent as `Authorization: Bearer <token>`.
// ClassQue is a single-teacher app holding minors' contact details, so the edge API fails CLOSED:
// if the secret is not configured, every request is refused.
//
//   Production: npx wrangler pages secret put SYNC_TOKEN --project-name classque-teachassist
//   Local dev:  put `SYNC_TOKEN=...` in .dev.vars (see .dev.vars.example)

interface Env {
  SYNC_TOKEN?: string;
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

/** Constant-time comparison (hash both sides so lengths never leak). */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  if (!env.SYNC_TOKEN) {
    return json(503, { error: 'SYNC_TOKEN is not configured on the server.', status: 'unconfigured' });
  }
  const header = request.headers.get('Authorization') || '';
  const given = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!given || !(await safeEqual(given, env.SYNC_TOKEN))) {
    return json(401, { error: 'Missing or invalid sync token.', status: 'unauthorized' });
  }
  return next();
};
