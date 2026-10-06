'use client';

import { ReportForm } from '@/components/forms/ReportForm';
import { reportCopy } from '@/content/questions';
import { completeReadiness } from '@/lib/checker/state';
import { useCheckerState } from '@/lib/checker/store';
import { evaluateScope } from '@/lib/scope/engine';

/** The report form, with the answers and (for a building in scope) the readiness answers from the checker. */
export function ReportSection({ showHeading = false }: { showHeading?: boolean }) {
  const [state] = useCheckerState();
  const inScope = evaluateScope(state.answers).status === 'in_scope';
  const readiness = inScope && state.readinessDone ? completeReadiness(state.readiness) : null;
  return (
    <section aria-label="Free report" className="grid gap-6">
      {showHeading ? <h2 className="text-xl">{reportCopy.title}</h2> : null}
      <ReportForm answers={state.answers} buildingRef={state.buildingRef} readiness={readiness} />
    </section>
  );
}
