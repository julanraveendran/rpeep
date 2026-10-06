import { json } from '@/lib/api/respond';
import { getApiDeps } from '@/lib/api/services';
import { handleUnsubscribe } from '@/lib/api/unsubscribe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/unsubscribe?token=...: the link in the email footer. Unsubscribes in one click, then shows the
 * /unsubscribe page with the outcome (PRD section 12).
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  const outcome = await handleUnsubscribe(getApiDeps(), token);
  const target = new URL(`/unsubscribe?status=${outcome}`, request.url);
  return Response.redirect(target, 303);
}

/** POST /api/unsubscribe?token=...: one-click unsubscribe from the `List-Unsubscribe-Post` header (RFC 8058). */
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  const outcome = await handleUnsubscribe(getApiDeps(), token);
  if (outcome === 'ok') return json({ ok: true });
  return json({ ok: false, error: outcome === 'invalid' ? 'invalid_token' : 'server' }, outcome === 'invalid' ? 400 : 500);
}
