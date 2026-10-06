import { how } from '@/content/home';
import { cn } from '@/lib/utils';

/**
 * A static "concept preview" of the future app dashboard (PRD section 6, item 5). It uses a clearly
 * fictional building and shows no figures: nothing here is real customer data. It is described to
 * screen readers as one image so the example rows are not read out as if they were real.
 */
const examples = ['Done', 'Done', 'In progress', 'Not started', 'Not started', 'Not started', 'Not started'] as const;

export function ConceptDashboard({ className }: { className?: string }) {
  return (
    <figure className={cn('m-0', className)}>
      <div
        role="img"
        aria-label="Concept preview of the dashboard, in development. Example building, example data only."
        className="overflow-hidden rounded-card border border-border bg-white shadow-card"
      >
        <div aria-hidden="true">
          <div className="flex items-center justify-between gap-3 bg-navy-900 px-4 py-3 text-sm font-semibold text-white">
            <span>Example House</span>
            <span className="rounded-full border border-white/40 px-2.5 py-0.5 text-xs">Example data</span>
          </div>
          <ul className="divide-y divide-border text-sm">
            {how.steps.map((step, index) => {
              const status = examples[index];
              return (
                <li key={step.title} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-ink">{step.title}</span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      status === 'Done' && 'bg-success text-white',
                      status === 'In progress' && 'bg-warning text-white',
                      status === 'Not started' && 'bg-surface text-muted ring-1 ring-border',
                    )}
                  >
                    {status}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <figcaption className="mt-3 text-sm font-semibold text-muted">Concept preview — in development</figcaption>
    </figure>
  );
}
