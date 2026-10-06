import { readFileSync } from 'node:fs';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { readinessAnswerOptions, readinessQuestion, readinessQuestions } from '@/content/questions';
import {
  READINESS_ANSWERS,
  READINESS_IDS,
  readinessBand,
  scoreReadiness,
  type ReadinessAnswer,
  type ReadinessAnswers,
  type ReadinessId,
} from './score';

const all = (answer: ReadinessAnswer): ReadinessAnswers => ({ R1: answer, R2: answer, R3: answer, R4: answer, R5: answer, R6: answer });

/** Build answers that total `score`, by giving "yes" to the first questions, then at most one "partly". */
function answersTotalling(score: number): ReadinessAnswers {
  const answers = all('not_yet');
  let remaining = score;
  for (const id of READINESS_IDS) {
    if (remaining >= 2) {
      answers[id] = 'yes';
      remaining -= 2;
    } else if (remaining === 1) {
      answers[id] = 'partly';
      remaining -= 1;
    }
  }
  return answers;
}

describe('scoreReadiness (PRD section 15A)', () => {
  it('all yes is 12, "Well prepared", with no gaps', () => {
    const result = scoreReadiness(all('yes'));
    expect(result.score).toBe(12);
    expect(result.bandLabel).toBe('Well prepared');
    expect(result.band).toBe('well_prepared');
    expect(result.gaps).toEqual([]);
  });

  it('all partly is 6, "Partly prepared", with every question in the gap list', () => {
    const result = scoreReadiness(all('partly'));
    expect(result.score).toBe(6);
    expect(result.bandLabel).toBe('Partly prepared');
    expect(result.gaps).toEqual(['R1', 'R2', 'R3', 'R4', 'R5', 'R6']);
  });

  it('all not yet is 0, "Early stages", with every question in the gap list', () => {
    const result = scoreReadiness(all('not_yet'));
    expect(result.score).toBe(0);
    expect(result.bandLabel).toBe('Early stages');
    expect(result.gaps).toEqual(['R1', 'R2', 'R3', 'R4', 'R5', 'R6']);
  });

  it.each([
    [5, 'Early stages'],
    [6, 'Partly prepared'],
    [9, 'Partly prepared'],
    [10, 'Well prepared'],
  ])('a total of %i is "%s"', (score, label) => {
    const result = scoreReadiness(answersTotalling(score));
    expect(result.score).toBe(score);
    expect(result.bandLabel).toBe(label);
  });

  it('maps every possible total from 0 to 12 to the right band', () => {
    for (let score = 0; score <= 12; score++) {
      const expected = score >= 10 ? 'well_prepared' : score >= 6 ? 'partly_prepared' : 'early_stages';
      expect(readinessBand(score), `score ${score}`).toBe(expected);
    }
  });

  it('formats the summary as "7 out of 12 — Partly prepared"', () => {
    const result = scoreReadiness({ R1: 'yes', R2: 'yes', R3: 'yes', R4: 'partly', R5: 'not_yet', R6: 'not_yet' });
    expect(result.score).toBe(7);
    expect(result.summary).toBe('7 out of 12 — Partly prepared');
  });

  it('lists exactly the questions that are not "yes", in R1 to R6 order', () => {
    const result = scoreReadiness({ R1: 'not_yet', R2: 'yes', R3: 'partly', R4: 'yes', R5: 'yes', R6: 'not_yet' });
    expect(result.gaps).toEqual(['R1', 'R3', 'R6']);
  });

  it('is correct for every one of the 729 possible sets of answers', () => {
    const points = { yes: 2, partly: 1, not_yet: 0 } as const;
    let count = 0;
    const walk = (index: number, answers: Partial<ReadinessAnswers>) => {
      if (index === READINESS_IDS.length) {
        const full = answers as ReadinessAnswers;
        const result = scoreReadiness(full);
        const score = READINESS_IDS.reduce((total, id) => total + points[full[id]], 0);
        expect(result.score).toBe(score);
        expect(result.gaps).toEqual(READINESS_IDS.filter((id) => full[id] !== 'yes'));
        expect(result.band).toBe(score >= 10 ? 'well_prepared' : score >= 6 ? 'partly_prepared' : 'early_stages');
        count++;
        return;
      }
      for (const answer of READINESS_ANSWERS) walk(index + 1, { ...answers, [READINESS_IDS[index] as ReadinessId]: answer });
    };
    walk(0, {});
    expect(count).toBe(729);
  });

  it('property: the score is always 0–12 and equals twice the "yes" answers plus the "partly" answers', () => {
    const answer = fc.constantFrom(...READINESS_ANSWERS);
    fc.assert(
      fc.property(fc.record({ R1: answer, R2: answer, R3: answer, R4: answer, R5: answer, R6: answer }), (answers) => {
        const values = Object.values(answers);
        const expected = values.filter((v) => v === 'yes').length * 2 + values.filter((v) => v === 'partly').length;
        const result = scoreReadiness(answers);
        expect(result.score).toBe(expected);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(12);
      }),
    );
  });

  it('rejects an answer it does not know, rather than scoring it', () => {
    expect(() => scoreReadiness({ ...all('yes'), R3: 'maybe' as ReadinessAnswer })).toThrow(/R3/);
    expect(() => scoreReadiness({ ...all('yes'), R2: undefined as unknown as ReadinessAnswer })).toThrow(/R2/);
  });

  it('does not change the answers it is given', () => {
    const answers = all('partly');
    scoreReadiness(answers);
    expect(answers).toEqual(all('partly'));
  });
});

describe('readiness copy (PRD section 8C) matches docs/PRD.md word for word', () => {
  const prd = readFileSync(new URL('../../../docs/PRD.md', import.meta.url), 'utf8');
  const start = prd.indexOf('### C. Readiness check (Part B)');
  const rows = prd
    .slice(start)
    .split('\n')
    .filter((line) => /^\| R[1-6] \|/.test(line))
    .map((line) => line.slice(1, line.lastIndexOf('|')).split(' | ').map((cell) => cell.trim()));

  it('has the six questions and gap texts of the PRD table', () => {
    expect(rows).toHaveLength(6);
    expect(readinessQuestions).toEqual(rows.map(([id, question, gapText]) => ({ id, question, gapText })));
  });

  it('has the answer options Yes, Partly and Not yet', () => {
    expect(readinessAnswerOptions.map((option) => option.label)).toEqual(['Yes', 'Partly', 'Not yet']);
    expect(readinessAnswerOptions.map((option) => option.value)).toEqual([...READINESS_ANSWERS]);
  });

  it('looks a question up by id, and rejects an unknown one', () => {
    expect(readinessQuestion('R4').gapText).toContain('regulation 10');
    expect(() => readinessQuestion('R7' as ReadinessId)).toThrow(/R7/);
  });

  it('cites a regulation number in every gap text', () => {
    for (const question of readinessQuestions) expect(question.gapText).toMatch(/\(regulations? [\d]+( and \d+)?\)$/);
  });
});
