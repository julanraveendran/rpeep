import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { getClientIp, hashIp, saltedHash } from './ip';

describe('getClientIp', () => {
  it('uses the first address in X-Forwarded-For, then X-Real-IP, then "unknown"', () => {
    expect(getClientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7');
    expect(getClientIp(new Headers({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2');
    expect(getClientIp(new Headers())).toBe('unknown');
  });
});

describe('hashIp', () => {
  it('is sha256(ip + salt) as hex, so the same IP and salt always give the same hash and different salts differ', () => {
    expect(hashIp('203.0.113.7', 'salt')).toBe(createHash('sha256').update('203.0.113.7salt').digest('hex'));
    expect(saltedHash('a', 's1')).not.toBe(saltedHash('a', 's2'));
    expect(hashIp('203.0.113.7', 'salt')).not.toContain('203');
  });
});
