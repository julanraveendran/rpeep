import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Signed unsubscribe tokens (PRD section 12): `base64url(email) + "." + HMAC-SHA256(email, UNSUBSCRIBE_SECRET)`,
 * the signature also base64url. The signature is compared in constant time.
 */

const b64url = (buffer: Buffer) => buffer.toString('base64url');

function sign(email: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(email).digest();
}

const normalise = (email: string) => email.trim().toLowerCase();

export function createUnsubscribeToken(email: string, secret: string): string {
  const address = normalise(email);
  return `${b64url(Buffer.from(address, 'utf8'))}.${b64url(sign(address, secret))}`;
}

/** The email address in a valid token, or `null` for anything malformed or tampered with. */
export function verifyUnsubscribeToken(token: string | null | undefined, secret: string): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedEmail, encodedSignature] = parts as [string, string];
  if (!/^[A-Za-z0-9_-]+$/.test(encodedEmail) || !/^[A-Za-z0-9_-]+$/.test(encodedSignature)) return null;

  let email: string;
  try {
    email = Buffer.from(encodedEmail, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  if (!email || email !== normalise(email) || email.length > 254) return null;

  const expected = sign(email, secret);
  const actual = Buffer.from(encodedSignature, 'base64url');
  if (actual.length !== expected.length) return null;
  return timingSafeEqual(actual, expected) ? email : null;
}
