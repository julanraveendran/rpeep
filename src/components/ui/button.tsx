import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Minimum target size 44 x 44px (PRD section 5). */
export const buttonVariants = cva(
  'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-button px-5 py-2.5 text-base font-semibold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-60 aria-busy:cursor-progress',
  {
    variants: {
      variant: {
        /** The accent colour is for the primary call to action only. */
        primary: 'border-2 border-accent bg-accent text-white hover:border-[#9a3412] hover:bg-[#9a3412]',
        secondary: 'border-2 border-navy-900 bg-white text-navy-900 hover:bg-surface',
        /** Secondary button for use on navy backgrounds. */
        'secondary-inverse': 'border-2 border-white bg-transparent text-white hover:bg-white/10',
        ghost: 'border-2 border-transparent bg-transparent text-navy-900 hover:bg-surface',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
);

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (for example a link) with button styles. */
    asChild?: boolean;
    /** Shows a spinner, sets `aria-busy` and disables the button. Not used with `asChild`. */
    loading?: boolean;
  };

export function Button({ className, variant, asChild = false, loading = false, children, disabled, type, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant }), className);

  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      type={type ?? 'button'}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
