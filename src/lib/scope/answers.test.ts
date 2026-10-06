import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { pruneAnswers } from './answers';
import { evaluateScope, getNextQuestion, type Answers } from './engine';

const base: Partial<Answers> = { inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more' };

describe('pruneAnswers', () => {
  it('keeps every answer when all were asked', () => {
    const answers: Partial<Answers> = { ...base, storeys: 4, heightMetres: 15, evacuationStrategy: 'stay_put' };
    expect(pruneAnswers(answers)).toEqual(answers);
  });

  it('drops answers after a gate that ends the flow', () => {
    expect(pruneAnswers({ ...base, inEngland: 'no', storeys: 10 })).toEqual({ inEngland: 'no' });
    expect(pruneAnswers({ ...base, excludedPremises: 'yes', storeys: 10 })).toEqual({ inEngland: 'yes', excludedPremises: 'yes' });
    expect(pruneAnswers({ ...base, dwellings: 'fewer_than_two', heightMetres: 30 })).toEqual({ ...base, dwellings: 'fewer_than_two' });
  });

  it('drops the height and strategy once seven storeys settles it, and the strategy once the height settles it', () => {
    expect(pruneAnswers({ ...base, storeys: 9, heightMetres: 5, evacuationStrategy: 'stay_put' })).toEqual({ ...base, storeys: 9 });
    expect(pruneAnswers({ ...base, storeys: 4, heightMetres: 20, evacuationStrategy: 'stay_put' })).toEqual({ ...base, storeys: 4, heightMetres: 20 });
    expect(pruneAnswers({ ...base, storeys: 4, heightMetres: 9, evacuationStrategy: 'unsure' })).toEqual({ ...base, storeys: 4, heightMetres: 9 });
  });

  it('keeps "I don\'t know" (null) answers', () => {
    expect(pruneAnswers({ ...base, storeys: null, heightMetres: null, evacuationStrategy: 'unsure' })).toEqual({
      ...base,
      storeys: null,
      heightMetres: null,
      evacuationStrategy: 'unsure',
    });
  });

  it('stops at the first question without an answer, even if later ones were given', () => {
    expect(pruneAnswers({ inEngland: 'yes', dwellings: 'two_or_more', storeys: 3 })).toEqual({ inEngland: 'yes' });
    expect(pruneAnswers({})).toEqual({});
  });

  it('does not change what it is given', () => {
    const answers: Partial<Answers> = { ...base, inEngland: 'no', storeys: 3 };
    const copy = structuredClone(answers);
    pruneAnswers(answers);
    expect(answers).toEqual(copy);
  });

  it('property: pruning is idempotent, never changes the status, and leaves a finished flow finished', () => {
    const full: fc.Arbitrary<Answers> = fc.record({
      inEngland: fc.constantFrom('yes', 'no'),
      excludedPremises: fc.constantFrom('yes', 'no'),
      dwellings: fc.constantFrom('two_or_more', 'fewer_than_two'),
      storeys: fc.option(fc.integer({ min: 1, max: 120 }), { nil: null }),
      heightMetres: fc.option(fc.integer({ min: 1, max: 3500 }).map((tenths) => tenths / 10), { nil: null }),
      evacuationStrategy: fc.constantFrom('stay_put', 'simultaneous', 'temporary_simultaneous', 'phased_or_other', 'unsure'),
    });
    fc.assert(
      fc.property(full, (answers) => {
        const pruned = pruneAnswers(answers);
        expect(pruneAnswers(pruned)).toEqual(pruned);
        expect(getNextQuestion(pruned)).toBeNull();
        expect(evaluateScope(pruned).status).toBe(evaluateScope(answers).status);
      }),
      { numRuns: 2000 },
    );
  });
});
