/** JSON-LD builders: PRD section 14A. */

import { faqs } from '@/content/faq';
import { guideLastReviewed } from '@/content/site';
import { contact, site } from '@/content/site';
import { pages } from '@/content/seo';
import { absoluteUrl } from '@/lib/site-url';

const context = 'https://schema.org';

/** On every page. */
export function organizationJsonLd() {
  return {
    '@context': context,
    '@type': 'Organization',
    name: site.name,
    url: absoluteUrl('/'),
    email: contact.email,
    description: site.description,
  };
}

/** On the home page FAQ. */
export function faqJsonLd() {
  return {
    '@context': context,
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

/** On /checker. */
export function webApplicationJsonLd() {
  return {
    '@context': context,
    '@type': 'WebApplication',
    name: pages.checker.title,
    url: absoluteUrl(pages.checker.path),
    description: pages.checker.description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
  };
}

/** On the guide page. */
export function articleJsonLd() {
  return {
    '@context': context,
    '@type': 'Article',
    headline: pages.guide.title,
    description: pages.guide.description,
    url: absoluteUrl(pages.guide.path),
    dateModified: guideLastReviewed,
    inLanguage: 'en-GB',
    publisher: { '@type': 'Organization', name: site.name, url: absoluteUrl('/') },
  };
}
