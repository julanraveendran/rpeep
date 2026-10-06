/**
 * Dropdown, checkbox and radio options for the report form (PRD section 9A) and the pilot
 * form (section 10), plus the consent wording. The keys are the values stored in the database
 * and sent to the API; the strings are what the visitor sees.
 */

import { site } from '@/content/site';

export const roleLabels = {
  head_building_safety: 'Head or Director of Building Safety',
  building_fire_safety_manager: 'Building or Fire Safety Manager / Advisor',
  head_compliance: 'Head of Compliance',
  property_block_manager: 'Property or Block Manager',
  operations_manager: 'Operations Manager',
  fire_risk_assessor: 'Fire risk assessor or consultant',
  other: 'Other',
} as const;

export const orgTypeLabels = {
  housing_association: 'Housing association',
  local_authority_almo: 'Local authority or ALMO',
  managing_agent: 'Managing agent',
  build_to_rent: 'Build-to-rent operator',
  rtm_company: "Residents' management or RTM company",
  freeholder_investor: 'Freeholder or investor',
  fire_safety_consultancy: 'Fire safety consultancy',
  other: 'Other',
} as const;

export const buildingsBandLabels = {
  '1': '1',
  '2-5': '2–5',
  '6-20': '6–20',
  '21-100': '21–100',
  'over-100': 'More than 100',
  'not-sure': 'Not sure',
} as const;

/** P8: how the visitor manages RPEEPs today. Choose at least one. */
export const currentMethodLabels = {
  spreadsheets: 'Spreadsheets',
  paper_word: 'Paper or Word templates',
  compliance_software: 'Our existing compliance software',
  consultant: 'A consultant or fire risk assessor handles it',
  not_started: "We haven't started yet",
  other: 'Other',
} as const;

/** P10: the features that matter most. Choose up to three. */
export const featureLabels = {
  find_residents: 'Finding and contacting residents',
  record_consent: 'Recording consent',
  pcfra_forms: 'PCFRA forms',
  evacuation_statements: 'Emergency evacuation statements',
  fire_service_sharing: 'Sharing information with the fire service',
  review_reminders: 'Review reminders',
  building_plan: 'Building emergency evacuation plan',
  audit_evidence_pack: 'Evidence pack for audits',
} as const;

/** P11: help tracking fire risk assessment actions. */
export const fraTrackerLabels = {
  yes_very: 'Yes, very',
  maybe: 'Maybe',
  no: 'No',
} as const;

/** P12: expected price per building per year. */
export const priceBandLabels = {
  under_100: 'Under £100',
  '100_250': '£100–£250',
  '250_500': '£250–£500',
  over_500: 'Over £500',
  not_sure: 'Not sure',
} as const;

/** P14: when the visitor would want to start. */
export const startTimingLabels = {
  now: 'Now',
  within_3_months: 'Within 3 months',
  within_6_months: 'Within 6 months',
  exploring: 'Just exploring',
} as const;

/** The unticked-by-default updates checkbox, same wording on both forms (PRD sections 9A and 10, P15). */
export const marketingConsentLabel = `Send me occasional updates about ${site.name} and the pilot. Unsubscribe any time.`;

/** Stored with every row so we know which wording the person agreed to. */
export const consentTextVersions = {
  reportForm: 'report-form-v1',
  pilotForm: 'pilot-form-v1',
} as const;

export const willingToPayLabel = "I'd consider a paid pilot if it meets our needs.";

/** Options in display order, for building `<select>`, radio and checkbox lists. */
export function toOptions<T extends Record<string, string>>(labels: T): { value: keyof T & string; label: string }[] {
  return Object.entries(labels).map(([value, label]) => ({ value: value as keyof T & string, label }));
}

/** The keys of a label record as a non-empty tuple, which is what `z.enum` needs. */
export function keysOf<T extends Record<string, string>>(labels: T): [keyof T & string, ...(keyof T & string)[]] {
  return Object.keys(labels) as [keyof T & string, ...(keyof T & string)[]];
}
