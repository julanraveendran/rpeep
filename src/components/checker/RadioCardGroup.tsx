'use client';

import { useId, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RadioOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
};

type RadioCardGroupProps = {
  name: string;
  /** The question. Rendered inside the `<legend>`, so a heading can be passed here. */
  legend: ReactNode;
  options: readonly RadioOption[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  /** Validation message, for example "Choose an option to continue." */
  error?: string;
  className?: string;
};

/**
 * Large clickable option cards built on native radio inputs in a `fieldset` with a
 * `legend`. The browser provides arrow-key navigation and screen reader support.
 */
export function RadioCardGroup({ name, legend, options, value, onChange, error, className }: RadioCardGroupProps) {
  const errorId = useId();
  return (
    <fieldset className={cn('min-w-0', className)} aria-describedby={error ? errorId : undefined}>
      <legend className="mb-4 w-full p-0">{legend}</legend>
      <div className="grid gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-14 cursor-pointer items-start gap-3 rounded-card border-2 border-input-border bg-white p-4 has-checked:border-navy-900 has-checked:bg-surface has-focus-visible:border-navy-700"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="mt-0.5 size-5 shrink-0 accent-navy-900"
            />
            <span>
              <span className="block font-semibold text-navy-900">{option.label}</span>
              {option.description ? <span className="mt-0.5 block text-sm text-muted">{option.description}</span> : null}
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="mt-3 flex items-start gap-2 font-semibold text-error">
          <CircleAlert className="mt-1 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </fieldset>
  );
}
