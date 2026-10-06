import { describe, expect, it } from 'vitest';
import type { Answers } from '@/lib/scope/engine';
import {
  askedQuestions,
  cleared,
  completeReadiness,
  EMPTY_STATE,
  editStep,
  furthestStep,
  hashToStep,
  parseStoredState,
  previousStep,
  resolveStep,
  serialiseState,
  stepToHash,
  withAnswer,
  withReadinessAnswer,
  withReadinessDone,
  type CheckerState,
  type Step,
} from './state';

const base: Partial<Answers> = { inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more' };
const stateWith = (answers: Partial<Answers>, extra: Partial<CheckerState> = {}): CheckerState => ({ ...EMPTY_STATE, answers, ...extra });
const q = (id: Extract<Step, { kind: 'question' }>['id']): Step => ({ kind: 'question', id });

describe('hashes', () => {
  it('maps every step to its hash and back', () => {
    const steps: Step[] = [
      { kind: 'intro' },
      q('inEngland'),
      q('excludedPremises'),
      q('dwellings'),
      q('storeys'),
      q('heightMetres'),
      q('evacuationStrategy'),
      { kind: 'result' },
      { kind: 'readiness' },
      { kind: 'report' },
    ];
    for (const step of steps) expect(hashToStep(stepToHash(step))).toEqual(step);
  });

  it('uses the hashes from the PRD', () => {
    expect(stepToHash(q('storeys'))).toBe('#q-storeys');
    expect(stepToHash({ kind: 'result' })).toBe('#result');
    expect(stepToHash({ kind: 'readiness' })).toBe('#readiness');
    expect(stepToHash({ kind: 'intro' })).toBe('');
  });

  it('treats an unknown hash as the intro', () => {
    for (const hash of ['', '#', '#nonsense', '#q-', '#q-unknown', '#q-__proto__', '#Result']) expect(hashToStep(hash)).toEqual({ kind: 'intro' });
  });
});

describe('askedQuestions', () => {
  it('lists the answered questions in order and the next one', () => {
    expect(askedQuestions({})).toEqual({ answered: [], next: 'inEngland' });
    expect(askedQuestions({ ...base, storeys: 4 })).toEqual({
      answered: ['inEngland', 'excludedPremises', 'dwellings', 'storeys'],
      next: 'heightMetres',
    });
  });

  it('ignores answers to questions that would not be asked', () => {
    expect(askedQuestions({ inEngland: 'no', storeys: 10 })).toEqual({ answered: ['inEngland'], next: null });
    expect(askedQuestions({ ...base, storeys: 9, heightMetres: 5 })).toEqual({
      answered: ['inEngland', 'excludedPremises', 'dwellings', 'storeys'],
      next: null,
    });
  });

  it('counts "I don\'t know" as answered', () => {
    expect(askedQuestions({ ...base, storeys: null }).next).toBe('heightMetres');
  });
});

describe('resolveStep: a URL can only reach steps the answers allow', () => {
  it('always allows the intro', () => {
    expect(resolveStep({ kind: 'intro' }, EMPTY_STATE)).toEqual({ kind: 'intro' });
  });

  it('allows an answered question or the next one, and nothing further ahead', () => {
    const state = stateWith({ ...base });
    expect(resolveStep(q('inEngland'), state)).toEqual(q('inEngland'));
    expect(resolveStep(q('dwellings'), state)).toEqual(q('dwellings'));
    expect(resolveStep(q('storeys'), state)).toEqual(q('storeys'));
    expect(resolveStep(q('heightMetres'), state)).toEqual(q('storeys'));
    expect(resolveStep(q('evacuationStrategy'), state)).toEqual(q('storeys'));
  });

  it('sends #result, #readiness and #report back to the next question while the checker is unfinished', () => {
    const state = stateWith({ ...base, storeys: 4 });
    for (const kind of ['result', 'readiness', 'report'] as const) expect(resolveStep({ kind }, state)).toEqual(q('heightMetres'));
    expect(resolveStep({ kind: 'result' }, EMPTY_STATE)).toEqual(q('inEngland'));
  });

  it('allows #result and #report once the checker is finished', () => {
    const state = stateWith({ ...base, storeys: 9 });
    expect(resolveStep({ kind: 'result' }, state)).toEqual({ kind: 'result' });
    expect(resolveStep({ kind: 'report' }, state)).toEqual({ kind: 'report' });
  });

  it('allows #readiness only when the building is in scope', () => {
    expect(resolveStep({ kind: 'readiness' }, stateWith({ ...base, storeys: 9 }))).toEqual({ kind: 'readiness' });
    expect(resolveStep({ kind: 'readiness' }, stateWith({ ...base, storeys: 2, heightMetres: 6 }))).toEqual({ kind: 'result' });
    expect(resolveStep({ kind: 'readiness' }, stateWith({ ...base, storeys: null, heightMetres: 9 }))).toEqual({ kind: 'result' });
  });

  it('ends the flow at a failing gate', () => {
    expect(resolveStep({ kind: 'result' }, stateWith({ inEngland: 'no' }))).toEqual({ kind: 'result' });
    expect(resolveStep(q('excludedPremises'), stateWith({ inEngland: 'no' }))).toEqual({ kind: 'result' });
  });
});

describe('previousStep (Back)', () => {
  it('goes back one asked question at a time, then to the intro', () => {
    const state = stateWith({ ...base, storeys: 4 });
    expect(previousStep(q('heightMetres'), state)).toEqual(q('storeys'));
    expect(previousStep(q('storeys'), state)).toEqual(q('dwellings'));
    expect(previousStep(q('inEngland'), state)).toEqual({ kind: 'intro' });
  });

  it('goes back from the result to the last question asked, skipping questions that were not asked', () => {
    expect(previousStep({ kind: 'result' }, stateWith({ ...base, storeys: 9 }))).toEqual(q('storeys'));
    expect(previousStep({ kind: 'result' }, stateWith({ inEngland: 'no' }))).toEqual(q('inEngland'));
    expect(previousStep({ kind: 'result' }, stateWith({ ...base, storeys: 4, heightMetres: 9 }))).toEqual(q('heightMetres'));
  });

  it('goes back from readiness to the result, and from the report to wherever it came from', () => {
    const state = stateWith({ ...base, storeys: 9 });
    expect(previousStep({ kind: 'readiness' }, state)).toEqual({ kind: 'result' });
    expect(previousStep({ kind: 'report' }, state)).toEqual({ kind: 'result' });
    expect(previousStep({ kind: 'report' }, { ...state, readinessDone: true })).toEqual({ kind: 'readiness' });
  });
});

describe('withAnswer: changing an earlier answer discards answers that are no longer asked', () => {
  it('keeps later answers that are still asked', () => {
    const state = stateWith({ ...base, storeys: 4, heightMetres: 15, evacuationStrategy: 'stay_put' });
    const changed = withAnswer(state, 'dwellings', 'two_or_more');
    expect(changed.answers).toEqual(state.answers);
  });

  it('drops everything after a gate that now fails', () => {
    const state = stateWith({ ...base, storeys: 4, heightMetres: 15, evacuationStrategy: 'stay_put' });
    expect(withAnswer(state, 'inEngland', 'no').answers).toEqual({ inEngland: 'no' });
  });

  it('drops the height and strategy when 7 storeys settles it, and the strategy when the height settles it', () => {
    const state = stateWith({ ...base, storeys: 4, heightMetres: 15, evacuationStrategy: 'stay_put' });
    expect(withAnswer(state, 'storeys', 7).answers).toEqual({ ...base, storeys: 7 });
    expect(withAnswer(state, 'heightMetres', 20).answers).toEqual({ ...base, storeys: 4, heightMetres: 20 });
    expect(withAnswer(state, 'heightMetres', 9).answers).toEqual({ ...base, storeys: 4, heightMetres: 9 });
  });

  it('clears the readiness check when the building stops being in scope', () => {
    const state = stateWith({ ...base, storeys: 9 }, { readiness: { R1: 'yes' }, readinessDone: true });
    const out = withAnswer(state, 'storeys', 3);
    expect(out.readiness).toEqual({});
    expect(out.readinessDone).toBe(false);
    expect(withAnswer(state, 'storeys', 10).readinessDone).toBe(true);
  });

  it('does not change the state it is given', () => {
    const state = stateWith({ ...base, storeys: 4 });
    const copy = structuredClone(state);
    withAnswer(state, 'storeys', 9);
    expect(state).toEqual(copy);
  });
});

describe('furthestStep and editStep', () => {
  it('goes to the next question, or to the result', () => {
    expect(furthestStep({})).toEqual(q('inEngland'));
    expect(furthestStep({ ...base, storeys: 9 })).toEqual({ kind: 'result' });
  });

  it('opens the first "I don\'t know" question when editing, otherwise the first question', () => {
    expect(editStep({ ...base, storeys: null, heightMetres: 15, evacuationStrategy: 'stay_put' })).toEqual(q('storeys'));
    expect(editStep({ ...base, storeys: 5, heightMetres: null, evacuationStrategy: 'unsure' })).toEqual(q('heightMetres'));
    expect(editStep({ ...base, storeys: 4, heightMetres: 12, evacuationStrategy: 'unsure' })).toEqual(q('evacuationStrategy'));
    expect(editStep({ ...base, storeys: 9 })).toEqual(q('inEngland'));
  });
});

describe('readiness helpers', () => {
  it('only returns a complete set of readiness answers', () => {
    expect(completeReadiness({ R1: 'yes' })).toBeNull();
    expect(completeReadiness({ R1: 'yes', R2: 'yes', R3: 'yes', R4: 'yes', R5: 'yes', R6: 'partly' })).toEqual({
      R1: 'yes',
      R2: 'yes',
      R3: 'yes',
      R4: 'yes',
      R5: 'yes',
      R6: 'partly',
    });
  });

  it('un-marks the readiness result when an answer changes', () => {
    const done = withReadinessDone(stateWith({ ...base, storeys: 9 }));
    expect(done.readinessDone).toBe(true);
    expect(withReadinessAnswer(done, 'R1', 'not_yet').readinessDone).toBe(false);
  });
});

describe('storage', () => {
  it('round-trips a state', () => {
    const state: CheckerState = stateWith(
      { ...base, storeys: 4, heightMetres: 12.5, evacuationStrategy: 'simultaneous' },
      { buildingRef: 'Example House', readiness: {}, readinessDone: false },
    );
    expect(parseStoredState(serialiseState(state))).toEqual(state);
  });

  it('turns nothing, junk or tampered data into an empty state or a safe one, and never throws', () => {
    expect(parseStoredState(null)).toEqual(EMPTY_STATE);
    expect(parseStoredState('')).toEqual(EMPTY_STATE);
    expect(parseStoredState('not json')).toEqual(EMPTY_STATE);
    expect(parseStoredState('[]')).toEqual(EMPTY_STATE);
    expect(parseStoredState('{"answers":"x"}')).toEqual(EMPTY_STATE);
    expect(parseStoredState(JSON.stringify({ answers: { inEngland: 'maybe' } })).answers).toEqual({});
    expect(parseStoredState(JSON.stringify({ buildingRef: 'x'.repeat(200) })).buildingRef).toBe('');
  });

  it('drops stored answers that the checker would not have asked, and readiness for a building not in scope', () => {
    const stored = JSON.stringify({
      answers: { inEngland: 'no', storeys: 10 },
      readiness: { R1: 'yes' },
      readinessDone: true,
    });
    const state = parseStoredState(stored);
    expect(state.answers).toEqual({ inEngland: 'no' });
    expect(state.readiness).toEqual({});
    expect(state.readinessDone).toBe(false);
  });

  it('keeps readiness for a building that is in scope', () => {
    const stored = JSON.stringify({ answers: { ...base, storeys: 9 }, readiness: { R1: 'yes', R2: 'partly' }, readinessDone: false });
    expect(parseStoredState(stored).readiness).toEqual({ R1: 'yes', R2: 'partly' });
  });

  it('"Start again" clears everything', () => {
    expect(cleared()).toEqual(EMPTY_STATE);
    expect(cleared().contact).toBeNull();
  });
});
