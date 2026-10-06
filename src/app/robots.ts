import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site-url';

/** Allow all, but not the API or the unsubscribe page (PRD section 14A). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/unsubscribe'] },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
