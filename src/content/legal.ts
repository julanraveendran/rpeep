/**
 * Privacy notice, terms, cookie statement and accessibility statement: PRD section 13.
 * Plain English. `[label](url)` in a text becomes a link.
 *
 * TODO(founder): have the terms and the privacy notice reviewed before launch (PRD section 17).
 * TODO(founder): confirm each provider's region and transfer terms in the privacy notice, and audit the cookies page in browser dev tools.
 */

import { company, contact, controllerLines, links, site } from '@/content/site';

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: readonly string[] }
  | { type: 'table'; caption: string; headers: readonly string[]; rows: readonly (readonly string[])[] };

export type LegalSection = { id: string; heading: string; blocks: readonly LegalBlock[] };
export type LegalDocument = { title: string; intro: string; sections: readonly LegalSection[] };

/** Shown where a provider's region is still to be confirmed by the founder. */
export const TO_CONFIRM = '[To be confirmed before launch]';

export const privacy: LegalDocument = {
  title: 'Privacy notice',
  intro: `This notice explains what personal data ${site.name} collects, why, who handles it and how long we keep it. The site collects only business contact details and building facts. It never collects resident or health data.`,
  sections: [
    {
      id: 'controller',
      heading: 'Who is responsible for your data',
      blocks: [
        { type: 'p', text: 'The controller of your personal data is:' },
        { type: 'ul', items: controllerLines() },
        ...(company.icoRegistrationNumber ? [{ type: 'p' as const, text: `ICO registration number: ${company.icoRegistrationNumber}.` }] : []),
      ],
    },
    {
      id: 'collect',
      heading: 'What we collect',
      blocks: [
        { type: 'p', text: 'When you ask for a report, we collect:' },
        {
          type: 'ul',
          items: [
            'your first name, work email address, organisation, role, organisation type and the number of buildings that may be in scope',
            'whether you ticked the box to receive occasional updates',
            'your answers about the building (the checker asks about the building only), the building name or reference if you gave one, and your readiness answers if you completed that check',
          ],
        },
        { type: 'p', text: 'When you apply for the pilot, we collect the same contact details, plus your last name and your answers to the survey questions: how you manage RPEEPs today, the hardest part, the features that matter most, your interest in fire risk assessment action tracking, your expected price band, whether you would consider a paid pilot, and when you would want to start.' },
        { type: 'p', text: 'We also collect:' },
        {
          type: 'ul',
          items: [
            'a salted hash of your IP address, which we use to stop abuse. We never store the IP address itself.',
            'the campaign values (utm_source, utm_medium and utm_campaign) from the link you arrived by, if there are any',
            'cookieless analytics about how the site is used. These do not include your name, email or organisation.',
          ],
        },
        { type: 'p', text: 'Please do not enter resident names, conditions, flat numbers or any health information anywhere on this site. We do not ask for it and do not want it.' },
      ],
    },
    {
      id: 'why',
      heading: 'Why we use it, and our lawful basis',
      blocks: [
        {
          type: 'table',
          caption: 'Purposes and lawful bases',
          headers: ['What we do', 'Lawful basis'],
          rows: [
            ['Send you the report you asked for', 'Legitimate interests, and steps taken at your request'],
            ['Review your pilot application', 'Legitimate interests'],
            ['Send you occasional updates', 'Consent, given by ticking the box. The box is unticked by default and you can withdraw consent at any time.'],
            ['Keep the site secure and prevent abuse', 'Legitimate interests'],
          ],
        },
      ],
    },
    {
      id: 'processors',
      heading: 'Who handles your data for us',
      blocks: [
        { type: 'p', text: 'We use these providers to run the site. Each acts on our instructions.' },
        {
          type: 'table',
          caption: 'Providers and where they may process data',
          headers: ['Provider', 'What it does', 'Where it may process data'],
          rows: [
            ['Vercel', 'Hosting', 'Our server functions run in London. Other hosting locations: ' + TO_CONFIRM],
            ['Supabase', 'Database', 'London'],
            ['Resend', 'Sends email', TO_CONFIRM],
            ['Cloudflare', 'Turnstile bot check on the forms', TO_CONFIRM],
            ['Upstash', 'Rate limiting', TO_CONFIRM],
            ['Plausible', 'Cookieless analytics', TO_CONFIRM],
            ['Sentry', 'Error logs, with personal data removed', TO_CONFIRM],
          ],
        },
        { type: 'p', text: 'Where a provider may process data outside the UK, safeguards are in place for that transfer.' },
      ],
    },
    {
      id: 'retention',
      heading: 'How long we keep your data',
      blocks: [
        { type: 'p', text: 'We delete report requests and pilot applications 24 months after you submit them.' },
        { type: 'p', text: 'If you unsubscribe, we keep your email address on a suppression list indefinitely, so that we honour your choice.' },
      ],
    },
    {
      id: 'rights',
      heading: 'Your rights',
      blocks: [
        { type: 'p', text: 'You have the right to:' },
        { type: 'ul', items: ['access the personal data we hold about you', 'have it corrected', 'have it deleted', 'object to how we use it', 'withdraw your consent at any time'] },
        { type: 'p', text: `To use any of these rights, email ${contact.email}. You can also unsubscribe in one click from any update email.` },
        { type: 'p', text: `You can complain to the Information Commissioner's Office (ICO) at [ico.org.uk](${links.ico}).` },
      ],
    },
  ],
};

export const terms: LegalDocument = {
  title: 'Terms of use',
  intro: `These terms apply when you use ${site.name}, including the free RPEEP Scope Checker and the reports it produces.`,
  sections: [
    {
      id: 'guidance',
      heading: 'Guidance only',
      blocks: [{ type: 'p', text: `${site.name} provides guidance, not legal advice. The checker and its reports are guidance based on your answers and on SI 2025/797.` }],
    },
    {
      id: 'reliance',
      heading: 'No reliance',
      blocks: [
        { type: 'p', text: 'Do not rely on the checker or a report as your only check. Confirm the scope and your duties with a competent fire safety professional.' },
        { type: 'p', text: 'The checker gives a result from the answers you give. If an answer is wrong or changes, the result may be wrong.' },
      ],
    },
    {
      id: 'responsibility',
      heading: 'The Responsible Person stays responsible',
      blocks: [{ type: 'p', text: 'Responsibility for compliance remains with the Responsible Person. Using this site does not transfer it to us.' }],
    },
    {
      id: 'liability',
      heading: 'Our liability',
      blocks: [
        { type: 'p', text: 'Nothing in these terms limits or excludes liability that cannot be limited or excluded by law.' },
        { type: 'p', text: 'To the extent the law allows, we are not liable for loss that arises from your use of this site or from relying on the checker or a report.' },
      ],
    },
    {
      id: 'law',
      heading: 'Governing law',
      blocks: [{ type: 'p', text: 'These terms are governed by the law of England and Wales.' }],
    },
    {
      id: 'contact',
      heading: 'Contact',
      blocks: [{ type: 'p', text: `Questions about these terms: ${contact.email}.` }],
    },
  ],
};

export const cookies: LegalDocument = {
  title: 'Cookie statement',
  intro: `This page lists every cookie and every item of browser storage that ${site.name} sets.`,
  sections: [
    {
      id: 'analytics',
      heading: 'Analytics',
      blocks: [{ type: 'p', text: 'Our analytics (Plausible) are cookieless. They set no cookies and store nothing on your device.' }],
    },
    {
      id: 'storage',
      heading: 'What this site stores on your device',
      blocks: [
        {
          type: 'table',
          caption: 'Browser storage used by this site',
          headers: ['Name', 'Kind', 'What it is for', 'How long it lasts'],
          rows: [
            ['rpeep-checker-v1', 'sessionStorage', 'Keeps your answers while you use the checker, so a refresh does not lose your progress. It is strictly necessary for the checker to work.', 'Until you close the tab or choose "Start again"'],
            ['rpeep-utm-v1', 'sessionStorage', 'Remembers the campaign values in the link you arrived by, so a report request or pilot application can show which link it came from.', 'Until you close the tab'],
            ['Cloudflare Turnstile', 'Set by Cloudflare', `The bot check on the forms may set or read its own browser storage. ${TO_CONFIRM}`, TO_CONFIRM],
          ],
        },
        { type: 'p', text: 'Both items we set stay in your browser tab. They are not sent to advertisers.' },
      ],
    },
    {
      id: 'banner',
      heading: 'Consent banner',
      blocks: [{ type: 'p', text: 'We use no cookies for analytics or advertising, so this site does not show a cookie banner.' }],
    },
  ],
};

export const accessibility: LegalDocument = {
  title: 'Accessibility statement',
  intro: `We want ${site.name} to be usable by everyone, including people who use assistive technology.`,
  sections: [
    {
      id: 'standard',
      heading: 'Our target',
      blocks: [
        { type: 'p', text: 'We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA.' },
        { type: 'p', text: 'The site works with a keyboard alone, shows a visible focus indicator, announces each step of the checker to screen readers, never uses colour as the only signal, and respects your reduced-motion setting. It works at 320px wide and at 400% zoom without sideways scrolling.' },
      ],
    },
    {
      id: 'issues',
      heading: 'Known issues',
      blocks: [{ type: 'p', text: 'We know of no accessibility problems at launch.' }],
    },
    {
      id: 'report',
      heading: 'Tell us about a problem',
      blocks: [{ type: 'p', text: `If you find something that is hard to use, email ${contact.email} and tell us what you were trying to do. We will fix it.` }],
    },
  ],
};
