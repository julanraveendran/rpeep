import * as React from 'react';
import { cn } from '@/lib/utils';

/** Shared look for text inputs, selects and textareas. The border is --input-border (3:1 on white) so the edge of the control is visible. */
export const controlClasses =
  'min-h-11 w-full rounded-card border-2 border-input-border bg-white px-3 py-2 text-base text-ink placeholder:text-muted disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted aria-invalid:border-error';

export function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>) {
  return <input type={type} className={cn(controlClasses, className)} {...props} />;
}
