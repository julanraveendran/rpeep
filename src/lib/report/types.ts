import type { ReadinessAnswers, ReadinessResult } from '@/lib/readiness/score';
import type { Answers, ScopeResult } from '@/lib/scope/engine';

/** Everything the PDF and the emails need about one report. Built on the server from the server engine run. */
export type ReportData = {
  reportId: string;
  createdAt: Date;
  firstName: string;
  organisation: string;
  /** Building name or reference, if the visitor gave one. */
  buildingRef: string | null;
  answers: Partial<Answers>;
  scope: ScopeResult;
  /** Only when the building is in scope and the readiness check was completed. */
  readiness: { answers: ReadinessAnswers; result: ReadinessResult } | null;
};
