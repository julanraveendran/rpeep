import { describe, expect, it } from 'vitest';
import { assertEnv, EnvError, parsePublicEnv, parseServerEnv } from './env';

const hex32 = 'a'.repeat(64);

const valid = {
  NEXT_PUBLIC_SITE_URL: 'https://example.co.uk',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site-key',
  TURNSTILE_SECRET_KEY: 'turnstile-secret',
  SUPABASE_URL: 'https://abc.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role',
  RESEND_API_KEY: 're_123',
  EMAIL_FROM: 'Example <hello@example.co.uk>',
  EMAIL_REPLY_TO: 'founder@example.co.uk',
  FOUNDER_EMAIL: 'founder@example.co.uk',
  UPSTASH_REDIS_REST_URL: 'https://eu1-example.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'upstash-token',
  UNSUBSCRIBE_SECRET: hex32,
  IP_HASH_SALT: hex32,
} satisfies Record<string, string>;

const requiredServer = [
  'TURNSTILE_SECRET_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'EMAIL_REPLY_TO',
  'FOUNDER_EMAIL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'UNSUBSCRIBE_SECRET',
  'IP_HASH_SALT',
] as const;

describe('parseServerEnv', () => {
  it('accepts a complete environment, with the optional variables left out', () => {
    expect(parseServerEnv(valid).SUPABASE_URL).toBe('https://abc.supabase.co');
  });

  it.each(requiredServer)('names %s when it is missing', (name) => {
    const { [name]: _removed, ...rest } = valid;
    void _removed;
    expect(() => parseServerEnv(rest)).toThrow(EnvError);
    expect(() => parseServerEnv(rest)).toThrow(new RegExp(`${name}`));
  });

  it('treats an empty value like a missing one', () => {
    expect(() => parseServerEnv({ ...valid, RESEND_API_KEY: '' })).toThrow(/RESEND_API_KEY is required/);
  });

  it('lists every problem at once, not just the first', () => {
    try {
      parseServerEnv({});
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(EnvError);
      expect((error as EnvError).issues).toHaveLength(requiredServer.length);
      expect((error as EnvError).message).toContain('Copy .env.example to .env.local');
    }
  });

  it('rejects secrets shorter than 32 random bytes', () => {
    expect(() => parseServerEnv({ ...valid, UNSUBSCRIBE_SECRET: 'short' })).toThrow(/UNSUBSCRIBE_SECRET must be at least 32 random bytes/);
    expect(() => parseServerEnv({ ...valid, IP_HASH_SALT: 'a'.repeat(42) })).toThrow(/IP_HASH_SALT/);
    expect(parseServerEnv({ ...valid, IP_HASH_SALT: 'a'.repeat(43) }).IP_HASH_SALT).toHaveLength(43);
  });

  it('rejects values that are not URLs or email addresses', () => {
    expect(() => parseServerEnv({ ...valid, SUPABASE_URL: 'not a url' })).toThrow(/SUPABASE_URL must be a full URL/);
    expect(() => parseServerEnv({ ...valid, FOUNDER_EMAIL: 'nope' })).toThrow(/FOUNDER_EMAIL must be an email address/);
    expect(() => parseServerEnv({ ...valid, EMAIL_FROM: 'hello@example.co.uk' })).toThrow(/EMAIL_FROM must look like/);
  });

  it('rejects the placeholder EMAIL_FROM from .env.example, which Resend would refuse to send from', () => {
    expect(() => parseServerEnv({ ...valid, EMAIL_FROM: '[BRAND] <hello@[DOMAIN]>' })).toThrow(/EMAIL_FROM must look like/);
    expect(() => parseServerEnv({ ...valid, EMAIL_FROM: 'Example <hello@[DOMAIN]>' })).toThrow(/EMAIL_FROM must look like/);
  });

  it('accepts an empty SENTRY_DSN and rejects a malformed one', () => {
    expect(parseServerEnv({ ...valid, SENTRY_DSN: '' }).SENTRY_DSN).toBeUndefined();
    expect(parseServerEnv({ ...valid, SENTRY_DSN: 'https://key@o1.ingest.sentry.io/1' }).SENTRY_DSN).toContain('sentry.io');
    expect(() => parseServerEnv({ ...valid, SENTRY_DSN: 'nope' })).toThrow(/SENTRY_DSN/);
  });
});

describe('parsePublicEnv', () => {
  it('requires the site URL and the Turnstile site key', () => {
    expect(() => parsePublicEnv({})).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => parsePublicEnv({})).toThrow(/NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
  });

  it('rejects a placeholder Plausible domain and accepts a real one or none', () => {
    expect(() => parsePublicEnv({ ...valid, NEXT_PUBLIC_PLAUSIBLE_DOMAIN: '[DOMAIN]' })).toThrow(/NEXT_PUBLIC_PLAUSIBLE_DOMAIN/);
    expect(parsePublicEnv({ ...valid, NEXT_PUBLIC_PLAUSIBLE_DOMAIN: 'example.co.uk' }).NEXT_PUBLIC_PLAUSIBLE_DOMAIN).toBe('example.co.uk');
    expect(parsePublicEnv(valid).NEXT_PUBLIC_PLAUSIBLE_DOMAIN).toBeUndefined();
  });

  it('never includes a secret', () => {
    const parsed = parsePublicEnv({ ...valid, NEXT_PUBLIC_PLAUSIBLE_DOMAIN: 'example.co.uk' });
    expect(Object.keys(parsed).every((key) => key.startsWith('NEXT_PUBLIC_'))).toBe(true);
  });
});

describe('assertEnv', () => {
  it('passes for a complete environment', () => {
    expect(() => assertEnv(valid)).not.toThrow();
  });

  it('reports server and public problems together', () => {
    try {
      assertEnv({});
      expect.unreachable();
    } catch (error) {
      expect((error as EnvError).issues.join('\n')).toMatch(/NEXT_PUBLIC_SITE_URL[\s\S]*RESEND_API_KEY|RESEND_API_KEY[\s\S]*NEXT_PUBLIC_SITE_URL/);
    }
  });

  it('can be skipped explicitly for CI and tests', () => {
    expect(() => assertEnv({ SKIP_ENV_VALIDATION: '1' })).not.toThrow();
  });
});
