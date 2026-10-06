import type { ApiDeps } from '@/lib/api/types';
import { verifyUnsubscribeToken } from '@/lib/tokens';

export type UnsubscribeOutcome = 'ok' | 'invalid' | 'error';

/**
 * Unsubscribe from a signed link (PRD section 12). A valid token adds the address to `email_suppressions`
 * and turns off `marketing_consent` on every matching row. Suppressions are kept indefinitely.
 */
export async function handleUnsubscribe(
  deps: Pick<ApiDeps, 'db' | 'unsubscribeSecret' | 'logError'>,
  token: string | null | undefined,
): Promise<UnsubscribeOutcome> {
  const email = verifyUnsubscribeToken(token, deps.unsubscribeSecret);
  if (!email) return 'invalid';
  try {
    await deps.db.suppress(email);
    await deps.db.withdrawMarketingConsent(email);
    return 'ok';
  } catch (error) {
    deps.logError('unsubscribe', error);
    return 'error';
  }
}
