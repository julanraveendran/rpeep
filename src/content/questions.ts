/**
 * Question text, options and help text: PRD section 8.
 * Part A (scope questions, 8A) is added in the checker UI phase. This file currently holds
 * the Part B readiness check (8C). Copy must match docs/PRD.md word for word.
 */

import type { ReadinessAnswer, ReadinessId } from '@/lib/readiness/score';

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
