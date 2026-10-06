// Cloudflare Pages Function: /api/me
// Returns the teacher signed in through Cloudflare Access, creating their
// teacher record the first time they log in.

import { getAuthenticatedEmail, unauthorizedResponse, type AuthEnv } from '../_lib/auth';
import { getOrCreateTeacher } from '../_lib/teacher';

interface Env extends AuthEnv {
  DB: D1Database;
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  const email = await getAuthenticatedEmail(request, env);
  if (!email) return unauthorizedResponse();

  if (!env.DB) {
    return json(
      {
        error: 'Cloudflare D1 binding (DB) is not configured in wrangler.toml or Cloudflare dashboard.',
        status: 'unbound',
      },
      503
    );
  }

  try {
    const teacher = await getOrCreateTeacher(env.DB, email);
    if (!teacher) return json({ error: 'This account has been disabled.', status: 'disabled' }, 403);
    return json({ email, teacher }, 200);
  } catch (error: any) {
    return json({ error: error.message || 'Failed to load teacher account' }, 500);
  }
};
