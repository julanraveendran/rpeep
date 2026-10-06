import * as Sentry from '@sentry/nextjs';
import { assertEnv } from '@/lib/env';

/** Runs once when the server starts. Fails fast, with a clear message, if the environment is incomplete. */
export async function register() {
  // `next build` collects page data in workers without runtime secrets on some hosts; validate at start instead.
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== 'nodejs') return;
  assertEnv();
  await import('./sentry.server');
}

/** Sends errors from rendering and route handlers to Sentry (a no-op if Sentry was not started). */
export const onRequestError = Sentry.captureRequestError;
