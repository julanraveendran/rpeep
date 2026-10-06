import { describe, expect, it } from 'vitest';
import { buildCsp, createNonce, sentryOrigin, staticSecurityHeaders } from './security-headers';

const directive = (csp: string, name: string) => csp.split('; ').find((part) => part.startsWith(`${name} `))?.slice(name.length + 1).split(' ') ?? [];

describe('static security headers (PRD section 13)', () => {
  it('has exactly the values from the PRD table', () => {
    expect(Object.fromEntries(staticSecurityHeaders.map(({ key, value }) => [key, value]))).toEqual({
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'X-Frame-Options': 'DENY',
    });
  });
});

describe('Content-Security-Policy', () => {
  const csp = buildCsp({ nonce: 'abc123', sentryDsn: 'https://key@o1.ingest.de.sentry.io/2' });

  it("defaults to 'self' and forbids framing and plugins", () => {
    expect(directive(csp, 'default-src')).toEqual(["'self'"]);
    expect(directive(csp, 'frame-ancestors')).toEqual(["'none'"]);
    expect(directive(csp, 'object-src')).toEqual(["'none'"]);
    expect(directive(csp, 'base-uri')).toEqual(["'self'"]);
    expect(directive(csp, 'form-action')).toEqual(["'self'"]);
  });

  it('allows scripts from Turnstile and Plausible and inline scripts only with the nonce, and no unsafe-inline or unsafe-eval in production', () => {
    const scripts = directive(csp, 'script-src');
    expect(scripts).toEqual(expect.arrayContaining(["'self'", "'nonce-abc123'", "'strict-dynamic'", 'https://challenges.cloudflare.com', 'https://plausible.io']));
    expect(csp).not.toContain("'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it('allows frames from Turnstile only', () => {
    expect(directive(csp, 'frame-src')).toEqual(['https://challenges.cloudflare.com']);
  });

  it("allows images from 'self' and data: only, fonts from 'self'", () => {
    expect(directive(csp, 'img-src')).toEqual(["'self'", 'data:']);
    expect(directive(csp, 'font-src')).toEqual(["'self'"]);
  });

  it("allows connections to 'self', Plausible and the Sentry ingest host from the DSN", () => {
    expect(directive(csp, 'connect-src')).toEqual(["'self'", 'https://plausible.io', 'https://o1.ingest.de.sentry.io']);
    expect(directive(buildCsp({ nonce: 'x' }), 'connect-src').join(' ')).toContain('ingest.sentry.io');
  });

  it('upgrades insecure requests in production but not in development, where React needs eval', () => {
    expect(csp).toContain('upgrade-insecure-requests');
    const dev = buildCsp({ nonce: 'abc123', isDev: true });
    expect(dev).not.toContain('upgrade-insecure-requests');
    expect(directive(dev, 'script-src')).toContain("'unsafe-eval'");
  });

  it('uses the nonce for styles too, with no inline style allowance', () => {
    expect(directive(csp, 'style-src')).toEqual(["'self'", "'nonce-abc123'"]);
  });
});

describe('nonce and Sentry origin', () => {
  it('creates a different, base64 nonce each time', () => {
    const nonces = new Set(Array.from({ length: 50 }, createNonce));
    expect(nonces.size).toBe(50);
    for (const nonce of nonces) expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('takes the origin from a DSN, and returns null for nothing or junk', () => {
    expect(sentryOrigin('https://abc@o123.ingest.us.sentry.io/456')).toBe('https://o123.ingest.us.sentry.io');
    expect(sentryOrigin(undefined)).toBeNull();
    expect(sentryOrigin('not a url')).toBeNull();
  });
});
