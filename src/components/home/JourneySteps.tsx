import { how } from '@/content/home';

/** Seven numbered steps: a vertical list on mobile and a horizontal stepper on large screens (PRD section 6, item 5). */
export function JourneySteps() {
  return (
    <ol className="grid gap-0 lg:grid-cols-7 lg:gap-4">
      {how.steps.map((step, index) => (
        <li key={step.title} className="relative flex gap-4 pb-8 last:pb-0 lg:flex-col lg:items-center lg:gap-3 lg:pb-0 lg:text-center">
          {/* connector: vertical on mobile, horizontal on large screens */}
          {index < how.steps.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute top-10 bottom-0 left-5 w-0.5 -translate-x-1/2 bg-input-border lg:top-5 lg:right-0 lg:bottom-auto lg:left-[calc(50%+1.5rem)] lg:h-0.5 lg:w-[calc(100%-3rem+1rem)] lg:translate-x-0 lg:-translate-y-1/2"
            />
          ) : null}
          <span className="tabular relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-900 font-bold text-white">
            {index + 1}
          </span>
          <span className="pt-1.5 lg:pt-0">
            <span className="block font-semibold text-navy-900">{step.title}</span>
            {'detail' in step ? <span className="block text-sm text-muted">({step.detail})</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
