import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logError } from '@/lib/log';

/**
 * Rate limits (PRD section 12): the report endpoint allows 5 requests per 10 minutes per IP and 20 per
 * 24 hours per email address; the pilot endpoint allows 3 per 10 minutes per IP. Keys are salted hashes,
 * never raw IP addresses or emails.
 */
export const LIMITS = {
  report_ip: { requests: 5, window: '10 m', seconds: 10 * 60 },
  report_email: { requests: 20, window: '24 h', seconds: 24 * 60 * 60 },
  pilot_ip: { requests: 3, window: '10 m', seconds: 10 * 60 },
} as const;

export type RateLimitBucket = keyof typeof LIMITS;

export type RateLimiter = {
  /** Resolves to `true` if the request is allowed and counts it. */
  allow(bucket: RateLimitBucket, key: string): Promise<boolean>;
};

/**
 * Upstash-backed limiter with a sliding window. If Upstash cannot be reached it lets the request through
 * and logs the problem, because Turnstile still protects the endpoints and a Redis outage should not stop
 * visitors from getting their report.
 */
export function createUpstashLimiter(options: { url: string; token: string }): RateLimiter {
  const redis = new Redis({ url: options.url, token: options.token });
  const limiters = Object.fromEntries(
    (Object.keys(LIMITS) as RateLimitBucket[]).map((bucket) => [
      bucket,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(LIMITS[bucket].requests, LIMITS[bucket].window),
        prefix: `rpeep:${bucket}`,
        analytics: false,
      }),
    ]),
  ) as Record<RateLimitBucket, Ratelimit>;

  return {
    async allow(bucket, key) {
      try {
        const { success } = await limiters[bucket].limit(key);
        return success;
      } catch (error) {
        logError('ratelimit', error);
        return true;
      }
    },
  };
}

/** The same limits held in memory. For tests, and anywhere a real Redis is not available. */
export function createMemoryLimiter(now: () => number = Date.now): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    async allow(bucket, key) {
      const { requests, seconds } = LIMITS[bucket];
      const id = `${bucket}:${key}`;
      const cutoff = now() - seconds * 1000;
      const recent = (hits.get(id) ?? []).filter((time) => time > cutoff);
      if (recent.length >= requests) {
        hits.set(id, recent);
        return false;
      }
      recent.push(now());
      hits.set(id, recent);
      return true;
    },
  };
}
