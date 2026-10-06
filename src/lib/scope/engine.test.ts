import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { evaluateScope, getNextQuestion, type Answers, type QuestionId } from './engine';

/** PRD section 15A: "Unless stated: inEngland 'yes', excludedPremises 'no', dwellings 'two_or_more'." */
const base: Partial<Answers> = { inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more' };
const withBase = (extra: Partial<Answers>): Partial<Answers> => ({ ...base, ...extra });

describe('evaluateScope: truth table (PRD section 15A, T1–T21)', () => {
  it('T1: not in England is not in scope, with no notes', () => {
    const result = evaluateScope({ ...base, inEngland: 'no' });
    expect(result.status).toBe('not_in_scope');
    expect(result.reasons).toEqual(['NOT_ENGLAND']);
    expect(result.notes).toEqual([]);
    expect(result.criteriaMet).toEqual([]);
    expect(result.missing).toEqual([]);
  });

  it('T2: excluded premises are not in scope', () => {
    const result = evaluateScope({ ...base, excludedPremises: 'yes' });
    expect(result.status).toBe('not_in_scope');
    expect(result.reasons).toEqual(['EXCLUDED_PREMISES']);
    expect(result.notes).toEqual([]);
  });

  it('T3: fewer than two dwellings is not in scope', () => {
    const result = evaluateScope({ ...base, dwellings: 'fewer_than_two' });
    expect(result.status).toBe('not_in_scope');
    expect(result.reasons).toEqual(['FEWER_THAN_TWO_DWELLINGS']);
    expect(result.notes).toEqual([]);
  });

  it('T4: 7 storeys is in scope under C2', () => {
    const result = evaluateScope(withBase({ storeys: 7 }));
    expect(result.status).toBe('in_scope');
    expect(result.criteriaMet).toEqual(['C2_STOREYS_7']);
    expect(result.notes).toEqual([]);
  });

  it('T5: 6 storeys and exactly 18.0m is in scope under C1', () => {
    const result = evaluateScope(withBase({ storeys: 6, heightMetres: 18.0 }));
    expect(result.status).toBe('in_scope');
    expect(result.criteriaMet).toEqual(['C1_HEIGHT_18']);
  });

  it('T6: 6 storeys and 17.9m on stay put is not in scope, with the other-duties note', () => {
    const result = evaluateScope(withBase({ storeys: 6, heightMetres: 17.9, evacuationStrategy: 'stay_put' }));
    expect(result.status).toBe('not_in_scope');
    expect(result.reasons).toEqual(['BELOW_THRESHOLDS']);
    expect(result.notes).toEqual(['OTHER_DUTIES']);
  });

  it('T7: 11.0m with simultaneous evacuation is not in scope ("more than 11")', () => {
    const result = evaluateScope(withBase({ storeys: 4, heightMetres: 11.0, evacuationStrategy: 'simultaneous' }));
    expect(result.status).toBe('not_in_scope');
    expect(result.reasons).toEqual(['BELOW_THRESHOLDS']);
  });

  it('T8: 11.1m with simultaneous evacuation is in scope under C3', () => {
    const result = evaluateScope(withBase({ storeys: 4, heightMetres: 11.1, evacuationStrategy: 'simultaneous' }));
    expect(result.status).toBe('in_scope');
    expect(result.criteriaMet).toEqual(['C3_HEIGHT_11_SIMULTANEOUS']);
    expect(result.notes).toEqual([]);
  });

  it('T9: 12m with temporary simultaneous evacuation is in scope under C3, with the temporary-strategy note', () => {
    const result = evaluateScope(withBase({ storeys: 4, heightMetres: 12, evacuationStrategy: 'temporary_simultaneous' }));
    expect(result.status).toBe('in_scope');
    expect(result.criteriaMet).toEqual(['C3_HEIGHT_11_SIMULTANEOUS']);
    expect(result.notes).toEqual(['TEMPORARY_STRATEGY']);
  });

  it('T10: 12m with phased or other evacuation is not in scope', () => {
    const result = evaluateScope(withBase({ storeys: 4, heightMetres: 12, evacuationStrategy: 'phased_or_other' }));
    expect(result.status).toBe('not_in_scope');
    expect(result.reasons).toEqual(['BELOW_THRESHOLDS']);
  });

  it('T11: 12m with an unsure strategy cannot be confirmed; the strategy is missing', () => {
    const result = evaluateScope(withBase({ storeys: 4, heightMetres: 12, evacuationStrategy: 'unsure' }));
    expect(result.status).toBe('cannot_confirm');
    expect(result.missing).toEqual(['STRATEGY']);
    expect(result.notes).toEqual([]);
  });

  it('T12: height unknown on stay put cannot be confirmed; the height is missing', () => {
    const result = evaluateScope(withBase({ storeys: 5, heightMetres: null, evacuationStrategy: 'stay_put' }));
    expect(result.status).toBe('cannot_confirm');
    expect(result.missing).toEqual(['HEIGHT']);
  });

  it('T13: height unknown and strategy unsure: height and strategy are missing, in that order', () => {
    const result = evaluateScope(withBase({ storeys: 5, heightMetres: null, evacuationStrategy: 'unsure' }));
    expect(result.status).toBe('cannot_confirm');
    expect(result.missing).toEqual(['HEIGHT', 'STRATEGY']);
  });

  it('T14: storeys unknown with a 15m height cannot be confirmed; the storeys are missing', () => {
    const result = evaluateScope(withBase({ storeys: null, heightMetres: 15, evacuationStrategy: 'stay_put' }));
    expect(result.status).toBe('cannot_confirm');
    expect(result.missing).toEqual(['STOREYS']);
    expect(result.notes).toEqual([]);
  });

  it('T15: storeys unknown with a 9m height cannot be confirmed, with the unlikely-seven-storeys note', () => {
    const result = evaluateScope(withBase({ storeys: null, heightMetres: 9 }));
    expect(result.status).toBe('cannot_confirm');
    expect(result.missing).toEqual(['STOREYS']);
    expect(result.notes).toEqual(['UNLIKELY_SEVEN_STOREYS']);
  });

  it('T16: storeys and height both unknown on simultaneous: height and storeys are missing, in that order', () => {
    const result = evaluateScope(withBase({ storeys: null, heightMetres: null, evacuationStrategy: 'simultaneous' }));
    expect(result.status).toBe('cannot_confirm');
    expect(result.missing).toEqual(['HEIGHT', 'STOREYS']);
  });

  it('T17: 3 storeys and 9m is not in scope', () => {
    const result = evaluateScope(withBase({ storeys: 3, heightMetres: 9 }));
    expect(result.status).toBe('not_in_scope');
    expect(result.reasons).toEqual(['BELOW_THRESHOLDS']);
    expect(result.notes).toEqual(['OTHER_DUTIES']);
  });

  it('T18: 8 storeys, 25m, simultaneous meets C1, C2 and C3, with no temporary note', () => {
    const result = evaluateScope(withBase({ storeys: 8, heightMetres: 25, evacuationStrategy: 'simultaneous' }));
    expect(result.status).toBe('in_scope');
    expect(result.criteriaMet).toEqual(['C1_HEIGHT_18', 'C2_STOREYS_7', 'C3_HEIGHT_11_SIMULTANEOUS']);
    expect(result.notes).toEqual([]);
  });

  it('T19: 6 storeys, 18m, temporary simultaneous meets C1 and C3, with no temporary note', () => {
    const result = evaluateScope(withBase({ storeys: 6, heightMetres: 18, evacuationStrategy: 'temporary_simultaneous' }));
    expect(result.status).toBe('in_scope');
    expect(result.criteriaMet).toEqual(['C1_HEIGHT_18', 'C3_HEIGHT_11_SIMULTANEOUS']);
    expect(result.notes).toEqual([]);
  });

  it('T20: not in England wins over everything else', () => {
    const result = evaluateScope({ ...base, inEngland: 'no', excludedPremises: 'yes', dwellings: 'fewer_than_two', storeys: 10 });
    expect(result.status).toBe('not_in_scope');
    expect(result.reasons).toEqual(['NOT_ENGLAND']);
  });

  it('T21: 10 storeys is enough on its own, even with the height unknown', () => {
    const result = evaluateScope(withBase({ storeys: 10, heightMetres: null }));
    expect(result.status).toBe('in_scope');
    expect(result.criteriaMet).toEqual(['C2_STOREYS_7']);
  });
});

describe('evaluateScope: rules and boundaries', () => {
  it('excluded premises win over fewer than two dwellings, and fewer than two dwellings win over height', () => {
    expect(evaluateScope({ ...base, excludedPremises: 'yes', dwellings: 'fewer_than_two' }).reasons).toEqual(['EXCLUDED_PREMISES']);
    expect(evaluateScope({ ...base, dwellings: 'fewer_than_two', storeys: 30, heightMetres: 90 }).reasons).toEqual([
      'FEWER_THAN_TWO_DWELLINGS',
    ]);
  });

  it('18.0m is in scope and 17.9m is not (C1 is "at least")', () => {
    expect(evaluateScope(withBase({ storeys: 3, heightMetres: 18 })).status).toBe('in_scope');
    expect(evaluateScope(withBase({ storeys: 3, heightMetres: 17.9, evacuationStrategy: 'stay_put' })).status).toBe('not_in_scope');
  });

  it('7 storeys meets C2 and 6 does not', () => {
    expect(evaluateScope(withBase({ storeys: 7, heightMetres: 5 })).status).toBe('in_scope');
    expect(evaluateScope(withBase({ storeys: 6, heightMetres: 5 })).status).toBe('not_in_scope');
  });

  it('treats an unanswered (undefined) height or storeys like "I don\'t know"', () => {
    expect(evaluateScope(withBase({ storeys: 5 }))).toEqual(evaluateScope(withBase({ storeys: 5, heightMetres: null })));
    expect(evaluateScope(withBase({ heightMetres: 15, evacuationStrategy: 'stay_put' }))).toEqual(
      evaluateScope(withBase({ storeys: null, heightMetres: 15, evacuationStrategy: 'stay_put' })),
    );
  });

  it('adds the unlikely-seven-storeys note only when height is known and 11m or less', () => {
    expect(evaluateScope(withBase({ storeys: null, heightMetres: 11 })).notes).toEqual(['UNLIKELY_SEVEN_STOREYS']);
    expect(evaluateScope(withBase({ storeys: null, heightMetres: 11.1, evacuationStrategy: 'stay_put' })).notes).toEqual([]);
    expect(evaluateScope(withBase({ storeys: null, heightMetres: null, evacuationStrategy: 'stay_put' })).notes).toEqual([]);
  });

  it('adds the other-duties note only for BELOW_THRESHOLDS', () => {
    for (const answers of [
      { ...base, inEngland: 'no' },
      { ...base, excludedPremises: 'yes' },
      { ...base, dwellings: 'fewer_than_two' },
    ] as Partial<Answers>[]) {
      expect(evaluateScope(answers).notes).not.toContain('OTHER_DUTIES');
    }
    expect(evaluateScope(withBase({ storeys: 2, heightMetres: 6 })).notes).toContain('OTHER_DUTIES');
  });

  it('has no reasons when it cannot confirm, no criteria unless in scope, and no missing items unless it cannot confirm', () => {
    const cannot = evaluateScope(withBase({ storeys: 5, heightMetres: null }));
    expect(cannot.reasons).toEqual([]);
    expect(cannot.criteriaMet).toEqual([]);
    const inScope = evaluateScope(withBase({ storeys: 9 }));
    expect(inScope.missing).toEqual([]);
    const out = evaluateScope(withBase({ storeys: 2, heightMetres: 6 }));
    expect(out.criteriaMet).toEqual([]);
    expect(out.missing).toEqual([]);
  });

  it('stamps every result with the engine version', () => {
    expect(evaluateScope({}).engineVersion).toBe('1.0.0');
    expect(evaluateScope({ ...base, inEngland: 'no' }).engineVersion).toBe('1.0.0');
  });

  it('does not change the answers it is given', () => {
    const answers = withBase({ storeys: 4, heightMetres: 12, evacuationStrategy: 'unsure' });
    const copy = structuredClone(answers);
    evaluateScope(answers);
    getNextQuestion(answers);
    expect(answers).toEqual(copy);
  });
});

describe('getNextQuestion (PRD section 15A, N1–N13)', () => {
  const cases: [string, Partial<Answers>, QuestionId | null][] = [
    ['N1', {}, 'inEngland'],
    ['N2', { inEngland: 'yes' }, 'excludedPremises'],
    ['N3', { inEngland: 'yes', excludedPremises: 'no' }, 'dwellings'],
    ['N4', { ...base }, 'storeys'],
    ['N5', withBase({ storeys: 7 }), null],
    ['N6', withBase({ storeys: 6 }), 'heightMetres'],
    ['N7', withBase({ storeys: 6, heightMetres: 20 }), null],
    ['N8', withBase({ storeys: 6, heightMetres: 9 }), null],
    ['N9', withBase({ storeys: 6, heightMetres: 15 }), 'evacuationStrategy'],
    ['N10', withBase({ storeys: 6, heightMetres: null }), 'evacuationStrategy'],
    ['N11', withBase({ storeys: null, heightMetres: 9 }), null],
    ['N12', { inEngland: 'no' }, null],
    ['N13', { inEngland: 'yes', excludedPremises: 'no', dwellings: 'fewer_than_two' }, null],
  ];

  it.each(cases)('%s', (_id, answers, expected) => {
    expect(getNextQuestion(answers)).toBe(expected);
  });

  it('stops at excluded premises without asking about dwellings', () => {
    expect(getNextQuestion({ inEngland: 'yes', excludedPremises: 'yes' })).toBeNull();
  });

  it('asks for the height after "I don\'t know" storeys, then the strategy only if height could matter', () => {
    expect(getNextQuestion(withBase({ storeys: null }))).toBe('heightMetres');
    expect(getNextQuestion(withBase({ storeys: null, heightMetres: 11 }))).toBeNull();
    expect(getNextQuestion(withBase({ storeys: null, heightMetres: 11.1 }))).toBe('evacuationStrategy');
    expect(getNextQuestion(withBase({ storeys: null, heightMetres: 18 }))).toBeNull();
  });

  it('asks the strategy at exactly 11.1m and not at exactly 11.0m', () => {
    expect(getNextQuestion(withBase({ storeys: 4, heightMetres: 11 }))).toBeNull();
    expect(getNextQuestion(withBase({ storeys: 4, heightMetres: 11.1 }))).toBe('evacuationStrategy');
    expect(getNextQuestion(withBase({ storeys: 4, heightMetres: 17.9 }))).toBe('evacuationStrategy');
    expect(getNextQuestion(withBase({ storeys: 4, heightMetres: 18 }))).toBeNull();
  });

  it('is finished once the strategy is answered', () => {
    expect(getNextQuestion(withBase({ storeys: 6, heightMetres: 15, evacuationStrategy: 'unsure' }))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Property tests (PRD section 15A, "Property test (recommended)")
// ---------------------------------------------------------------------------

const strategies = ['stay_put', 'simultaneous', 'temporary_simultaneous', 'phased_or_other', 'unsure'] as const;

/** Heights in one-decimal steps, weighted towards the boundaries that matter. */
const height = fc.oneof(
  { weight: 3, arbitrary: fc.constantFrom(0.1, 10.9, 11, 11.1, 17.9, 18, 18.1, 350) },
  { weight: 4, arbitrary: fc.integer({ min: 1, max: 3500 }).map((tenths) => tenths / 10) },
);
const storeys = fc.oneof(
  { weight: 3, arbitrary: fc.constantFrom(1, 6, 7, 8, 120) },
  { weight: 4, arbitrary: fc.integer({ min: 1, max: 120 }) },
);

const fullAnswers: fc.Arbitrary<Answers> = fc.record({
  inEngland: fc.constantFrom('yes', 'no'),
  excludedPremises: fc.constantFrom('yes', 'no'),
  dwellings: fc.constantFrom('two_or_more', 'fewer_than_two'),
  storeys: fc.option(storeys, { nil: null, freq: 4 }),
  heightMetres: fc.option(height, { nil: null, freq: 4 }),
  evacuationStrategy: fc.constantFrom(...strategies),
});

/** The regulation, written independently of the engine: R1 AND R2 AND R3 AND (C1 OR C2 OR C3), for known values. */
function inScopeByRegulation(a: Answers): boolean {
  const gates = a.inEngland === 'yes' && a.excludedPremises === 'no' && a.dwellings === 'two_or_more';
  const c1 = a.heightMetres !== null && a.heightMetres >= 18;
  const c2 = a.storeys !== null && a.storeys >= 7;
  const simultaneous = a.evacuationStrategy === 'simultaneous' || a.evacuationStrategy === 'temporary_simultaneous';
  const c3 = a.heightMetres !== null && a.heightMetres > 11 && simultaneous;
  return gates && (c1 || c2 || c3);
}

/** Every concrete way to fill in the "I don't know" answers, using values either side of each threshold. */
function completions(a: Answers): Answers[] {
  const storeyOptions = a.storeys === null ? [1, 6, 7, 120] : [a.storeys];
  const heightOptions = a.heightMetres === null ? [0.1, 11, 11.1, 17.9, 18, 350] : [a.heightMetres];
  const strategyOptions = a.evacuationStrategy === 'unsure' ? strategies.filter((s) => s !== 'unsure') : [a.evacuationStrategy];
  return storeyOptions.flatMap((s) =>
    heightOptions.flatMap((h) => strategyOptions.map((e) => ({ ...a, storeys: s, heightMetres: h, evacuationStrategy: e }))),
  );
}

describe('evaluateScope: properties', () => {
  it('is in scope if and only if R1, R2 and R3 pass and one of C1, C2 or C3 holds', () => {
    fc.assert(
      fc.property(fullAnswers, (a) => {
        expect(evaluateScope(a).status === 'in_scope').toBe(inScopeByRegulation(a));
      }),
      { numRuns: 2000 },
    );
  });

  it('lists exactly the criteria that hold', () => {
    fc.assert(
      fc.property(fullAnswers, (a) => {
        const result = evaluateScope(a);
        if (result.status !== 'in_scope') {
          expect(result.criteriaMet).toEqual([]);
          return;
        }
        const simultaneous = a.evacuationStrategy === 'simultaneous' || a.evacuationStrategy === 'temporary_simultaneous';
        const expected = [
          a.heightMetres !== null && a.heightMetres >= 18 ? 'C1_HEIGHT_18' : null,
          a.storeys !== null && a.storeys >= 7 ? 'C2_STOREYS_7' : null,
          a.heightMetres !== null && a.heightMetres > 11 && simultaneous ? 'C3_HEIGHT_11_SIMULTANEOUS' : null,
        ].filter(Boolean);
        expect(result.criteriaMet).toEqual(expected);
        expect(result.reasons).toEqual(expected);
      }),
      { numRuns: 2000 },
    );
  });

  it('says "cannot confirm" only if some way of filling in the unknowns puts the building in scope, and "not in scope" only if none does', () => {
    fc.assert(
      fc.property(fullAnswers, (a) => {
        const result = evaluateScope(a);
        const anyCompletionInScope = completions(a).some(inScopeByRegulation);
        if (result.status === 'cannot_confirm') expect(anyCompletionInScope).toBe(true);
        if (result.status === 'not_in_scope') expect(anyCompletionInScope).toBe(false);
        if (result.status === 'in_scope') expect(inScopeByRegulation(a)).toBe(true);
      }),
      { numRuns: 2000 },
    );
  });

  it('gives each result the fields that go with its status', () => {
    fc.assert(
      fc.property(fullAnswers, (a) => {
        const r = evaluateScope(a);
        expect(r.engineVersion).toBe('1.0.0');
        if (r.status === 'in_scope') {
          expect(r.criteriaMet.length).toBeGreaterThan(0);
          expect(r.missing).toEqual([]);
        } else if (r.status === 'cannot_confirm') {
          expect(r.missing.length).toBeGreaterThan(0);
          expect(r.criteriaMet).toEqual([]);
          expect(r.reasons).toEqual([]);
        } else {
          expect(r.reasons).toHaveLength(1);
          expect(r.criteriaMet).toEqual([]);
          expect(r.missing).toEqual([]);
        }
        expect(r.notes.includes('OTHER_DUTIES')).toBe(r.reasons[0] === 'BELOW_THRESHOLDS');
      }),
      { numRuns: 2000 },
    );
  });

  it('is not affected by key order or by extra undefined keys', () => {
    fc.assert(
      fc.property(fullAnswers, (a) => {
        const reordered = Object.fromEntries(Object.entries(a).reverse()) as Answers;
        expect(evaluateScope(reordered)).toEqual(evaluateScope({ ...a, extra: undefined } as Answers));
      }),
      { numRuns: 500 },
    );
  });
});

describe('getNextQuestion: properties', () => {
  /** Answer questions the way a user would: ask the engine, then give the value from `full`. */
  function runFlow(full: Answers): { partial: Partial<Answers>; asked: QuestionId[] } {
    const partial: Partial<Answers> = {};
    const asked: QuestionId[] = [];
    for (let guard = 0; guard < 10; guard++) {
      const next = getNextQuestion(partial);
      if (next === null) return { partial, asked };
      asked.push(next);
      (partial as Record<string, unknown>)[next] = full[next];
    }
    throw new Error('getNextQuestion did not finish');
  }

  it('finishes after at most six questions, never repeats one, and asks in the fixed order', () => {
    const order: QuestionId[] = ['inEngland', 'excludedPremises', 'dwellings', 'storeys', 'heightMetres', 'evacuationStrategy'];
    fc.assert(
      fc.property(fullAnswers, (full) => {
        const { asked } = runFlow(full);
        expect(asked.length).toBeLessThanOrEqual(6);
        expect(new Set(asked).size).toBe(asked.length);
        expect(asked).toEqual(order.filter((id) => asked.includes(id)));
        expect(asked.slice(0, 1)).toEqual(['inEngland']);
      }),
      { numRuns: 2000 },
    );
  });

  it('never skips a question that could change the result: the status after the flow equals the status with every answer given', () => {
    fc.assert(
      fc.property(fullAnswers, (full) => {
        const { partial } = runFlow(full);
        expect(evaluateScope(partial).status).toBe(evaluateScope(full).status);
      }),
      { numRuns: 3000 },
    );
  });

  it('only a complete flow can end in "not in scope" for BELOW_THRESHOLDS, so no unasked question could have changed it', () => {
    fc.assert(
      fc.property(fullAnswers, (full) => {
        const { partial } = runFlow(full);
        const result = evaluateScope(partial);
        if (result.reasons[0] === 'BELOW_THRESHOLDS') {
          // Fill every unasked question with every possible value: the status must not change.
          const unasked = (['storeys', 'heightMetres', 'evacuationStrategy'] as const).filter((id) => !(id in partial));
          for (const id of unasked) {
            const values = id === 'storeys' ? [null, 1, 7, 120] : id === 'heightMetres' ? [null, 0.1, 11, 11.1, 18, 350] : strategies;
            for (const value of values) {
              expect(evaluateScope({ ...partial, [id]: value }).status).toBe('not_in_scope');
            }
          }
        }
      }),
      { numRuns: 2000 },
    );
  });
});
