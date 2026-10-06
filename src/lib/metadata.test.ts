import { describe, expect, it } from 'vitest';
import { pages } from '@/content/seo';
import { buildMetadata } from './metadata';

describe('buildMetadata (PRD section 14A)', () => {
  const meta = buildMetadata(pages.checker);

  it('sets an absolute title, the description and a canonical path', () => {
    expect(meta.title).toEqual({ absolute: pages.checker.title });
    expect(meta.description).toBe(pages.checker.description);
    expect(meta.alternates?.canonical).toBe('/checker');
  });

  it('sets Open Graph and Twitter card fields, including the generated image', () => {
    expect(meta.openGraph).toMatchObject({ type: 'website', locale: 'en_GB', title: pages.checker.title, url: '/checker', images: [{ url: '/opengraph-image', width: 1200, height: 630 }] });
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image', images: ['/opengraph-image'] });
  });

  it('marks a page noindex only when asked', () => {
    expect(meta.robots).toBeUndefined();
    expect(buildMetadata(pages.unsubscribe, { noindex: true }).robots).toEqual({ index: false, follow: false });
  });
});
