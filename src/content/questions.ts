/**
 * Question text, options and help text: PRD section 8. Part A is the scope questions (8A)
 * and Part B is the readiness check (8C). Copy must match docs/PRD.md word for word.
 */

import type { ReadinessAnswer, ReadinessId } from '@/lib/readiness/score';
import type { Answers, QuestionId } from '@/lib/scope/engine';

// ---------------------------------------------------------------------------
// Part A: scope questions (PRD section 8A)
// ---------------------------------------------------------------------------

export const checkerIntro = {
  title: 'Is your building in scope?',
  text: 'Answer up to six questions about one building. It takes about 2 minutes. No account needed.',
  referenceLabel: 'Building name or reference (optional, shown on your report)',
  referenceHelper: 'Do not enter a full address or any resident details.',
  referenceMaxLength: 80,
  start: 'Start',
};

/** Shown on the intro, on every result, in the PDF and in the email (PRD sections 8B and 13). */
export const disclaimer = 'This is guidance based on SI 2025/797, not legal advice. Confirm with a competent fire safety professional.';

export const MAX_SCOPE_QUESTIONS = 6;

type Option = { value: string; label: string };

export type ScopeQuestion = {
  id: QuestionId;
  /** The question, shown as the heading of its screen. */
  question: string;
  /** A short name for the "Your answers" summary and the PDF table. */
  summaryLabel: string;
  /** Help text for "What does this mean?". One string, or a list of bullets. */
  help: string | readonly string[];
} & (
  | { kind: 'radio'; options: readonly Option[] }
  | { kind: 'number'; unit: string; inputMode: 'numeric' | 'decimal' }
);

export const scopeQuestions: Record<QuestionId, ScopeQuestion> = {
  inEngland: {
    id: 'inEngland',
    kind: 'radio',
    question: 'Is the building in England?',
    summaryLabel: 'Building is in England',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: "No — it's in Wales, Scotland or Northern Ireland" },
    ],
    help: 'The regulations apply in England only.',
  },
  excludedPremises: {
    id: 'excludedPremises',
    kind: 'radio',
    question: 'Is the building military premises, or within the Palace of Westminster?',
    summaryLabel: 'Military premises or Palace of Westminster',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
    ],
    help: 'Military premises means military barracks, or a building used only for the armed forces or a visiting force.',
  },
  dwellings: {
    id: 'dwellings',
    kind: 'radio',
    question: 'Does the building contain two or more homes, such as flats or maisonettes?',
    summaryLabel: 'Two or more homes',
    options: [
      { value: 'two_or_more', label: 'Yes, two or more' },
      { value: 'fewer_than_two', label: 'No, fewer than two' },
    ],
    help: 'Mixed-use buildings count if they contain two or more sets of domestic premises.',
  },
  storeys: {
    id: 'storeys',
    kind: 'number',
    question: 'How many storeys does the building have above ground level?',
    summaryLabel: 'Storeys above ground level',
    unit: 'storeys',
    inputMode: 'numeric',
    help: [
      'Do not count basements or any storey whose ceiling is partly below the ground next to it.',
      'Count a mezzanine only if its floor area is at least half the area of the largest storey above ground.',
    ],
  },
  heightMetres: {
    id: 'heightMetres',
    kind: 'number',
    question: 'How high is the top storey above ground level?',
    summaryLabel: 'Height of the top storey',
    unit: 'm',
    inputMode: 'decimal',
    help: 'Use the height of the top storey stated in your fire risk assessment or fire strategy. This is not the height to the roof.',
  },
  evacuationStrategy: {
    id: 'evacuationStrategy',
    kind: 'radio',
    question: "What is the building's evacuation strategy?",
    summaryLabel: 'Evacuation strategy',
    options: [
      { value: 'stay_put', label: 'Stay put' },
      { value: 'simultaneous', label: 'Simultaneous evacuation — everyone leaves straight away' },
      { value: 'temporary_simultaneous', label: 'Temporary simultaneous evacuation — for example during remediation works' },
      { value: 'phased_or_other', label: 'Phased or other' },
      { value: 'unsure', label: "I'm not sure" },
    ],
    help: 'A simultaneous evacuation strategy means the Responsible Person has decided that everyone should leave the building immediately in the event of a fire.',
  },
};

/** "Not known" is how "I don't know" is shown in summaries and the PDF (PRD section 9D). */
export const NOT_KNOWN = 'Not known';

/** The answer as shown to the visitor: the option label, a number with its unit, or "Not known". */
export function describeAnswer(id: QuestionId, answers: Partial<Answers>): string | null {
  const question = scopeQuestions[id];
  const value = answers[id];
  if (value === undefined) return null;
  if (question.kind === 'number') {
    if (value === null) return NOT_KNOWN;
    return question.unit === 'm' ? `${value} m` : `${value}`;
  }
  return question.options.find((option) => option.value === value)?.label ?? null;
}

// ---------------------------------------------------------------------------
// Result screen and readiness copy (PRD sections 8B and 8C)
// ---------------------------------------------------------------------------

export const resultCopy = {
  reasonsHeading: 'Why',
  missingHeading: 'What we still need',
  dutiesHeading: 'Duties that apply',
  answersHeading: 'Your answers',
  buildingLabel: 'Building',
  edit: 'Edit',
  actions: {
    checkReadiness: 'Check how ready you are (1 minute)',
    skipToReport: 'Skip to my free report',
    editAnswers: 'Edit answers',
    startAgain: 'Start again',
    emailResult: 'Email me this result',
    checkAnother: 'Check another building',
  },
  pilot: { text: 'Want help managing RPEEPs?', cta: 'Join the pilot' },
};

export const readinessCopy = {
  title: 'Check how ready you are',
  gapsHeading: 'Gaps to work on',
  noGaps: 'You answered "Yes" to every question.',
  changeAnswers: 'Change my answers',
  validationSummary: 'There is a problem',
};

export const reportCopy = {
  title: 'Get your free report',
};

export type ReadinessQuestion = {
  id: ReadinessId;
  question: string;
  /** Shown when the answer is "Partly" or "Not yet". */
  gapText: string;
};

export const readinessQuestions: readonly ReadinessQuestion[] = [
  {
    id: 'R1',
    question:
      'Have you used reasonable endeavours to identify residents who may need help to evacuate, for example letters, notices or visits?',
    gapText:
      'Plan how you will identify residents: letters, notices in common areas and a simple way to self-refer. Keep a record of every attempt. (regulation 5)',
  },
  {
    id: 'R2',
    question: 'Have you offered a person-centred fire risk assessment to every resident identified?',
    gapText:
      'Offer an assessment to every resident identified, and record each offer, acceptance or refusal. (regulation 6)',
  },
  {
    id: 'R3',
    question:
      'Where an approach is agreed, is it recorded in a written emergency evacuation statement, with a copy given to the resident?',
    gapText:
      'Record agreed approaches as written emergency evacuation statements and give each resident a copy. (regulation 8)',
  },
  {
    id: 'R4',
    question:
      'Do you record explicit consent before sharing information with the fire service, and do you know which method your fire service has chosen?',
    gapText:
      'Check how your local fire and rescue service wants to receive information, and record explicit consent before sharing anything. (regulation 10)',
  },
  {
    id: 'R5',
    question: 'Has a building emergency evacuation plan been prepared and given to the fire service?',
    gapText:
      'Prepare the building emergency evacuation plan, send it to the fire service, and place a copy in the secure information box if there is one. (regulation 13)',
  },
  {
    id: 'R6',
    question: 'Do you have a reliable way to track 12-month review dates for every assessment, statement and building plan?',
    gapText:
      'Set up reminders for every review: within 12 months, then at least every 12 months. (regulations 9 and 13)',
  },
];

/** Answer labels for every readiness question, in display order. Points are in `readinessPoints`. */
export const readinessAnswerOptions: readonly { value: ReadinessAnswer; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'partly', label: 'Partly' },
  { value: 'not_yet', label: 'Not yet' },
];

export function readinessQuestion(id: ReadinessId): ReadinessQuestion {
  const question = readinessQuestions.find((item) => item.id === id);
  if (!question) throw new Error(`Unknown readiness question: ${id}`);
  return question;
}
