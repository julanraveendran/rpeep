import { readJsonBody } from '@/lib/api/body';
import type { ApiResult } from '@/lib/api/types';
import { getClientIp } from '@/lib/ip';
import { logError } from '@/lib/log';

/** A JSON response that is never cached. */
export function json(body: Record<string, unknown>, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Shared shape of the two form endpoints: read the body (32KB limit), hand it to the handler and turn the result into
 * a response. Anything unexpected becomes the generic `500 { ok: false, error: "server" }`.
 */
export async function handleFormRequest(
  request: Request,
  handler: (input: { body: unknown; ip: string }) => Promise<ApiResult>,
  context: string,
): Promise<Response> {
  try {
    const parsed = await readJsonBody(request);
    if (!parsed.ok) {
      return json(
        parsed.error === 'validation'
          ? { ok: false, error: 'validation', fields: { form: parsed.message } }
          : { ok: false, error: parsed.error },
        parsed.status,
      );
    }
    const result = await handler({ body: parsed.value, ip: getClientIp(request.headers) });
    return json(result.body, result.status);
  } catch (error) {
    logError(context, error);
    return json({ ok: false, error: 'server' }, 500);
  }
}
