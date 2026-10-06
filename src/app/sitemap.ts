import type { MetadataRoute } from 'next';
import { pages } from '@/content/seo';
import { guideLastReviewed } from '@/content/site';
import { absoluteUrl } from '@/lib/site-url';

/** Every public page. Left out: /unsubscribe, /pilot/thanks and the API (PRD section 14A). */
export default function sitemap(): MetadataRoute.Sitemap {
  const list = [pages.home, pages.checker, pages.guide, pages.pilot, pages.privacy, pages.terms, pages.cookies, pages.accessibility];
  return list.map((page) => ({
    url: absoluteUrl(page.path),
    ...(page === pages.guide ? { lastModified: guideLastReviewed } : {}),
  }));
}
