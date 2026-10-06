/**
 * Regulatory copy: PRD sections 7A, 7C and 7D.
 *
 * Every regulatory statement shown on the site, in the PDF and in emails comes from this
 * file, and must match the PRD word for word in meaning, with its regulation number.
 * Source: the Fire Safety (Residential Evacuation Plans) (England) Regulations 2025,
 * SI 2025/797. Do not edit the wording without showing the diff and the PRD section it matches.
 *
 * TODO(founder): check every sentence in this file against SI 2025/797 before launch (PRD section 17).
 */

import type { MissingCode, NoteCode, ReasonCode, ScopeStatus } from '@/lib/scope/engine';

// ---------------------------------------------------------------------------
// 7C. Exact result copy
// ---------------------------------------------------------------------------

/** Headline for each result (PRD section 7C, "Result headlines"). */
export const resultHeadlines: Record<ScopeStatus, string> = {
  in_scope: 'Your building is in scope',
  not_in_scope: 'Your building is not in scope of these regulations',
  cannot_confirm: "We can't confirm yet — we need a little more information",
};

/** Why a building is, or is not, in scope. Keyed by `ScopeResult.reasons`. */
export const reasonCopy: Record<ReasonCode, string> = {
  NOT_ENGLAND:
    'The regulations apply in England only (regulation 1(3)). Different rules apply in Wales, Scotland and Northern Ireland.',
  EXCLUDED_PREMISES:
    'The regulations do not apply to military premises or to domestic premises within the Palace of Westminster (regulation 1(4)).',
  FEWER_THAN_TWO_DWELLINGS:
    'The regulations only cover buildings with two or more sets of domestic premises, such as flats (regulation 3(1)).',
  C1_HEIGHT_18: 'The top storey is at least 18 metres above ground level (regulation 3(1)(a)).',
  C2_STOREYS_7: 'The building has at least seven storeys (regulation 3(1)(b)).',
  C3_HEIGHT_11_SIMULTANEOUS:
    'The top storey is more than 11 metres above ground level and the building has a simultaneous evacuation strategy (regulation 3(1)(c)).',
  BELOW_THRESHOLDS:
    'The building is under 18 metres, has fewer than seven storeys, and is not both over 11 metres and on a simultaneous evacuation strategy (regulation 3(1)).',
};

/** What is still needed, and where to find it. Keyed by `ScopeResult.missing`. */
export const missingCopy: Record<MissingCode, string> = {
  HEIGHT: 'The height of the top storey above ground level. Check your fire risk assessment, fire strategy or building drawings.',
  STOREYS: 'The number of storeys above ground level. Check your fire risk assessment or building drawings.',
  STRATEGY: 'The evacuation strategy: stay put, simultaneous or phased. Check your fire risk assessment or fire action notices.',
};

/** Extra guidance lines. Keyed by `ScopeResult.notes`. */
export const noteCopy: Record<NoteCode, string> = {
  TEMPORARY_STRATEGY:
    'Your building is in scope because of its current simultaneous evacuation strategy. If the strategy changes, check the scope again.',
  UNLIKELY_SEVEN_STOREYS:
    'A building of 11 metres or less is unlikely to have seven storeys, but confirm the storey count to be sure.',
  OTHER_DUTIES:
    'Other duties under the Regulatory Reform (Fire Safety) Order 2005 still apply, including keeping a suitable and sufficient fire risk assessment.',
};

// ---------------------------------------------------------------------------
// 7A. Scope rules and measurement rules
// ---------------------------------------------------------------------------

export type ScopeRule = {
  id: 'R1' | 'R2' | 'R3' | 'C1' | 'C2' | 'C3';
  condition: string;
  regulation: string;
};

/** The rules the engine implements. In scope = R1 AND R2 AND R3 AND (C1 OR C2 OR C3). */
export const scopeRules: readonly ScopeRule[] = [
  { id: 'R1', condition: 'Building is in England (the regulations apply in England only)', regulation: '1(3)' },
  {
    id: 'R2',
    condition:
      'Not domestic premises within the Palace of Westminster, and not military premises (barracks, or a building occupied solely for the armed forces or a visiting force)',
    regulation: '1(4), 2',
  },
  { id: 'R3', condition: 'Contains two or more sets of domestic premises', regulation: '3(1)' },
  { id: 'C1', condition: 'Top storey is at least 18 metres above ground level', regulation: '3(1)(a)' },
  { id: 'C2', condition: 'Has at least seven storeys', regulation: '3(1)(b)' },
  {
    id: 'C3',
    condition: 'Top storey is more than 11 metres above ground level AND the building has a simultaneous evacuation strategy',
    regulation: '3(1)(c)',
  },
];

export const scopeSummary =
  'A building is in scope when it is in England, has two or more sets of domestic premises, is not excluded, and is at least 18m high, or has at least 7 storeys, or is over 11m with a simultaneous evacuation strategy.';

export type MeasurementRule = { text: string; regulation: string };

/**
 * How height and storeys are measured, shown as help text and in the guide.
 * TODO(founder): confirm the exact Appendix D wording before launch (PRD sections 7A and 17).
 */
export const measurementRules: readonly MeasurementRule[] = [
  {
    text: 'Height is measured to the height of the top storey in accordance with Appendix D to Approved Document B.',
    regulation: '3(2)(a)',
  },
  { text: 'Storeys below ground level are ignored.', regulation: '3(2)(b)(i)' },
  {
    text: 'A mezzanine counts as a storey if its internal floor area is at least 50% of the largest storey that is not below ground.',
    regulation: '3(2)(b)(ii)',
  },
  {
    text: 'A storey is below ground if any part of the finished surface of its ceiling is below the ground level immediately next to that part of the building.',
    regulation: '3(2)(b)(iii)',
  },
  {
    text: 'Simultaneous evacuation strategy means the Responsible Person has decided that everyone should leave the building immediately in the event of a fire. Phased evacuation and stay put are not simultaneous.',
    regulation: '3(3)',
  },
];

// ---------------------------------------------------------------------------
// 7D. Duties shown for in-scope buildings (results, landing page cards and PDF)
// ---------------------------------------------------------------------------

export type DutyId = 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8' | 'D9';

export type Duty = {
  id: DutyId;
  title: string;
  plainEnglish: string;
  /** Regulation number or numbers, exactly as cited in the PRD table. */
  regulation: string;
};

export const duties: readonly Duty[] = [
  {
    id: 'D1',
    title: 'Identify relevant residents',
    plainEnglish:
      'Use reasonable endeavours to identify residents whose ability to evacuate without help is compromised by a cognitive or physical impairment or condition, where the flat is their only or main home.',
    regulation: '4, 5',
  },
  {
    id: 'D2',
    title: 'Offer a person-centred fire risk assessment',
    plainEnglish: 'Offer a PCFRA to each resident identified, and make sure one is carried out for anyone who asks.',
    regulation: '6',
  },
  {
    id: 'D3',
    title: 'Put reasonable measures in place',
    plainEnglish:
      'After discussing with the resident, implement mitigating measures that are reasonable and proportionate. Rules decide who pays.',
    regulation: '7',
  },
  {
    id: 'D4',
    title: 'Agree an emergency evacuation statement',
    plainEnglish:
      'Use reasonable endeavours to agree the evacuation approach. If agreed, record it in writing and give the resident a copy.',
    regulation: '8',
  },
  {
    id: 'D5',
    title: 'Review regularly',
    plainEnglish:
      'Review the PCFRA, measures and statement within 12 months, then at least every 12 months, and sooner if something changes or the resident reasonably asks.',
    regulation: '9',
  },
  {
    id: 'D6',
    title: 'Share information with the fire service',
    plainEnglish:
      "With the resident's explicit consent, give the local fire and rescue authority the flat number, floor number, basic information on the help needed, and whether there is a statement. Use the method the fire service chooses: electronic, or a hard copy in a secure information box (install one if needed).",
    regulation: '10',
  },
  {
    id: 'D7',
    title: 'Work with representatives',
    plainEnglish:
      "Where it applies, work with a resident's representative, such as a person with parental responsibility, a registered attorney or a Court of Protection deputy.",
    regulation: '11',
  },
  {
    id: 'D8',
    title: 'Building emergency evacuation plan',
    plainEnglish:
      'Prepare a building plan, give it to the fire service, place a copy in the secure information box if there is one, and review it within 12 months and then at least every 12 months.',
    regulation: '13',
  },
  {
    id: 'D9',
    title: 'Data protection',
    plainEnglish: 'Handle all this information in line with data protection law.',
    regulation: '12',
  },
];

/** Source line for every duty row (PRD section 7D). */
export const dutiesSource = 'SI 2025/797 as made';
