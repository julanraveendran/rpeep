/**
 * Checker state and navigation (PRD section 8A, "Navigation and state"). Pure functions only, so the
 * rules can be tested without a browser: which step a URL hash means, which steps can be reached,
 * and what happens to later answers when an earlier one changes.
 */

import { z } from 'zod';
import { buildingsBandLabels, keysOf, orgTypeLabels, roleLabels } from '@/content/forms';
import type { ReadinessAnswers } from '@/lib/readiness/score';
import { partialAnswersSchema, partialReadinessSchema } from '@/lib/schemas';
import { pruneAnswers } from '@/lib/scope/answers';
import { evaluateScope, getNextQuestion, type Answers, type QuestionId, type ScopeResult } from '@/lib/scope/engine';

/** `sessionStorage` key. Strictly necessary for the checker; listed on /cookies. */
export const STORAGE_KEY = 'rpeep-checker-v1';

/** Contact details kept after a report request, to pre-fill the pilot form (PRD section 10). */
export type StoredContact = {
  firstName: string;
  email: string;
  organisation: string;
  role: keyof typeof roleLabels;
  roleOther: string | null;
  orgType: keyof typeof orgTypeLabels;
  buildingsBand: keyof typeof buildingsBandLabels;
};

export type CheckerState = {
  buildingRef: string;
  answers: Partial<Answers>;
  readiness: Partial<ReadinessAnswers>;
  /** True once the readiness result has been shown. */
  readinessDone: boolean;
  contact: StoredContact | null;
  /** The report this browser requested, so a pilot application can link to it. */
  reportId: string | null;
  /** First name from the pilot form, for "Thanks, {first name}" on the thanks page. */
  pilotFirstName: string | null;
};

export const EMPTY_STATE: CheckerState = {
  buildingRef: '',
  answers: {},
  readiness: {},
  readinessDone: false,
  contact: null,
  reportId: null,
  pilotFirstName: null,
};

const storedSchema = z.object({
  buildingRef: z.string().max(80).catch(''),
  answers: partialAnswersSchema.catch({}),
  readiness: partialReadinessSchema.catch({}),
  readinessDone: z.boolean().catch(false),
  contact: z
    .object({
      firstName: z.string(),
      email: z.string(),
      organisation: z.string(),
      role: z.enum(keysOf(roleLabels)),
      roleOther: z.string().nullable(),
      orgType: z.enum(keysOf(orgTypeLabels)),
      buildingsBand: z.enum(keysOf(buildingsBandLabels)),
    })
    .nullable()
    .catch(null),
  reportId: z.uuid().nullable().catch(null),
  pilotFirstName: z.string().max(60).nullable().catch(null),
});

/** Reads what is in storage. Never throws: anything unreadable or tampered with becomes an empty state. */
export function parseStoredState(raw: string | null): CheckerState {
  if (!raw) return EMPTY_STATE;
  try {
    const parsed = storedSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return EMPTY_STATE;
    const answers = pruneAnswers(parsed.data.answers as Partial<Answers>);
    return normalise({ ...parsed.data, answers: answers as Partial<Answers>, readiness: parsed.data.readiness as Partial<ReadinessAnswers> });
  } catch {
    return EMPTY_STATE;
  }
}

export function serialiseState(state: CheckerState): string {
  return JSON.stringify(state);
}

/** Drops readiness answers when the building is not in scope any more. */
function normalise(state: CheckerState): CheckerState {
  if (isComplete(state.answers) && evaluateScope(state.answers).status === 'in_scope') return state;
  if (Object.keys(state.readiness).length === 0 && !state.readinessDone) return state;
  return { ...state, readiness: {}, readinessDone: false };
}

// ---------------------------------------------------------------------------
// Questions asked so far
// ---------------------------------------------------------------------------

/** True once `getNextQuestion` has nothing left to ask. */
export function isComplete(answers: Partial<Answers>): boolean {
  return getNextQuestion(answers) === null;
}

/**
 * The questions answered so far, in the order they are asked, and the one to ask next (`null` when
 * finished). Replays `getNextQuestion`, so an answer to a question that would not be asked is ignored.
 */
export function askedQuestions(answers: Partial<Answers>): { answered: QuestionId[]; next: QuestionId | null } {
  const kept: Partial<Answers> = {};
  const answered: QuestionId[] = [];
  for (let guard = 0; guard < 8; guard++) {
    const next = getNextQuestion(kept);
    if (next === null) return { answered, next: null };
    const value = answers[next];
    if (value === undefined) return { answered, next };
    (kept as Record<string, unknown>)[next] = value;
    answered.push(next);
  }
  return { answered, next: null };
}

/** The result for finished answers, or `null` while there are still questions to ask. */
export function resultFor(answers: Partial<Answers>): ScopeResult | null {
  return isComplete(answers) ? evaluateScope(answers) : null;
}

// ---------------------------------------------------------------------------
// Steps and URL hashes
// ---------------------------------------------------------------------------

export type Step =
  | { kind: 'intro' }
  | { kind: 'question'; id: QuestionId }
  | { kind: 'result' }
  | { kind: 'readiness' }
  | { kind: 'report' };

const QUESTION_IDS: readonly QuestionId[] = ['inEngland', 'excludedPremises', 'dwellings', 'storeys', 'heightMetres', 'evacuationStrategy'];

/** `#q-storeys`, `#result`, `#readiness`, `#report`. The intro has no hash. */
export function stepToHash(step: Step): string {
  switch (step.kind) {
    case 'intro':
      return '';
    case 'question':
      return `#q-${step.id}`;
    case 'result':
      return '#result';
    case 'readiness':
      return '#readiness';
    case 'report':
      return '#report';
  }
}

export function hashToStep(hash: string): Step {
  const value = hash.replace(/^#/, '');
  if (value === 'result') return { kind: 'result' };
  if (value === 'readiness') return { kind: 'readiness' };
  if (value === 'report') return { kind: 'report' };
  if (value.startsWith('q-')) {
    const id = QUESTION_IDS.find((candidate) => candidate === value.slice(2));
    if (id) return { kind: 'question', id };
  }
  return { kind: 'intro' };
}

export function sameStep(a: Step, b: Step): boolean {
  return stepToHash(a) === stepToHash(b);
}

/** The first screen the answers so far lead to: the next question, or the result. */
export function furthestStep(answers: Partial<Answers>): Step {
  const { next } = askedQuestions(answers);
  return next ? { kind: 'question', id: next } : { kind: 'result' };
}

/**
 * The step to actually show for a requested step. A URL such as `#result` typed in too early, or left
 * over after an answer changed, falls back to the furthest step the answers allow.
 */
export function resolveStep(requested: Step, state: CheckerState): Step {
  const { answered, next } = askedQuestions(state.answers);
  switch (requested.kind) {
    case 'intro':
      return requested;
    case 'question':
      return answered.includes(requested.id) || requested.id === next ? requested : furthestStep(state.answers);
    case 'result':
    case 'report':
      return next === null ? requested : furthestStep(state.answers);
    case 'readiness':
      if (next !== null) return furthestStep(state.answers);
      return evaluateScope(state.answers).status === 'in_scope' ? requested : { kind: 'result' };
  }
}

/** Where "Back" goes from a step. */
export function previousStep(step: Step, state: CheckerState): Step {
  switch (step.kind) {
    case 'intro':
      return step;
    case 'question': {
      const { answered, next } = askedQuestions(state.answers);
      const order = next ? [...answered, next] : answered;
      const index = order.indexOf(step.id);
      const previous = index > 0 ? order[index - 1] : undefined;
      return previous ? { kind: 'question', id: previous } : { kind: 'intro' };
    }
    case 'result':
      return { kind: 'question', id: lastQuestion(state.answers) };
    case 'readiness':
      return { kind: 'result' };
    case 'report':
      return state.readinessDone ? { kind: 'readiness' } : { kind: 'result' };
  }
}

function lastQuestion(answers: Partial<Answers>): QuestionId {
  const { answered } = askedQuestions(answers);
  return answered[answered.length - 1] ?? 'inEngland';
}

/**
 * The screen to open when the visitor chooses "Edit answers": the first question they could not answer
 * (so a "cannot confirm" result leads straight to what is missing), or else the first question.
 */
export function editStep(answers: Partial<Answers>): Step {
  const { answered } = askedQuestions(answers);
  const unknown = answered.find((id) => answers[id] === null || (id === 'evacuationStrategy' && answers[id] === 'unsure'));
  return { kind: 'question', id: unknown ?? 'inEngland' };
}

// ---------------------------------------------------------------------------
// Changing state
// ---------------------------------------------------------------------------

/**
 * Record an answer. Answers to questions that are no longer asked are discarded (PRD section 8A), and
 * the readiness check is cleared if the building is not in scope any more.
 */
export function withAnswer<K extends QuestionId>(state: CheckerState, id: K, value: Answers[K]): CheckerState {
  const answers = pruneAnswers({ ...state.answers, [id]: value });
  return normalise({ ...state, answers });
}

export function withBuildingRef(state: CheckerState, buildingRef: string): CheckerState {
  return { ...state, buildingRef: buildingRef.slice(0, 80) };
}

export function withReadinessAnswer(state: CheckerState, id: keyof ReadinessAnswers, value: ReadinessAnswers[keyof ReadinessAnswers]): CheckerState {
  return { ...state, readiness: { ...state.readiness, [id]: value }, readinessDone: false };
}

export function withReadinessDone(state: CheckerState): CheckerState {
  return { ...state, readinessDone: true };
}

/** After an answer: the next question, or the result when there is nothing left to ask. */
export function nextAfterAnswer(state: CheckerState): Step {
  return furthestStep(state.answers);
}

/** "Start again" clears everything, including saved contact details. */
export function cleared(): CheckerState {
  return EMPTY_STATE;
}

/** Readiness answers as a complete object, or `null` if any question is unanswered. */
export function completeReadiness(readiness: Partial<ReadinessAnswers>): ReadinessAnswers | null {
  const { R1, R2, R3, R4, R5, R6 } = readiness;
  return R1 && R2 && R3 && R4 && R5 && R6 ? { R1, R2, R3, R4, R5, R6 } : null;
}
