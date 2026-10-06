import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * FAQ accordion built on native `<details>`/`<summary>`: keyboard and screen reader
 * support come from the browser, and it needs no client JavaScript.
 */
export function Accordion({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('divide-y divide-border rounded-card border border-border bg-white', className)} {...props} />;
}

type AccordionItemProps = Omit<React.ComponentProps<'details'>, 'children'> & {
  question: React.ReactNode;
  children: React.ReactNode;
};

export function AccordionItem({ question, children, className, ...props }: AccordionItemProps) {
  return (
    <details className={cn('group', className)} {...props}>
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-left font-semibold text-navy-900 marker:hidden [&::-webkit-details-marker]:hidden">
        <span>{question}</span>
        <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="measure px-5 pb-5 text-ink [&>*+*]:mt-3">{children}</div>
    </details>
  );
}
