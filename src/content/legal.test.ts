import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { accessibility, cookies, privacy, terms, TO_CONFIRM, type LegalDocument } from './legal';
import { company, contact, controllerLines, legalVersion, site } from './site';

const flat = (doc: LegalDocument) =>
  JSON.stringify(doc)
    .replace(/\\"/g, '"');
const headings = (doc: LegalDocument) => doc.sections.map((section) => section.heading);

describe('privacy notice (PRD section 13)', () => {
  const text = flat(privacy);

  it('says who the controller is, with the legal entity, address and contact email', () => {
    expect(controllerLines()).toEqual([company.legalEntityName, `Company number ${company.companyNumber}`, `Registered office: ${company.registeredOffice}`, contact.email]);
    expect(text).toContain(company.legalEntityName);
    expect(text).toContain(company.registeredOffice);
    expect(text).toContain(contact.email);
  });

  it('says what is collected, including hashed IP, UTM values and cookieless analytics, and that no resident or health data is collected', () => {
    expect(text).toContain('first name, work email address, organisation, role, organisation type');
    expect(text).toContain('answers about the building');
    expect(text).toContain('salted hash of your IP address');
    expect(text).toContain('We never store the IP address itself');
    expect(text).toContain('utm_source, utm_medium and utm_campaign');
    expect(text).toContain('cookieless analytics');
    expect(text).toContain('never collects resident or health data');
    expect(text).toContain('Please do not enter resident names, conditions, flat numbers or any health information');
  });

  it('gives each purpose its lawful basis', () => {
    expect(text).toContain('Send you the report you asked for');
    expect(text).toContain('Legitimate interests, and steps taken at your request');
    expect(text).toContain('Review your pilot application');
    expect(text).toContain('Consent, given by ticking the box. The box is unticked by default');
    expect(text).toContain('Keep the site secure and prevent abuse');
  });

  it('names all seven providers, with Supabase in London and the rest to be confirmed', () => {
    for (const provider of ['Vercel', 'Supabase', 'Resend', 'Cloudflare', 'Upstash', 'Plausible', 'Sentry']) expect(text, provider).toContain(provider);
    const table = privacy.sections.find((section) => section.id === 'processors')?.blocks.find((block) => block.type === 'table');
    expect(table && table.type === 'table' && table.rows.find((row) => row[0] === 'Supabase')?.[2]).toBe('London');
    expect(text).toContain(TO_CONFIRM);
    expect(text).toContain('safeguards are in place for that transfer');
  });

  it('keeps TODO(founder) markers in the source for the provider regions and the legal review', () => {
    const source = readFileSync(new URL('./legal.ts', import.meta.url), 'utf8');
    expect(source).toContain("TODO(founder): confirm each provider's region and transfer terms");
    expect(source).toContain('TODO(founder): have the terms and the privacy notice reviewed');
  });

  it('states the retention periods and the rights, with a link to the ICO', () => {
    expect(text).toContain('24 months');
    expect(text).toContain('indefinitely');
    for (const right of ['access the personal data', 'have it corrected', 'have it deleted', 'object to how we use it', 'withdraw your consent']) expect(text).toContain(right);
    expect(text).toContain('[ico.org.uk](https://ico.org.uk)');
  });

  it('has a version and last-updated date', () => {
    expect(legalVersion.version).toMatch(/^\d+\.\d+$/);
    expect(legalVersion.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('terms of use (PRD section 13)', () => {
  it('covers guidance only, no reliance, the Responsible Person, limited liability and the governing law', () => {
    expect(headings(terms)).toEqual(['Guidance only', 'No reliance', 'The Responsible Person stays responsible', 'Our liability', 'Governing law', 'Contact']);
    const text = flat(terms);
    expect(text).toContain('provides guidance, not legal advice');
    expect(text).toContain('Confirm the scope and your duties with a competent fire safety professional');
    expect(text).toContain('Responsibility for compliance remains with the Responsible Person');
    expect(text).toContain('To the extent the law allows');
    expect(text).toContain('law of England and Wales');
  });
});

describe('cookie statement (PRD section 13)', () => {
  it('lists the storage the site sets, says analytics are cookieless, and shows no banner', () => {
    const text = flat(cookies);
    expect(text).toContain('rpeep-checker-v1');
    expect(text).toContain('sessionStorage');
    expect(text).toContain('rpeep-utm-v1');
    expect(text).toContain('Cloudflare Turnstile');
    expect(text).toContain('cookieless');
    expect(text).toContain('does not show a cookie banner');
  });
});

describe('accessibility statement (PRD section 13)', () => {
  it('states the WCAG 2.2 AA target, no known issues at launch and where to report problems', () => {
    const text = flat(accessibility);
    expect(text).toContain('WCAG) 2.2 at level AA');
    expect(text).toContain('We know of no accessibility problems at launch');
    expect(text).toContain(contact.email);
  });
});

describe('all legal copy', () => {
  it('uses plain English: no banned words, and no mention of an employer', () => {
    const everything = [privacy, terms, cookies, accessibility].map(flat).join(' ').toLowerCase();
    for (const word of ['revolutionary', 'game-changing', 'seamless', 'cutting-edge', 'guarantee compliance']) expect(everything).not.toContain(word);
    expect(everything).toContain(site.name.toLowerCase());
  });
});
