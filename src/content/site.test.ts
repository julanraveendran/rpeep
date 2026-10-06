import { describe, expect, it } from 'vitest';
import { company, contact, legalLine, site } from './site';

describe('site config', () => {
  it('builds the contact email and sender from the domain', () => {
    expect(contact.email).toBe(`hello@${site.domain}`);
    expect(contact.from).toBe(`${site.name} <hello@${site.domain}>`);
  });

  it('builds the footer legal line from the company details', () => {
    expect(legalLine(2026)).toBe(
      `© 2026 ${company.legalEntityName}. Registered in England and Wales, company number ${company.companyNumber}. Registered office: ${company.registeredOffice}.`,
    );
  });
});
