import * as React from 'react';
import { cn } from '@/lib/utils';

/** White, bordered, 8px radius, 24px padding, one subtle shadow level. */
export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('rounded-card border border-border bg-white p-6 shadow-card', className)} {...props} />;
}
