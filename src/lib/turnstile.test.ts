import { describe, expect, it } from 'vitest';
import { TURNSTILE_VERIFY_URL, verifyTurnstile } from './turnstile';

const respond = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status });

describe('verifyTurnstile', () => {
  it('posts the secret, token and IP to Cloudflare and accepts success: true', async () => {
    let seen: { url: string; body: string } | undefined;
    const ok = await verifyTurnstile('tok', {
      secret: 'sec',
      ip: '203.0.113.7',
      fetchImpl: async (url, init) => {
        seen = { url, body: String(init.body) };
        return new Response(JSON.stringify({ success: true }));
      },
    });
    expect(ok).toBe(true);
    expect(seen?.url).toBe(TURNSTILE_VERIFY_URL);
    const params = new URLSearchParams(seen?.body);
    expect(params.get('secret')).toBe('sec');
    expect(params.get('response')).toBe('tok');
    expect(params.get('remoteip')).toBe('203.0.113.7');
  });

  it('leaves out the IP when it is unknown', async () => {
    let body = '';
    await verifyTurnstile('tok', {
      secret: 'sec',
      ip: 'unknown',
      fetchImpl: async (_url, init) => {
        body = String(init.body);
        return new Response(JSON.stringify({ success: true }));
      },
    });
    expect(new URLSearchParams(body).has('remoteip')).toBe(false);
  });

  it('fails closed: not-success, bad status, bad JSON and network errors all mean "not verified"', async () => {
    expect(await verifyTurnstile('t', { secret: 's', fetchImpl: respond({ success: false }) })).toBe(false);
    expect(await verifyTurnstile('t', { secret: 's', fetchImpl: respond({ success: 'true' }) })).toBe(false);
    expect(await verifyTurnstile('t', { secret: 's', fetchImpl: respond({}) })).toBe(false);
    expect(await verifyTurnstile('t', { secret: 's', fetchImpl: respond({ success: true }, 500) })).toBe(false);
    expect(await verifyTurnstile('t', { secret: 's', fetchImpl: async () => new Response('not json') })).toBe(false);
    expect(
      await verifyTurnstile('t', {
        secret: 's',
        fetchImpl: async () => {
          throw new Error('network down');
        },
      }),
    ).toBe(false);
  });
});
