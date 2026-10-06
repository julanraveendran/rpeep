import { cn } from '@/lib/utils';

type StepperProps = {
  /** The question being shown, starting at 1. */
  current: number;
  /** Most questions the checker can ask (6). */
  max: number;
  /** Questions answered so far. The bar fills by `answered / max`, reaching 100% on the result screen. */
  answered: number;
  /** Shows "of up to 6" because the checker may finish early. Defaults to true. */
  upTo?: boolean;
  className?: string;
};

/** Progress bar with the text "Question 3 of 6" for sighted and screen reader users (PRD section 5 and 8A). */
export function Stepper({ current, max, answered, upTo = true, className }: StepperProps) {
  const percent = Math.min(100, Math.max(0, Math.round((answered / max) * 100)));
  return (
    <div className={cn('w-full', className)}>
      <p className="tabular mb-2 text-sm font-semibold text-muted">
        Question {current} of {upTo ? 'up to ' : ''}
        {max}
      </p>
      <div aria-hidden="true" className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-navy-900 transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
