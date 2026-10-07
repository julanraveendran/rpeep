import { describe, expect, it } from 'vitest';
import { allStrings, collectLaunchEntries, findPlaceholders, PLACEHOLDER } from './launch-check';

const company = {
  legalForm: 'limited_company' as const,
  legalEntityName: 'Example Safety Ltd',
  companyNumber: '12345678',
  registeredOffice: '1 Example Street, London',
  soleTrader: { tradingName: '[TRADING NAME]', fullName: '[FULL NAME]', address: '[ADDRESS]' },
};
const content = {
  site: { name: 'Exemplar', domain: 'exemplar.co.uk' },
  founder: { firstName: 'Sam' },
  company,
  contact: { email: 'hello@exemplar.co.uk' },
  legalDocuments: { privacy: '{"text":"All set"}' },
};

describe('placeholder detection', () => {
  it.each(['[BRAND]', '[DOMAIN]', '[LEGAL ENTITY NAME]', '[NUMBER]', '[ADDRESS]', '[First name]', '[To be confirmed before launch]', 'hello@[DOMAIN]', 'x [BRAND] y'])(
    'flags "%s"',
    (value) => {
      expect(PLACEHOLDER.test(value)).toBe(true);
    },
  );

  it.each(['Exemplar', 'hello@exemplar.co.uk', 'See [ico.org.uk](https://ico.org.uk) for more', 'Regulation 3(1)(a) [sic](x)', ''])(
    'does not flag "%s"',
    (value) => {
      expect(PLACEHOLDER.test(value)).toBe(false);
    },
  );

  it('reports where each placeholder is and which ones, each once, even inside long text', () => {
    const problems = findPlaceholders({
      'site.name': '[BRAND]',
      ok: 'fine',
      'contact.email': 'hello@[DOMAIN]',
      long: `${'word '.repeat(200)}[BRAND] and [To be confirmed before launch] and [BRAND] again, see [link](https://example.org)`,
    });
    expect(problems).toEqual([
      { where: 'site.name', value: '[BRAND]' },
      { where: 'contact.email', value: '[DOMAIN]' },
      { where: 'long', value: '[BRAND], [To be confirmed before launch]' },
    ]);
  });
});

describe('collectLaunchEntries', () => {
  it('passes for finished content', () => {
    expect(findPlaceholders(collectLaunchEntries(content))).toEqual([]);
  });

  it('checks the company details that match a limited company, and ignores the sole trader ones', () => {
    const entries = collectLaunchEntries(content);
    expect(Object.keys(entries)).toEqual(
      expect.arrayContaining(['site.name', 'site.domain', 'founder.firstName', 'contact.email', 'company.legalEntityName', 'company.companyNumber', 'company.registeredOffice', 'legal.privacy']),
    );
    expect(Object.keys(entries).some((key) => key.includes('soleTrader'))).toBe(false);
    expect(findPlaceholders(collectLaunchEntries({ ...content, company: { ...company, companyNumber: '[NUMBER]' } })).map((problem) => problem.where)).toEqual(['company.companyNumber']);
  });

  it('checks the trading name, full name and address for a sole trader, and ignores the company ones', () => {
    const soleTrader = { ...company, legalForm: 'sole_trader' as const, legalEntityName: '[LEGAL ENTITY NAME]', companyNumber: '[NUMBER]', registeredOffice: '[ADDRESS]' };
    const entries = collectLaunchEntries({ ...content, company: soleTrader });
    expect(Object.keys(entries).some((key) => key.startsWith('company.legalEntityName'))).toBe(false);
    expect(findPlaceholders(entries).map((problem) => problem.where)).toEqual(['company.soleTrader.tradingName', 'company.soleTrader.fullName', 'company.soleTrader.address']);
  });

  it('flags a legal page that still says a provider region is to be confirmed', () => {
    const problems = findPlaceholders(collectLaunchEntries({ ...content, legalDocuments: { privacy: '{"region":"[To be confirmed before launch]"}', terms: '{"ok":true}' } }));
    expect(problems.map((problem) => problem.where)).toEqual(['legal.privacy']);
  });

  it('flags the placeholder brand and domain', () => {
    const problems = findPlaceholders(collectLaunchEntries({ ...content, site: { name: '[BRAND]', domain: '[DOMAIN]' }, contact: { email: 'hello@[DOMAIN]' }, founder: { firstName: '[First name]' } }));
    expect(problems.map((problem) => problem.where)).toEqual(['site.name', 'site.domain', 'founder.firstName', 'contact.email']);
  });
});

describe('allStrings', () => {
  it('joins every string in a nested document, one per line, and ignores numbers and booleans', () => {
    expect(allStrings({ title: 'A', sections: [{ blocks: [{ text: 'B' }, { items: ['C', 'D'] }] }], n: 1, ok: true, nothing: null })).toBe('A\nB\nC\nD');
  });

  it('does not let a placeholder match run across JSON arrays, as it would in a JSON string', () => {
    const doc = { items: ['first', 'second'], text: 'a [BRAND] b', more: [{ x: 'c [To be confirmed before launch]' }] };
    expect(findPlaceholders({ doc: allStrings(doc) })).toEqual([{ where: 'doc', value: '[BRAND], [To be confirmed before launch]' }]);
    expect(findPlaceholders({ doc: JSON.stringify(doc) }).length).toBe(1); // the JSON form still matches, but its value is long and confusing
    expect(findPlaceholders({ doc: allStrings({ list: ['x', 'y'], link: 'see [ico.org.uk](https://ico.org.uk)' }) })).toEqual([]);
  });
});
