import { describe, expect, it } from 'vitest';
import { absoluteUrl, FALLBACK_SITE_URL, getSiteUrl } from './site-url';

describe('getSiteUrl', () => {
  it('uses NEXT_PUBLIC_SITE_URL, as an origin', () => {
    expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://example.co.uk/' })).toBe('https://example.co.uk');
  });

  it('falls back to localhost when it is missing, empty or still a placeholder', () => {
    expect(getSiteUrl({})).toBe(FALLBACK_SITE_URL);
    expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: '  ' })).toBe(FALLBACK_SITE_URL);
    expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://[DOMAIN]' })).toBe(FALLBACK_SITE_URL);
  });

  it('builds absolute URLs', () => {
    expect(absoluteUrl('/pilot?utm_source=report_email', { NEXT_PUBLIC_SITE_URL: 'https://example.co.uk' })).toBe(
      'https://example.co.uk/pilot?utm_source=report_email',
    );
  });
});
