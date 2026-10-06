import { readinessCopy, readinessQuestion } from '@/content/questions';
import type { ReadinessId } from '@/lib/readiness/score';

/** The gap list: every question not answered "Yes", in R1–R6 order, with the text from PRD section 8C. */
export function ReadinessGaps({ gaps }: { gaps: readonly ReadinessId[] }) {
  return (
    <section aria-labelledby="gaps-heading">
      <h2 id="gaps-heading" className="text-xl">
        {readinessCopy.gapsHeading}
      </h2>
      {gaps.length === 0 ? (
        <p className="mt-3">{readinessCopy.noGaps}</p>
      ) : (
        <ol className="mt-4 grid gap-3">
          {gaps.map((id) => (
            <li key={id} className="rounded-card border border-border bg-white p-4">
              <span className="tabular mr-2 font-semibold text-navy-900">{id}</span>
              {readinessQuestion(id).gapText}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
