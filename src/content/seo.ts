/**
 * Page titles and meta descriptions: PRD section 14A. Titles are at most 60 characters and
 * descriptions at most 155 (checked in seo.test.ts).
 */

import { site } from '@/content/site';

export type PageMeta = { title: string; description: string; path: string };

export const pages = {
  home: {
    path: '/',
    title: `RPEEP compliance for Responsible Persons | ${site.name}`,
    description:
      'Manage Residential PEEPs under the 2025 regulations. Check if your building is in scope in 2 minutes with our free tool.',
  },
  checker: {
    path: '/checker',
    title: 'Free RPEEP scope checker — is my building in scope?',
    description:
      'Answer up to six questions to see if your building is covered by the Residential Evacuation Plans Regulations. Free PDF report.',
  },
  guide: {
    path: '/rpeep-regulations-explained',
    title: 'RPEEP regulations explained in plain English',
    description:
      'What the Fire Safety (Residential Evacuation Plans) (England) Regulations 2025 require, which buildings are covered, and key duties.',
  },
  pilot: {
    path: '/pilot',
    title: `Join the ${site.name} founding pilot`,
    description: 'Apply to help shape a tool for managing RPEEPs, consent, fire service information and reviews.',
  },
  privacy: {
    path: '/privacy',
    title: `Privacy notice | ${site.name}`,
    description: 'What we collect, why, where it is stored and for how long, and your rights.',
  },
  terms: {
    path: '/terms',
    title: `Terms of use | ${site.name}`,
    description: 'The terms for using the free RPEEP scope checker and this website. Guidance only, not legal advice.',
  },
  cookies: {
    path: '/cookies',
    title: `Cookie statement | ${site.name}`,
    description: 'The cookies and browser storage this site uses. Analytics are cookieless.',
  },
  accessibility: {
    path: '/accessibility',
    title: `Accessibility statement | ${site.name}`,
    description: 'Our WCAG 2.2 AA target, known issues, and how to tell us about a problem.',
  },
  unsubscribe: {
    path: '/unsubscribe',
    title: `Unsubscribe | ${site.name}`,
    description: 'Unsubscribe from updates.',
  },
} as const satisfies Record<string, PageMeta>;
