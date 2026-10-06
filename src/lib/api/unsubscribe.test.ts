import { beforeEach, describe, expect, it } from 'vitest';
import { createUnsubscribeToken } from '@/lib/tokens';
import { handleUnsubscribe } from './unsubscribe';
import { createTestContext, TEST_UNSUBSCRIBE_SECRET, type TestContext } from './test-utils';
import { handleReport } from './report';
import { reportBody } from './test-utils';

let ctx: TestContext;
beforeEach(() => {
  ctx = createTestContext();
});

describe('unsubscribe', () => {
  it('adds a suppression row and turns off marketing consent for a valid token', async () => {
    const body = reportBody();
    body.contact.marketingConsent = true;
    await handleReport(ctx.deps, { body, ip: '203.0.113.7' });
    expect(ctx.db.reports[0]?.marketing_consent).toBe(true);

    const token = createUnsubscribeToken('sam@example.org', TEST_UNSUBSCRIBE_SECRET);
    expect(await handleUnsubscribe(ctx.deps, token)).toBe('ok');
    expect(ctx.db.suppressions.has('sam@example.org')).toBe(true);
    expect(ctx.db.reports[0]?.marketing_consent).toBe(false);
  });

  it('rejects a tampered token and changes nothing', async () => {
    const token = createUnsubscribeToken('sam@example.org', TEST_UNSUBSCRIBE_SECRET);
    const [email, signature] = token.split('.') as [string, string];
    const otherEmail = Buffer.from('victim@example.org').toString('base64url');
    const tampered = [
      `${otherEmail}.${signature}`, // someone else's address with this signature
      `${email}.${signature.slice(0, -2)}AA`, // altered signature
      `${email}.`, // no signature
      `.${signature}`,
      'garbage',
      '',
    ];
    for (const candidate of tampered) expect(await handleUnsubscribe(ctx.deps, candidate), candidate).toBe('invalid');
    expect(await handleUnsubscribe(ctx.deps, null)).toBe('invalid');
    expect(await handleUnsubscribe(ctx.deps, undefined)).toBe('invalid');
    expect(ctx.db.suppressions.size).toBe(0);
    expect(ctx.db.withdrawn).toEqual([]);
  });

  it('rejects a token signed with a different secret', async () => {
    const token = createUnsubscribeToken('sam@example.org', 'another-secret-'.repeat(4));
    expect(await handleUnsubscribe(ctx.deps, token)).toBe('invalid');
    expect(ctx.db.suppressions.size).toBe(0);
  });

  it('is safe to use twice', async () => {
    const token = createUnsubscribeToken('sam@example.org', TEST_UNSUBSCRIBE_SECRET);
    expect(await handleUnsubscribe(ctx.deps, token)).toBe('ok');
    expect(await handleUnsubscribe(ctx.deps, token)).toBe('ok');
    expect(ctx.db.suppressions.size).toBe(1);
  });

  it('reports "error" and logs if the database fails', async () => {
    ctx.db.suppress = async () => {
      throw new Error('db down');
    };
    const token = createUnsubscribeToken('sam@example.org', TEST_UNSUBSCRIBE_SECRET);
    expect(await handleUnsubscribe(ctx.deps, token)).toBe('error');
    expect(ctx.logged).toHaveLength(1);
  });
});
