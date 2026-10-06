import { CircleCheck, CircleMinus, CircleQuestionMark, type LucideIcon } from 'lucide-react';
import type { ScopeStatus } from '@/lib/scope/engine';
import { cn } from '@/lib/utils';

const config: Record<ScopeStatus, { label: string; icon: LucideIcon; className: string }> = {
  in_scope: { label: 'In scope', icon: CircleCheck, className: 'bg-success' },
  not_in_scope: { label: 'Not in scope', icon: CircleMinus, className: 'bg-neutral' },
  cannot_confirm: { label: "Can't confirm yet", icon: CircleQuestionMark, className: 'bg-warning' },
};

/** Icon plus text, never colour alone: check-circle, minus-circle or help-circle (PRD section 5). */
export function ResultBadge({ status, className }: { status: ScopeStatus; className?: string }) {
  const { label, icon: Icon, className: colour } = config[status];
  return (
    <span
      className={cn('inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-base font-semibold text-white', colour, className)}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}
