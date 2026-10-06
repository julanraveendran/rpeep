/** Request bodies on the API routes are limited to 32KB (PRD section 13). */
export const MAX_BODY_BYTES = 32 * 1024;

export type ParsedBody = { ok: true; value: unknown } | { ok: false; status: 400 | 413; error: 'validation' | 'too_large'; message: string };

/** Reads and parses a JSON body, refusing anything over `maxBytes`. */
export async function readJsonBody(request: Request, maxBytes: number = MAX_BODY_BYTES): Promise<ParsedBody> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, status: 413, error: 'too_large', message: 'The request is too large.' };
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, status: 400, error: 'validation', message: 'The request body could not be read.' };
  }
  if (new TextEncoder().encode(text).length > maxBytes) {
    return { ok: false, status: 413, error: 'too_large', message: 'The request is too large.' };
  }

  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, error: 'validation', message: 'The request body is not valid JSON.' };
  }
}
