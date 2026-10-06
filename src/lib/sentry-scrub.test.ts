import { describe, expect, it } from 'vitest';
import { scrubBreadcrumb, scrubEvent, scrubText, scrubUrl, sentryDataCollection } from './sentry-scrub';

describe('scrubText and scrubUrl', () => {
  it('replaces email addresses', () => {
    expect(scrubText('Failed for sam.jones+test@example.co.uk and a@b.org.')).toBe('Failed for [email] and [email].');
    expect(scrubText('no personal data here')).toBe('no personal data here');
  });

  it('drops the query string and fragment from a URL', () => {
    expect(scrubUrl('https://example.co.uk/api/unsubscribe?token=abc.def#x')).toBe('https://example.co.uk/api/unsubscribe');
    expect(scrubUrl('/checker?utm_source=linkedin')).toBe('/checker');
    expect(scrubUrl('/checker#q-storeys')).toBe('/checker');
  });
});

describe('scrubEvent (beforeSend)', () => {
  const event = {
    event_id: 'abc',
    message: 'Report failed for sam@example.org',
    user: { email: 'sam@example.org', ip_address: '203.0.113.7', id: '1' },
    request: {
      url: 'https://example.co.uk/api/report?email=sam@example.org',
      method: 'POST',
      headers: { cookie: 'a=b', 'user-agent': 'x' },
      cookies: { session: 'secret' },
      data: { contact: { firstName: 'Sam', email: 'sam@example.org' } },
      query_string: 'email=sam@example.org',
    },
    exception: { values: [{ type: 'Error', value: 'Could not email sam@example.org', stacktrace: { frames: [{ filename: 'a.js', vars: { email: 'sam@example.org', count: 2 } }] } }] },
    breadcrumbs: [
      { category: 'navigation', message: 'to /pilot?email=sam@example.org', data: { to: '/pilot', url: 'https://x/pilot?token=abc' } },
    ],
    extra: { firstName: 'Sam', organisation: 'Example Homes', buildingRef: 'Example House', note: 'sam@example.org wrote', safe: 42 },
    tags: { context: 'report.email', email: 'sam@example.org' },
    level: 'error',
  };

  it('removes the user, cookies, headers, request body and query string', () => {
    const out = scrubEvent(event) as typeof event;
    expect(out).not.toHaveProperty('user');
    expect(out.request).toEqual({ url: 'https://example.co.uk/api/report', method: 'POST' });
  });

  it('removes email addresses from messages, exceptions, breadcrumbs, extra data and tags', () => {
    const json = JSON.stringify(scrubEvent(event));
    expect(json).not.toContain('sam@example.org');
    expect(json).toContain('Report failed for [email]');
    expect(json).toContain('Could not email [email]');
  });

  it('filters values stored under personal-data keys, and keeps the rest', () => {
    const out = scrubEvent(event) as typeof event;
    expect(out.extra).toEqual({ firstName: '[Filtered]', organisation: '[Filtered]', buildingRef: '[Filtered]', note: '[email] wrote', safe: 42 });
    expect(out.tags).toEqual({ context: 'report.email', email: '[Filtered]' });
    expect(JSON.stringify(out.exception)).toContain('"count":2');
    expect(out.level).toBe('error');
    expect(out.event_id).toBe('abc');
  });

  it('removes query strings from URLs in breadcrumbs', () => {
    const out = scrubEvent(event) as typeof event;
    expect(out.breadcrumbs[0]!.data.url).toBe('https://x/pilot');
  });

  it('does not change the event it is given, and copes with an empty event', () => {
    const copy = structuredClone(event);
    scrubEvent(event);
    expect(event).toEqual(copy);
    expect(scrubEvent({})).toEqual({});
  });
});

describe('scrubBreadcrumb and SDK settings', () => {
  it('removes personal data from a breadcrumb', () => {
    expect(scrubBreadcrumb({ message: 'click on sam@example.org', data: { password: 'x' } })).toEqual({ message: 'click on [email]', data: { password: '[Filtered]' } });
  });

  it('turns off collection of user info, cookies, headers, bodies and query strings in the SDK', () => {
    expect(sentryDataCollection).toEqual({ userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false });
  });
});
