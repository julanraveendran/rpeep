'use client';

import { useId, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type NumberFieldProps = {
  id: string;
  label: ReactNode;
  /** Suffix shown after the input: "m" or "storeys". */
  unit: string;
  /** Raw text as typed. Parsing and validation live in the Zod schemas, not here. */
  value: string;
  onChange: (value: string) => void;
  unknown: boolean;
  onUnknownChange: (unknown: boolean) => void;
  /** `numeric` for whole numbers, `decimal` for heights. */
  inputMode?: 'numeric' | 'decimal';
  unknownLabel?: string;
  error?: string;
  /** Hide the label visually when the question is already shown as a heading. It stays for screen readers. */
  hideLabel?: boolean;
  className?: string;
};

/** Numeric input with a unit suffix and an "I don't know" checkbox that disables the input (PRD section 5). */
export function NumberField({
  id,
  label,
  unit,
  value,
  onChange,
  unknown,
  onUnknownChange,
  inputMode = 'decimal',
  unknownLabel = "I don't know",
  error,
  hideLabel = false,
  className,
}: NumberFieldProps) {
  const unitId = useId();
  const errorId = useId();
  return (
    <div className={cn('w-full', className)}>
      <label htmlFor={id} className={cn('mb-2 block font-semibold text-navy-900', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="flex items-center gap-3">
        <Input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={false}
          value={unknown ? '' : value}
          onChange={(event) => onChange(event.target.value)}
          disabled={unknown}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${unitId} ${errorId}` : unitId}
          className="tabular max-w-40"
        />
        <span id={unitId} className="font-semibold text-ink">
          {unit}
        </span>
      </div>
      <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={unknown}
          onChange={(event) => onUnknownChange(event.target.checked)}
          className="size-5 shrink-0 accent-navy-900"
        />
        <span>{unknownLabel}</span>
      </label>
      {error ? (
        <p id={errorId} className="mt-2 flex items-start gap-2 font-semibold text-error">
          <CircleAlert className="mt-1 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
