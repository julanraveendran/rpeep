import Link from 'next/link';
import { buttonVariants, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CTAProps = {
  href: string;
  /** Where on the page the button is, sent as `cta_clicked { location }`. */
  location: string;
  variant?: ButtonProps['variant'];
  className?: string;
  children: React.ReactNode;
};

/**
 * A call-to-action link styled as a button. Every CTA fires `cta_clicked` with its location (PRD section 6). This is a
 * server component so it adds nothing to the page's JavaScript; `CtaTracker` (once, in the layout) sends the event.
 */
export function CTA({ href, location, variant = 'primary', className, children }: CTAProps) {
  return (
    <Link href={href} data-cta={location} className={cn(buttonVariants({ variant }), className)}>
      {children}
    </Link>
  );
}
