import Link from 'next/link';
import { site } from '@/content/site';
import { cn } from '@/lib/utils';

/** The wordmark: brand name in Inter Bold, navy (white on navy backgrounds). */
export function Wordmark({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'inline-flex min-h-11 items-center text-xl font-bold tracking-tight no-underline hover:no-underline',
        inverse ? 'text-white' : 'text-navy-900',
        className,
      )}
    >
      {site.name}
    </Link>
  );
}
