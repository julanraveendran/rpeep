/**
 * RPEEP scope engine: PRD section 7B.
 *
 * A pure function of the answers. No React, no network and no system clock, so the
 * same code runs in the browser (instant result) and on the server (the result that
 * is stored and printed in the PDF). Do not change the logic or the version without
 * showing the diff and the PRD section it matches.
 *
 * Source: the Fire Safety (Residential Evacuation Plans) (England) Regulations 2025,
 * SI 2025/797. A building is in scope when R1 AND R2 AND R3 AND (C1 OR C2 OR C3).
 */

export const ENGINE_VERSION = '1.0.0' as const;

export type Answers = {
  inEngland: 'yes' | 'no';
  excludedPremises: 'yes' | 'no'; // military or Palace of Westminster
  dwellings: 'two_or_more' | 'fewer_than_two';
  storeys: number | null; // integer 1–120, null = "I don't know"
  heightMetres: number | null; // 0.1–350, one decimal place, null = "I don't know"
  evacuationStrategy: 'stay_put' | 'simultaneous' | 'temporary_simultaneous' | 'phased_or_other' | 'unsure';
};

export type QuestionId = keyof Answers;

export type Criterion = 'C1_HEIGHT_18' | 'C2_STOREYS_7' | 'C3_HEIGHT_11_SIMULTANEOUS';
export type ScopeStatus = 'in_scope' | 'not_in_scope' | 'cannot_confirm';

/** Why the result is what it is: a rule that rules the building out, or the criteria that rule it in. */
export type ReasonCode = 'NOT_ENGLAND' | 'EXCLUDED_PREMISES' | 'FEWER_THAN_TWO_DWELLINGS' | 'BELOW_THRESHOLDS' | Criterion;
export type MissingCode = 'HEIGHT' | 'STOREYS' | 'STRATEGY';
export type NoteCode = 'TEMPORARY_STRATEGY' | 'UNLIKELY_SEVEN_STOREYS' | 'OTHER_DUTIES';

export type ScopeResult = {
  status: ScopeStatus;
  /** Why, in display order. For `in_scope` these are the criteria met. Empty for `cannot_confirm`. */
  reasons: ReasonCode[];
  /** Empty unless `in_scope`. */
  criteriaMet: Criterion[];
  /** Empty unless `cannot_confirm`. */
  missing: MissingCode[];
  /** Extra guidance lines. */
  notes: NoteCode[];
  /** Stored with every report. */
  engineVersion: typeof ENGINE_VERSION;
};

const HEIGHT_C1_METRES = 18; // reg 3(1)(a): "at least"
const STOREYS_C2 = 7; // reg 3(1)(b): "at least"
const HEIGHT_C3_METRES = 11; // reg 3(1)(c): "more than"

function result(status: ScopeStatus, parts: Partial<Omit<ScopeResult, 'status' | 'engineVersion'>> = {}): ScopeResult {
  return {
    status,
    reasons: parts.reasons ?? [],
    criteriaMet: parts.criteriaMet ?? [],
    missing: parts.missing ?? [],
    notes: parts.notes ?? [],
    engineVersion: ENGINE_VERSION,
  };
}

/**
 * Work out whether a building is in scope.
 *
 * `undefined` means "not asked yet"; `null` (or `'unsure'`) means "I don't know". For height and
 * storeys the two are treated the same. A final answer is only meaningful once `getNextQuestion`
 * returns `null`: before that, only rules R1–R3 and the criteria (steps 1–5) may end the flow.
 */
export function evaluateScope(a: Partial<Answers>): ScopeResult {
  // Steps 1–3: the three gates can only rule a building out, in this order.
  if (a.inEngland === 'no') return result('not_in_scope', { reasons: ['NOT_ENGLAND'] });
  if (a.excludedPremises === 'yes') return result('not_in_scope', { reasons: ['EXCLUDED_PREMISES'] });
  if (a.dwellings === 'fewer_than_two') return result('not_in_scope', { reasons: ['FEWER_THAN_TWO_DWELLINGS'] });

  // Step 4: the criteria.
  const height = a.heightMetres ?? null;
  const storeys = a.storeys ?? null;
  const strategy = a.evacuationStrategy;

  const c1 = height !== null && height >= HEIGHT_C1_METRES;
  const c2 = storeys !== null && storeys >= STOREYS_C2;
  const simultaneous = strategy === 'simultaneous' || strategy === 'temporary_simultaneous';
  const c3 = height !== null && height > HEIGHT_C3_METRES && simultaneous;

  // Step 5: any one criterion rules the building in.
  if (c1 || c2 || c3) {
    const criteriaMet: Criterion[] = [];
    if (c1) criteriaMet.push('C1_HEIGHT_18');
    if (c2) criteriaMet.push('C2_STOREYS_7');
    if (c3) criteriaMet.push('C3_HEIGHT_11_SIMULTANEOUS');

    const notes: NoteCode[] = [];
    if (!c1 && !c2 && c3 && strategy === 'temporary_simultaneous') notes.push('TEMPORARY_STRATEGY');

    return result('in_scope', { reasons: [...criteriaMet], criteriaMet, notes });
  }

  // Step 6: what could an unknown answer still change?
  const couldC1 = height === null;
  const couldC2 = storeys === null;
  const couldC3 = (height === null || height > HEIGHT_C3_METRES) && (simultaneous || strategy === 'unsure');

  // Step 7: something could still change the result.
  if (couldC1 || couldC2 || couldC3) {
    const missing: MissingCode[] = [];
    if (height === null) missing.push('HEIGHT');
    if (storeys === null) missing.push('STOREYS');
    if (strategy === 'unsure' && (height === null || height > HEIGHT_C3_METRES)) missing.push('STRATEGY');

    const notes: NoteCode[] = [];
    if (height !== null && height <= HEIGHT_C3_METRES && storeys === null) notes.push('UNLIKELY_SEVEN_STOREYS');

    return result('cannot_confirm', { missing, notes });
  }

  // Steps 8 and 9: below every threshold. Only this result gets the other-duties note.
  return result('not_in_scope', { reasons: ['BELOW_THRESHOLDS'], notes: ['OTHER_DUTIES'] });
}

/**
 * The next question to ask, or `null` when the checker is finished.
 *
 * Order: inEngland, excludedPremises, dwellings, storeys, heightMetres, evacuationStrategy.
 * Storeys come before height because most people know the storey count. A question is skipped
 * when its answer cannot change the result, so a "not in scope" can never end the flow while a
 * question that could change it is still unasked.
 */
export function getNextQuestion(a: Partial<Answers>): QuestionId | null {
  // Rules 1–3: each gate is asked in turn, and a failing gate ends the flow.
  if (a.inEngland === undefined) return 'inEngland';
  if (a.inEngland === 'no') return null;

  if (a.excludedPremises === undefined) return 'excludedPremises';
  if (a.excludedPremises === 'yes') return null;

  if (a.dwellings === undefined) return 'dwellings';
  if (a.dwellings === 'fewer_than_two') return null;

  // C2: seven or more storeys is enough on its own.
  if (a.storeys === undefined) return 'storeys';
  if (a.storeys !== null && a.storeys >= STOREYS_C2) return null;

  // C1: 18m or more is enough on its own.
  if (a.heightMetres === undefined) return 'heightMetres';
  if (a.heightMetres !== null && a.heightMetres >= HEIGHT_C1_METRES) return null;

  // C3: the evacuation strategy only matters if the height is unknown or over 11m (and under 18m).
  const heightCouldMatter = a.heightMetres === null || a.heightMetres > HEIGHT_C3_METRES;
  if (heightCouldMatter && a.evacuationStrategy === undefined) return 'evacuationStrategy';

  return null;
}
