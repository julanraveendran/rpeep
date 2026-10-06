/**
 * Security headers (PRD section 13). The static headers go in `next.config.ts`; the Content-Security-Policy is built
 * per request in `src/proxy.ts`, because it carries a fresh nonce for the inline scripts Next.js adds.
 */

/** The Cloudflare Turnstile origin: its script and its iframe. */
export const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';
/** The Plausible script and event endpoint. */
export const PLAUSIBLE_ORIGIN = 'https://plausible.io';

/** Headers that are the same on every response. */
export const staticSecurityHeaders: readonly { key: string; value: string }[] = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-Frame-Options', value: 'DENY' },
];

/** The origin an event is sent to, from a Sentry DSN such as `https://key@o1.ingest.de.sentry.io/2`. */
export function sentryOrigin(dsn: string | undefined): string | null {
  if (!dsn) return null;
  try {
    return new URL(dsn).origin;
  } catch {
    return null;
  }
}

/**
 * `default-src 'self'`, scripts and frames only from our own origin, Turnstile and Plausible, no inline script
 * without the nonce, and no framing of the site. `strict-dynamic` lets a script that carries the nonce load the
 * others it needs, such as the Turnstile and Plausible scripts it adds itself.
 */
export function buildCsp(options: { nonce: string; isDev?: boolean; sentryDsn?: string }): string {
  const { nonce, isDev = false, sentryDsn } = options;
  const sentry = sentryOrigin(sentryDsn);
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", TURNSTILE_ORIGIN, PLAUSIBLE_ORIGIN, ...(isDev ? ["'unsafe-eval'"] : [])],
    // Styles come from our own stylesheets. Next.js adds the nonce to any inline style it generates.
    'style-src': ["'self'", `'nonce-${nonce}'`],
    'img-src': ["'self'", 'data:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", PLAUSIBLE_ORIGIN, sentry ?? 'https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.ingest.us.sentry.io'],
    'frame-src': [TURNSTILE_ORIGIN],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };
  const policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
  return isDev ? policy : `${policy}; upgrade-insecure-requests`;
}

/** A fresh, unpredictable nonce for one request. */
export function createNonce(): string {
  return btoa(crypto.randomUUID());
}
