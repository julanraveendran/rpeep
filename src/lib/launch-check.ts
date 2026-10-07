/**
 * Launch gate (PRD sections 16 and 17): the site must not go live while a placeholder is still in the content.
 * Pure, so it can be tested. `scripts/check-launch.ts` runs it on the real content before every production deploy.
 */

/** `[BRAND]`, `[DOMAIN]`, `[LEGAL ENTITY NAME]`, `[To be confirmed before launch]`... but not a Markdown link, `[label](url)`. */
export const PLACEHOLDER = /\[[^\]\n]+\](?!\()/;

export type LaunchProblem = { where: string; value: string };

/** Every piece of text in a nested object, one per line, so a placeholder is judged as written and not across JSON syntax. */
export function allStrings(value: unknown): string {
  const found: string[] = [];
  const visit = (item: unknown) => {
    if (typeof item === 'string') found.push(item);
    else if (Array.isArray(item)) item.forEach(visit);
    else if (item && typeof item === 'object') Object.values(item).forEach(visit);
  };
  visit(value);
  return found.join('\n');
}

const PLACEHOLDER_GLOBAL = new RegExp(PLACEHOLDER.source, 'g');

/** Every entry whose text still contains a placeholder, with the placeholders found in it. */
export function findPlaceholders(entries: Readonly<Record<string, string>>): LaunchProblem[] {
  const problems: LaunchProblem[] = [];
  for (const [where, text] of Object.entries(entries)) {
    const found = [...new Set(text.match(PLACEHOLDER_GLOBAL) ?? [])];
    if (found.length > 0) problems.push({ where, value: found.join(', ') });
  }
  return problems;
}

/** Entries with nothing in them, which a placeholder check alone would let through. */
export function findEmpty(entries: Readonly<Record<string, string>>): LaunchProblem[] {
  return Object.entries(entries)
    .filter(([, text]) => text.trim() === '')
    .map(([where]) => ({ where, value: '(empty)' }));
}

/** Everything that stops a launch: empty values and placeholders. */
export function findLaunchProblems(entries: Readonly<Record<string, string>>): LaunchProblem[] {
  return [...findEmpty(entries), ...findPlaceholders(entries)];
}

const BARE_DOMAIN = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

/**
 * Problems with the live address (`SITE_URL`) and the domain in `src/content/site.ts`: the address must be `https://`
 * with a bare host and no path, the domain must be a bare host name (no `https://`, no slash), and the two must name the
 * same site. `www.` is ignored when they are compared, because either can be the primary address.
 */
export function checkSiteUrl(siteUrl: string, domain: string): string[] {
  const problems: string[] = [];
  if (!BARE_DOMAIN.test(domain)) problems.push(`site.domain "${domain}" must be a bare domain such as example.co.uk, with no https:// and no slash.`);
  let url: URL | null = null;
  try {
    url = new URL(siteUrl);
  } catch {
    // reported below
  }
  if (!url || url.protocol !== 'https:' || url.pathname !== '/' || url.search !== '' || url.hash !== '' || url.username !== '') {
    problems.push(`SITE_URL "${siteUrl}" must be your live address, starting with https:// and with no path, for example https://example.co.uk`);
    return problems;
  }
  const bare = (host: string) => host.toLowerCase().replace(/^www\./, '');
  if (BARE_DOMAIN.test(domain) && bare(url.hostname) !== bare(domain)) {
    problems.push(`SITE_URL is on ${url.hostname} but site.domain is ${domain}. They must be the same site.`);
  }
  return problems;
}

type Company = {
  legalForm: 'limited_company' | 'sole_trader';
  legalEntityName: string;
  companyNumber: string;
  registeredOffice: string;
  soleTrader: { tradingName: string; fullName: string; address: string };
};

/**
 * The values that must be real at launch: brand, domain, the founder's first name, the company or trading details that
 * match the chosen legal form, and the legal pages (which still say "to be confirmed" for provider regions until the
 * founder has checked them).
 */
export function collectLaunchEntries(content: {
  site: { name: string; domain: string };
  founder: { firstName: string };
  company: Company;
  contact: { email: string };
  legalDocuments: Readonly<Record<string, string>>;
}): Record<string, string> {
  const { site, founder, company, contact, legalDocuments } = content;
  const entries: Record<string, string> = {
    'site.name': site.name,
    'site.domain': site.domain,
    'founder.firstName': founder.firstName,
    'contact.email': contact.email,
  };
  if (company.legalForm === 'limited_company') {
    entries['company.legalEntityName'] = company.legalEntityName;
    entries['company.companyNumber'] = company.companyNumber;
    entries['company.registeredOffice'] = company.registeredOffice;
  } else {
    entries['company.soleTrader.tradingName'] = company.soleTrader.tradingName;
    entries['company.soleTrader.fullName'] = company.soleTrader.fullName;
    entries['company.soleTrader.address'] = company.soleTrader.address;
  }
  for (const [name, text] of Object.entries(legalDocuments)) entries[`legal.${name}`] = text;
  return entries;
}
