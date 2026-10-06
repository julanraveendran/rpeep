import { describe, expect, it } from 'vitest';
import { pages } from '@/content/seo';
import robots from './robots';
import sitemap from './sitemap';

describe('sitemap', () => {
  const urls = sitemap().map((entry) => new URL(entry.url).pathname);

  it('lists the public pages', () => {
    for (const page of [pages.home, pages.checker, pages.guide, pages.pilot, pages.privacy, pages.terms, pages.cookies, pages.accessibility]) {
      expect(urls).toContain(page.path);
    }
  });

  it('leaves out the unsubscribe page, the thanks page and the API', () => {
    expect(urls).not.toContain('/unsubscribe');
    expect(urls).not.toContain('/pilot/thanks');
    expect(urls.some((path) => path.startsWith('/api'))).toBe(false);
  });
});

describe('robots', () => {
  it('allows all, disallows /api/ and /unsubscribe, and points at the sitemap', () => {
    const result = robots();
    expect(result.rules).toEqual({ userAgent: '*', allow: '/', disallow: ['/api/', '/unsubscribe'] });
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
