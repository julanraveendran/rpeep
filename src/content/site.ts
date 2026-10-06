/**
 * Single source of truth for brand, domain, company details, contact and links
 * (PRD sections 2, 4, 6 and 13). Every `[BRAND]`, `[DOMAIN]` and company
 * placeholder in the site, PDF and emails comes from here, so replacing the
 * values below replaces them everywhere. Do not hard-code any of this in
 * components.
 */

/** Which footer wording applies: a limited company or a sole trader. */
export type LegalForm = 'limited_company' | 'sole_trader';

const brandName = '[BRAND]'; // TODO(founder): choose the brand name
const domain = '[DOMAIN]'; // TODO(founder): buy the domain

export const site = {
  /** Product name. Placeholder until the founder chooses one. */
  name: brandName,
  /** Bare domain, no protocol, e.g. `example.co.uk`. */
  domain,
  locale: 'en-GB',
  /** One-line description used in the footer and as the default meta description. */
  description: `${brandName} helps Responsible Persons in England manage Residential PEEPs.`,
  /** Shown in the footer, PDF and emails. Same wording everywhere. */
  disclaimer: `${brandName} provides guidance, not legal advice.`,
} as const;

export const founder = {
  /** Used in the landing page signature and the email signature. */
  firstName: '[First name]', // TODO(founder): your first name
  role: 'Founder',
  /** Optional. Leave `null` unless the founder chooses to show a LinkedIn link. */
  linkedinUrl: null as string | null,
} as const;

export const company = {
  legalForm: 'limited_company' as LegalForm, // TODO(founder): limited company or sole trader
  /** Limited company. */
  legalEntityName: '[LEGAL ENTITY NAME]', // TODO(founder)
  companyNumber: '[NUMBER]', // TODO(founder)
  registeredOffice: '[ADDRESS]', // TODO(founder)
  /** Sole trader. Used only when `legalForm` is `sole_trader`. */
  soleTrader: {
    tradingName: '[TRADING NAME]',
    fullName: '[FULL NAME]',
    address: '[ADDRESS]',
  },
  /** TODO(founder): add the ICO registration number once it applies (PRD section 17). */
  icoRegistrationNumber: null as string | null,
} as const;

export const contact = {
  /** Monitored mailbox shown in the footer, forms and error messages. */
  email: `hello@${domain}`,
  /** Sender used for outgoing mail. Must match `EMAIL_FROM` in the environment. */
  from: `${brandName} <hello@${domain}>`,
} as const;

/** External links. Official regulation text always comes from legislation.gov.uk. */
export const links = {
  regulations: 'https://www.legislation.gov.uk/uksi/2025/797/made',
  regulationsTitle:
    'The Fire Safety (Residential Evacuation Plans) (England) Regulations 2025 (SI 2025/797)',
  ico: 'https://ico.org.uk',
} as const;

/** The date the regulations came into force, as shown on the landing page. */
export const regulationsInForce = '6 April 2026';

/** "Last reviewed" date on `/rpeep-regulations-explained` (ISO, `YYYY-MM-DD`). */
// TODO(founder): update this each time you re-check the guide against SI 2025/797.
export const guideLastReviewed = '2026-10-06';

export type NavItem = { label: string; href: string };

/** Header navigation (PRD section 6, item 1). */
export const headerNav: readonly NavItem[] = [
  { label: 'How it works', href: '/#how' },
  { label: 'Free checker', href: '/checker' },
  { label: 'Pilot', href: '/pilot' },
  { label: 'FAQ', href: '/#faq' },
];

export const headerCta: NavItem = { label: 'Check your building', href: '/checker' };

/** Footer link columns 2 and 3 (PRD section 6, item 11). */
export const footerNav = {
  product: [
    { label: 'Free checker', href: '/checker' },
    { label: 'Regulations explained', href: '/rpeep-regulations-explained' },
    { label: 'Pilot', href: '/pilot' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Accessibility', href: '/accessibility' },
  ],
} as const satisfies Record<string, readonly NavItem[]>;

/**
 * Bottom-row legal line in the footer, PDF and emails (PRD section 6, item 11).
 * `year` is passed in so this module stays free of clock reads.
 */
export function legalLine(year: number): string {
  if (company.legalForm === 'sole_trader') {
    const { tradingName, fullName, address } = company.soleTrader;
    return `${tradingName} is a trading name of ${fullName}, ${address}.`;
  }
  return `© ${year} ${company.legalEntityName}. Registered in England and Wales, company number ${company.companyNumber}. Registered office: ${company.registeredOffice}.`;
}
