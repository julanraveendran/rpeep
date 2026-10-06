import * as React from 'react';
import { ChevronDown, CircleQuestionMark } from 'lucide-react';
import { cn } from '@/lib/utils';

type HelpDisclosureProps = Omit<React.ComponentProps<'details'>, 'children'> & {
  summary?: React.ReactNode;
  children: React.ReactNode;
};

/** "What does this mean?" help for a question, using native `<details>`/`<summary>`. */
export function HelpDisclosure({ summary = 'What does this mean?', children, className, ...props }: HelpDisclosureProps) {
  return (
    <details className={cn('group', className)} {...props}>
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-navy-700 underline underline-offset-4 marker:hidden [&::-webkit-details-marker]:hidden">
        <CircleQuestionMark className="size-5 shrink-0" aria-hidden="true" />
        <span>{summary}</span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-2 rounded-card bg-surface p-4 text-ink [&>*+*]:mt-2">{children}</div>
    </details>
  );
}
