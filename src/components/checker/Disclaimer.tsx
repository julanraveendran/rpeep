import { disclaimer } from '@/content/questions';
import { cn } from '@/lib/utils';

/** "Guidance only, not legal advice": on the intro, on every result and in the PDF and email (PRD section 13). */
export function Disclaimer({ className }: { className?: string }) {
  return <p className={cn('text-sm text-muted', className)}>{disclaimer}</p>;
}
