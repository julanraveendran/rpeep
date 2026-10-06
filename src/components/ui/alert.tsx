import * as React from 'react';
import { CircleAlert, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'info' | 'warning' | 'error';

const variants: Record<AlertVariant, { icon: LucideIcon; label: string; box: string; iconColour: string; role: 'status' | 'alert' }> = {
  info: { icon: Info, label: 'Information', box: 'border-navy-700 bg-info-soft', iconColour: 'text-navy-700', role: 'status' },
  warning: { icon: TriangleAlert, label: 'Warning', box: 'border-warning bg-warning-soft', iconColour: 'text-warning', role: 'status' },
  error: { icon: CircleAlert, label: 'Error', box: 'border-error bg-error-soft', iconColour: 'text-error', role: 'alert' },
};

type AlertProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  variant?: AlertVariant;
  title?: React.ReactNode;
};

/** Info and warning use `role="status"`; errors use `role="alert"`. The icon and a hidden label mean colour is never the only signal. */
export function Alert({ variant = 'info', title, className, children, ...props }: AlertProps) {
  const { icon: Icon, label, box, iconColour, role } = variants[variant];
  return (
    <div role={role} className={cn('flex gap-3 rounded-card border-l-4 p-4 text-ink', box, className)} {...props}>
      <Icon className={cn('mt-0.5 size-5 shrink-0', iconColour)} aria-hidden="true" />
      <div className="min-w-0">
        <span className="sr-only">{label}: </span>
        {title ? <p className="font-semibold text-navy-900">{title}</p> : null}
        <div className="[&>*+*]:mt-2">{children}</div>
      </div>
    </div>
  );
}
