import { getNextQuestion, type Answers, type QuestionId } from './engine';

const ORDER: readonly QuestionId[] = ['inEngland', 'excludedPremises', 'dwellings', 'storeys', 'heightMetres', 'evacuationStrategy'];

/**
 * Keep only the answers to questions the checker would actually have asked.
 *
 * Replays `getNextQuestion` from the start, so an answer to a question that is no longer asked
 * (for example a height given after "not in England") is dropped. Used when a visitor changes an
 * earlier answer (PRD section 8A), and by the server so the stored answers always match what the
 * engine would have asked.
 */
export function pruneAnswers(answers: Partial<Answers>): Partial<Answers> {
  const kept: Partial<Answers> = {};
  for (let step = 0; step < ORDER.length; step++) {
    const next = getNextQuestion(kept);
    if (next === null) break;
    const value = answers[next];
    if (value === undefined) break;
    (kept as Record<string, unknown>)[next] = value;
  }
  return kept;
}
