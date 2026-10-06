import { assertEnv } from '@/lib/env';

/** Runs once when the server starts. Fails fast, with a clear message, if the environment is incomplete. */
export function register() {
  // `next build` collects page data in workers without runtime secrets on some hosts; validate at start instead.
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== 'nodejs') return;
  assertEnv();
}
