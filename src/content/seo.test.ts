import { describe, expect, it } from 'vitest';
import { pages } from './seo';

describe('page metadata (PRD section 14A)', () => {
  it.each(Object.entries(pages))('%s has a title of at most 60 characters and a description of at most 155', (_name, page) => {
    expect(page.title.length).toBeLessThanOrEqual(60);
    expect(page.title.length).toBeGreaterThan(0);
    expect(page.description.length).toBeLessThanOrEqual(155);
    expect(page.description.length).toBeGreaterThan(0);
  });

  it('gives every page a unique title, description and path', () => {
    const all = Object.values(pages);
    for (const key of ['title', 'description', 'path'] as const) {
      expect(new Set(all.map((page) => page[key])).size, key).toBe(all.length);
    }
  });

  it('uses the exact titles and descriptions from the PRD for the four main pages', () => {
    expect(pages.home.title).toBe('RPEEP compliance for Responsible Persons | [BRAND]');
    expect(pages.home.description).toBe(
      'Manage Residential PEEPs under the 2025 regulations. Check if your building is in scope in 2 minutes with our free tool.',
    );
    expect(pages.checker.title).toBe('Free RPEEP scope checker — is my building in scope?');
    expect(pages.guide.title).toBe('RPEEP regulations explained in plain English');
    expect(pages.pilot.title).toBe('Join the [BRAND] founding pilot');
    expect(pages.pilot.description).toBe('Apply to help shape a tool for managing RPEEPs, consent, fire service information and reviews.');
  });
});
