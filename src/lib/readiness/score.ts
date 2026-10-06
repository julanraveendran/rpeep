/**
 * Readiness check scoring: PRD section 8C ("Part B").
 *
 * Six questions, each answered Yes (2 points), Partly (1) or Not yet (0), so the total is 0–12.
 * Pure and free of the system clock, like the scope engine. The server scores the answers again
 * on every report request and ignores any score sent by the browser.
 */

export const READINESS_IDS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'] as const;
export type ReadinessId = (typeof READINESS_IDS)[number];

export const READINESS_ANSWERS = ['yes', 'partly', 'not_yet'] as const;
export type ReadinessAnswer = (typeof READINESS_ANSWERS)[number];

export type ReadinessAnswers = Record<ReadinessId, ReadinessAnswer>;

export type ReadinessBand = 'well_prepared' | 'partly_prepared' | 'early_stages';

export const READINESS_MAX_SCORE = READINESS_IDS.length * 2;

export const readinessPoints: Record<ReadinessAnswer, number> = { yes: 2, partly: 1, not_yet: 0 };

export const readinessBandLabels: Record<ReadinessBand, string> = {
  well_prepared: 'Well prepared',
  partly_prepared: 'Partly prepared',
  early_stages: 'Early stages',
};

export type ReadinessResult = {
  /** 0–12. */
  score: number;
  band: ReadinessBand;
  bandLabel: string;
  /** For example "7 out of 12 — Partly prepared". */
  summary: string;
  /** Every question not answered "Yes", in R1–R6 order. */
  gaps: ReadinessId[];
};

/** 10–12 = Well prepared; 6–9 = Partly prepared; 0–5 = Early stages. */
export function readinessBand(score: number): ReadinessBand {
  if (score >= 10) return 'well_prepared';
  if (score >= 6) return 'partly_prepared';
  return 'early_stages';
}

export function scoreReadiness(answers: ReadinessAnswers): ReadinessResult {
  let score = 0;
  const gaps: ReadinessId[] = [];

  for (const id of READINESS_IDS) {
    const answer = answers[id];
    if (!(READINESS_ANSWERS as readonly unknown[]).includes(answer)) {
      throw new Error(`Invalid readiness answer for ${id}: ${String(answer)}`);
    }
    score += readinessPoints[answer];
    if (answer !== 'yes') gaps.push(id);
  }

  const band = readinessBand(score);
  const bandLabel = readinessBandLabels[band];
  return { score, band, bandLabel, summary: `${score} out of ${READINESS_MAX_SCORE} — ${bandLabel}`, gaps };
}
