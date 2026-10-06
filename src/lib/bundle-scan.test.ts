import { describe, expect, it } from 'vitest';
import { serverEnvSchema } from '@/lib/env';
import { findLeaks } from './bundle-scan';

const names = Object.keys(serverEnvSchema.shape);

describe('findLeaks', () => {
  it('finds a server variable name in a client file', () => {
    const leaks = findLeaks([{ path: 'chunk.js', content: 'const k=process.env.SUPABASE_SERVICE_ROLE_KEY;' }], names);
    expect(leaks).toEqual([{ path: 'chunk.js', kind: 'name', match: 'SUPABASE_SERVICE_ROLE_KEY' }]);
  });

  it('finds a secret value, and ignores values too short to be a secret', () => {
    const files = [{ path: 'a.js', content: 'x="super-secret-value-123"; y="short"' }];
    expect(findLeaks(files, [], ['super-secret-value-123', 'short'])).toEqual([{ path: 'a.js', kind: 'value', match: 'supe…' }]);
  });

  it('does not flag a public variable that contains a server name, or names inside other words', () => {
    const content = 'NEXT_PUBLIC_SENTRY_DSN NEXT_PUBLIC_TURNSTILE_SITE_KEY MY_SENTRY_DSN_2 xSENTRY_DSN';
    expect(findLeaks([{ path: 'a.js', content }], names)).toEqual([]);
    expect(findLeaks([{ path: 'a.js', content: 'SENTRY_DSN' }], names)).toHaveLength(1);
  });

  it('returns nothing for clean files', () => {
    expect(findLeaks([{ path: 'a.js', content: 'console.log("hello")' }], names, ['abcdefghijklmnop'])).toEqual([]);
  });

  it('checks every server variable in the env schema, and none of the public ones', () => {
    expect(names).toEqual(
      expect.arrayContaining(['SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'TURNSTILE_SECRET_KEY', 'UPSTASH_REDIS_REST_TOKEN', 'UNSUBSCRIBE_SECRET', 'IP_HASH_SALT']),
    );
    expect(names.some((name) => name.startsWith('NEXT_PUBLIC_'))).toBe(false);
  });
});
