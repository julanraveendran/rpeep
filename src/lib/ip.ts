import { createHash } from 'node:crypto';

/** The visitor's IP address from the proxy headers, or "unknown". Used only to build a salted hash. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown';
}

/** `sha256(value + salt)` as hex. Raw IP addresses are never stored or sent to a rate limiter (PRD section 11). */
export function saltedHash(value: string, salt: string): string {
  return createHash('sha256').update(value + salt).digest('hex');
}

export const hashIp = saltedHash;
