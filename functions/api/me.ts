// Cloudflare Pages Function: /api/me
// Returns the email of the teacher signed in through Cloudflare Access.

import { getAuthenticatedEmail, unauthorizedResponse, type AuthEnv } from '../_lib/auth';

export const onRequestGet: PagesFunction<AuthEnv> = async (context) => {
  const email = await getAuthenticatedEmail(context.request, context.env);
  if (!email) return unauthorizedResponse();

  return new Response(
    JSON.stringify({ email }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
  );
};
