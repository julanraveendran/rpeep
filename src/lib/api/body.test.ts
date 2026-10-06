import { describe, expect, it } from 'vitest';
import { MAX_BODY_BYTES, readJsonBody } from './body';

const request = (body: string, headers: Record<string, string> = {}) =>
  new Request('https://example.org/api/report', { method: 'POST', body, headers });

describe('readJsonBody', () => {
  it('limits request bodies to 32KB (PRD section 13)', () => {
    expect(MAX_BODY_BYTES).toBe(32768);
  });

  it('parses JSON', async () => {
    expect(await readJsonBody(request('{"a":1}'))).toEqual({ ok: true, value: { a: 1 } });
  });

  it('returns 400 for invalid JSON or an empty body', async () => {
    expect(await readJsonBody(request('{nope'))).toMatchObject({ ok: false, status: 400 });
    expect(await readJsonBody(request(''))).toMatchObject({ ok: false, status: 400 });
  });

  it('returns 413 for a body over the limit, whether or not Content-Length says so', async () => {
    const big = JSON.stringify({ x: 'a'.repeat(MAX_BODY_BYTES) });
    expect(await readJsonBody(request(big))).toMatchObject({ ok: false, status: 413, error: 'too_large' });
    expect(await readJsonBody(request('{}', { 'content-length': String(MAX_BODY_BYTES + 1) }))).toMatchObject({ ok: false, status: 413 });
  });

  it('counts bytes, not characters', async () => {
    const text = JSON.stringify({ x: '€'.repeat(12000) }); // about 36KB in UTF-8, under 32K characters
    expect(text.length).toBeLessThan(MAX_BODY_BYTES);
    expect(await readJsonBody(request(text))).toMatchObject({ ok: false, status: 413 });
  });

  it('accepts a body just under the limit', async () => {
    const text = JSON.stringify({ x: 'a'.repeat(MAX_BODY_BYTES - 20) });
    expect((await readJsonBody(request(text))).ok).toBe(true);
  });
});
