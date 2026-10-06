import { describe, expect, it, vi } from 'vitest';
import { handleFormRequest } from './respond';

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request('https://example.org/api/report', { method: 'POST', body, headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1', ...headers } });

describe('handleFormRequest', () => {
  it('passes the parsed body and the client IP to the handler and returns its status and body, uncached', async () => {
    const handler = vi.fn(async () => ({ status: 200, body: { ok: true } }));
    const response = await handleFormRequest(post('{"a":1}'), handler, 'test');
    expect(handler).toHaveBeenCalledWith({ body: { a: 1 }, ip: '203.0.113.7' });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ ok: true });
  });

  it('returns 400 for a body that is not JSON, without calling the handler', async () => {
    const handler = vi.fn();
    const response = await handleFormRequest(post('not json'), handler, 'test');
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, error: 'validation', fields: { form: expect.any(String) } });
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 413 for a body over 32KB, without calling the handler', async () => {
    const handler = vi.fn();
    const response = await handleFormRequest(post(JSON.stringify({ x: 'a'.repeat(40000) })), handler, 'test');
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ ok: false, error: 'too_large' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('turns an unexpected error into the generic 500 and logs it', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await handleFormRequest(post('{}'), async () => {
      throw new Error('boom for sam@example.org');
    }, 'api.test');
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: 'server' });
    expect(spy).toHaveBeenCalledWith('[api.test] Error: boom for [email]');
    spy.mockRestore();
  });
});
