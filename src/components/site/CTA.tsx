'use client';

import Link from 'next/link';
import { Button, type ButtonProps } from '@/components/ui/button';
import { track } from '@/lib/analytics';

type CTAProps = {
  href: string;
  /** Where on the page the button is, sent as `cta_clicked { location }`. */
  location: string;
  variant?: ButtonProps['variant'];
  className?: string;
  children: React.ReactNode;
};

/** A call-to-action link styled as a button. Every CTA fires `cta_clicked` with its location (PRD section 6). */
export function CTA({ href, location, variant = 'primary', className, children }: CTAProps) {
  return (
    <Button asChild variant={variant} className={className}>
      <Link href={href} onClick={() => track('cta_clicked', { location })}>
        {children}
      </Link>
    </Button>
  );
}
