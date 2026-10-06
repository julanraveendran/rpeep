'use client';

import { useEffect, useId, useRef } from 'react';
import { CircleAlert } from 'lucide-react';

export type ErrorSummaryItem = { id: string; message: string };

/**
 * A list of everything that is wrong with a form, with a link to each field (WCAG: error summary focused
 * on a failed submit). Give it a new `key` on every failed submit so it takes focus again.
 */
export function ErrorSummary({ errors, title = 'There is a problem' }: { errors: readonly ErrorSummaryItem[]; title?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    ref.current?.focus();
  }, []);

  if (errors.length === 0) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby={titleId}
      className="rounded-card border-2 border-error bg-error-soft p-4 text-ink"
    >
      <p id={titleId} className="flex items-center gap-2 font-semibold text-error">
        <CircleAlert className="size-5 shrink-0" aria-hidden="true" />
        {title}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-9">
        {errors.map((error) => (
          <li key={error.id}>
            <a
              href={`#${error.id}`}
              onClick={(event) => {
                // Focus the field without changing the URL hash (the checker uses the hash for its steps).
                const field = document.getElementById(error.id);
                if (!field) return;
                event.preventDefault();
                field.focus();
                field.scrollIntoView({ block: 'center' });
              }}
              className="font-semibold text-error"
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
