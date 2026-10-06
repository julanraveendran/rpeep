'use client';

import { useId, type ComponentProps, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { controlClasses } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Label, optional hint, the control and its error, wired together with `aria-describedby` and `aria-invalid`. */

type FieldShellProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: (aria: { id: string; 'aria-describedby': string | undefined; 'aria-invalid': true | undefined }) => ReactNode;
  className?: string;
};

export function FieldShell({ id, label, hint, error, required, children, className }: FieldShellProps) {
  const hintId = useId();
  const errorId = useId();
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('grid gap-1.5', className)}>
      <label htmlFor={id} className="font-semibold text-navy-900">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-start gap-2 font-semibold text-error">
      <CircleAlert className="mt-1 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
};

export function TextField({ id, label, hint, error, required, wrapperClassName, className, ...props }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      {(aria) => <input {...aria} required={required} className={cn(controlClasses, className)} {...props} />}
    </FieldShell>
  );
}

type SelectFieldProps = Omit<ComponentProps<'select'>, 'id'> & {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  wrapperClassName?: string;
};

export function SelectField({ id, label, hint, error, options, placeholder = 'Choose…', required, wrapperClassName, className, ...props }: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      {(aria) => (
        <select {...aria} required={required} defaultValue="" className={cn(controlClasses, 'pr-8', className)} {...props}>
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

type TextareaFieldProps = Omit<ComponentProps<'textarea'>, 'id'> & {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Characters typed so far, shown as a live counter next to the limit. */
  count?: number;
  max?: number;
  wrapperClassName?: string;
};

export function TextareaField({ id, label, hint, error, count, max, required, wrapperClassName, className, ...props }: TextareaFieldProps) {
  const counterId = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={wrapperClassName}>
      {(aria) => (
        <>
          <textarea
            {...aria}
            aria-describedby={[aria['aria-describedby'], count !== undefined ? counterId : null].filter(Boolean).join(' ') || undefined}
            required={required}
            rows={5}
            className={cn(controlClasses, 'min-h-32', className)}
            {...props}
          />
          {count !== undefined && max !== undefined ? (
            <p id={counterId} className={cn('tabular text-sm', count > max ? 'font-semibold text-error' : 'text-muted')}>
              {count} of {max} characters
            </p>
          ) : null}
        </>
      )}
    </FieldShell>
  );
}

type CheckboxFieldProps = Omit<ComponentProps<'input'>, 'id' | 'type'> & {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
};

/** A single checkbox with a label that is at least 44px tall to tap. */
export function CheckboxField({ id, label, hint, error, className, ...props }: CheckboxFieldProps) {
  const hintId = useId();
  const errorId = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          aria-describedby={[hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? true : undefined}
          className={cn('mt-1 size-5 shrink-0 accent-navy-900', className)}
          {...props}
        />
        <span>{label}</span>
      </label>
      {hint ? (
        <p id={hintId} className="pl-8 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

type ChoiceGroupProps = {
  id: string;
  legend: ReactNode;
  hint?: ReactNode;
  error?: string;
  type: 'radio' | 'checkbox';
  options: readonly { value: string; label: string }[];
  /** Spread the result of `register(name)` into each input. */
  register: (value: string) => ComponentProps<'input'>;
  /** Option values that cannot be chosen, for example the rest once three features are ticked. */
  disabledValues?: readonly string[];
  /** Extra content shown under a choice, for example the "Which one?" box under "Our existing compliance software". */
  after?: Partial<Record<string, ReactNode>>;
  className?: string;
};

/** A fieldset of radio buttons or checkboxes with a legend (WCAG: radio groups use `fieldset` and `legend`). */
export function ChoiceGroup({ id, legend, hint, error, type, options, register, disabledValues = [], after, className }: ChoiceGroupProps) {
  const hintId = useId();
  const errorId = useId();
  return (
    <fieldset
      id={id}
      tabIndex={-1}
      className={cn('grid min-w-0 gap-1.5', className)}
      aria-describedby={[hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined}
    >
      <legend className="mb-1 p-0 font-semibold text-navy-900">{legend}</legend>
      {hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      <div className="grid gap-1">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const disabled = disabledValues.includes(option.value);
          return (
            <div key={option.value}>
              <label htmlFor={optionId} className={cn('flex min-h-11 items-start gap-3', disabled ? 'cursor-not-allowed text-muted' : 'cursor-pointer')}>
                <input id={optionId} type={type} disabled={disabled} className="mt-1 size-5 shrink-0 accent-navy-900" {...register(option.value)} value={option.value} />
                <span>{option.label}</span>
              </label>
              {after?.[option.value]}
            </div>
          );
        })}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}
