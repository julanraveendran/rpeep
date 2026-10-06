import { describe, expect, it } from 'vitest';
import { createMemoryLimiter, LIMITS } from './ratelimit';

describe('rate limits (PRD section 12)', () => {
  it('are 5 per 10 minutes per IP and 20 per 24 hours per email for reports, and 3 per 10 minutes per IP for the pilot', () => {
    expect(LIMITS.report_ip).toEqual({ requests: 5, window: '10 m', seconds: 600 });
    expect(LIMITS.report_email).toEqual({ requests: 20, window: '24 h', seconds: 86400 });
    expect(LIMITS.pilot_ip).toEqual({ requests: 3, window: '10 m', seconds: 600 });
  });
});

describe('createMemoryLimiter', () => {
  it('allows the limit, blocks the next request, and does not count blocked requests', async () => {
    let now = 0;
    const limiter = createMemoryLimiter(() => now);
    for (let i = 0; i < 3; i++) expect(await limiter.allow('pilot_ip', 'a')).toBe(true);
    expect(await limiter.allow('pilot_ip', 'a')).toBe(false);
    expect(await limiter.allow('pilot_ip', 'a')).toBe(false);
    now += 10 * 60 * 1000 + 1;
    expect(await limiter.allow('pilot_ip', 'a')).toBe(true);
  });

  it('keeps keys and buckets apart', async () => {
    const limiter = createMemoryLimiter(() => 0);
    for (let i = 0; i < 3; i++) await limiter.allow('pilot_ip', 'a');
    expect(await limiter.allow('pilot_ip', 'a')).toBe(false);
    expect(await limiter.allow('pilot_ip', 'b')).toBe(true);
    expect(await limiter.allow('report_ip', 'a')).toBe(true);
  });
});
