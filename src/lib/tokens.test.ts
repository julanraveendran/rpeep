import { describe, expect, it } from 'vitest';
import { createUnsubscribeToken, verifyUnsubscribeToken } from './tokens';

const secret = 'a-long-random-secret-'.repeat(3);

describe('unsubscribe tokens (PRD section 12)', () => {
  it('has the form base64url(email) + "." + base64url(HMAC-SHA256(email))', () => {
    const token = createUnsubscribeToken('sam@example.org', secret);
    const [email, signature] = token.split('.') as [string, string];
    expect(Buffer.from(email, 'base64url').toString()).toBe('sam@example.org');
    expect(signature).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 bytes of HMAC-SHA256 in base64url
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it('round-trips, lower-casing the address', () => {
    expect(verifyUnsubscribeToken(createUnsubscribeToken('Sam@Example.ORG ', secret), secret)).toBe('sam@example.org');
  });

  it('rejects the wrong secret, a changed address, a changed signature and malformed input', () => {
    const token = createUnsubscribeToken('sam@example.org', secret);
    const [, signature] = token.split('.') as [string, string];
    expect(verifyUnsubscribeToken(token, 'other-secret'.repeat(5))).toBeNull();
    expect(verifyUnsubscribeToken(`${Buffer.from('x@example.org').toString('base64url')}.${signature}`, secret)).toBeNull();
    expect(verifyUnsubscribeToken(token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A'), secret)).toBeNull();
    for (const bad of ['', 'a', 'a.b', 'a.b.c', '...', 'not base64!.sig', `${token}.extra`, undefined, null]) {
      expect(verifyUnsubscribeToken(bad as string, secret), String(bad)).toBeNull();
    }
  });

  it('rejects a token for an address that is not in its normal form', () => {
    // Upper-case in the encoded address: it was not produced by createUnsubscribeToken.
    const encoded = Buffer.from('Sam@example.org').toString('base64url');
    expect(verifyUnsubscribeToken(`${encoded}.${'A'.repeat(43)}`, secret)).toBeNull();
  });
});
