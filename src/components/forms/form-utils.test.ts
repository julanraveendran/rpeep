import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiMessages, failureMessage, fieldId, postJson, summariseErrors } from './form-utils';

afterEach(() => vi.unstubAllGlobals());

const stubFetch = (response: Response | Error) =>
  vi.stubGlobal('fetch', vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  }));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('fieldId and summariseErrors', () => {
  it('makes ids from field names, replacing dots', () => {
    expect(fieldId('firstName')).toBe('field-firstName');
    expect(fieldId('contact.email')).toBe('field-contact-email');
  });

  it('lists every error with its field id, including nested ones', () => {
    const errors = {
      firstName: { type: 'required', message: 'Enter your first name.' },
      contact: { email: { type: 'x', message: 'Enter a valid email address.' } },
      empty: undefined,
    };
    expect(summariseErrors(errors as never)).toEqual([
      { id: 'field-firstName', message: 'Enter your first name.' },
      { id: 'field-contact-email', message: 'Enter a valid email address.' },
    ]);
  });
});

describe('postJson', () => {
  it('returns the data for a 200 with ok: true', async () => {
    stubFetch(json({ ok: true, reportId: 'r1' }));
    expect(await postJson('/api/report', {})).toEqual({ ok: true, data: { ok: true, reportId: 'r1' } });
  });

  it('sends JSON with a JSON content type', async () => {
    const fetchMock = vi.fn(async () => json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    await postJson('/api/pilot', { a: 1 });
    expect(fetchMock).toHaveBeenCalledWith('/api/pilot', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"a":1}' });
  });

  it.each([
    [400, { ok: false, error: 'validation', fields: { 'contact.email': 'Bad' } }, { kind: 'validation', fields: { 'contact.email': 'Bad' } }],
    [403, { ok: false, error: 'bot_check' }, { kind: 'bot_check' }],
    [413, { ok: false, error: 'too_large' }, { kind: 'too_large' }],
    [429, { ok: false, error: 'rate_limited' }, { kind: 'rate_limited' }],
    [500, { ok: false, error: 'server' }, { kind: 'server' }],
    [502, { ok: false }, { kind: 'server' }],
  ])('sorts a %i response into %j', async (status, body, failure) => {
    stubFetch(json(body, status));
    expect(await postJson('/x', {})).toEqual({ ok: false, failure });
  });

  it('treats a network error, or a body that is not JSON, as a server failure', async () => {
    stubFetch(new Error('offline'));
    expect(await postJson('/x', {})).toEqual({ ok: false, failure: { kind: 'server' } });
    stubFetch(new Response('<html>', { status: 200 }));
    expect(await postJson('/x', {})).toEqual({ ok: false, failure: { kind: 'server' } });
  });

  it('does not treat a 200 without ok: true as success', async () => {
    stubFetch(json({ hello: 'world' }));
    expect(await postJson('/x', {})).toEqual({ ok: false, failure: { kind: 'server' } });
  });
});

describe('failureMessage (PRD section 12)', () => {
  it('uses the PRD message for each failure', () => {
    expect(failureMessage({ kind: 'bot_check' }, 'x')).toBe("We couldn't verify you're human. Please refresh and try again.");
    expect(failureMessage({ kind: 'rate_limited' }, 'x')).toBe('Too many requests. Please wait 10 minutes and try again.');
    expect(failureMessage({ kind: 'server' }, apiMessages.network)).toBe(
      "Something went wrong and your report wasn't sent. Please try again. If it keeps happening, email hello@[DOMAIN].",
    );
  });
});
