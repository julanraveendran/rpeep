/**
 * Cloudflare Turnstile server-side check (PRD sections 4 and 12, step 3). Fails closed: any network
 * problem, timeout or unexpected response counts as "not verified".
 */

export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export async function verifyTurnstile(
  token: string,
  options: { secret: string; ip?: string; fetchImpl?: FetchLike; timeoutMs?: number },
): Promise<boolean> {
  const { secret, ip, fetchImpl = fetch, timeoutMs = 5000 } = options;
  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== 'unknown') body.set('remoteip', ip);

  try {
    const response = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: unknown };
    return result.success === true;
  } catch {
    return false;
  }
}
