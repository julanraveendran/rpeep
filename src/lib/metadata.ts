import type { Metadata } from 'next';
import type { PageMeta } from '@/content/seo';
import { site } from '@/content/site';

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
    },
    twitter: { card: 'summary_large_image', title: page.title, description: page.description },
    ...(options.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
