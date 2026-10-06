import * as React from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { links } from '@/content/site';
import { cn } from '@/lib/utils';

type LegalDetailProps = Omit<React.ComponentProps<'details'>, 'children'> & {
  /** Regulation number as cited, for example "regulation 3(1)(a)". */
  regulation: string;
  /** Summary of what the regulation says. Must match PRD section 7. */
  children: React.ReactNode;
  /** Defaults to the official text of SI 2025/797 on legislation.gov.uk. */
  href?: string;
};

/** Collapsible "Legal detail" panel: summary of the regulation plus a link to legislation.gov.uk (PRD sections 3 and 5). */
export function LegalDetail({ regulation, children, href = links.regulations, className, ...props }: LegalDetailProps) {
  return (
    <details className={cn('group', className)} {...props}>
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-navy-700 underline underline-offset-4 marker:hidden [&::-webkit-details-marker]:hidden">
        <span>Legal detail</span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-2 rounded-card bg-surface p-4 text-sm text-ink [&>*+*]:mt-2">
        <div>{children}</div>
        <p>
          <span className="tabular font-semibold">{capitalise(regulation)}</span>
          {' · '}
          <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center gap-1">
            Read it on legislation.gov.uk
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      </div>
    </details>
  );
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
