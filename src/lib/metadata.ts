import type { Metadata } from 'next';
import type { PageMeta } from '@/content/seo';
import { site } from '@/content/site';

/** The generated Open Graph image (src/app/opengraph-image.tsx). Set on each page because a page's `openGraph` replaces the parent's. */
const OG_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: site.name };

/** Title, description, canonical URL, Open Graph and Twitter card for a page (PRD section 14A). */
export function buildMetadata(page: PageMeta, options: { noindex?: boolean } = {}): Metadata {
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: 'website',
      siteName: site.name,
      locale: 'en_GB',
      title: page.title,
      description: page.description,
      url: page.path,
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description, images: [OG_IMAGE.url] },
    ...(options.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
