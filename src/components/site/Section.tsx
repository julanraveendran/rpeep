import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'white' | 'surface' | 'navy';

const tones: Record<Tone, string> = {
  white: 'bg-white text-ink',
  surface: 'bg-surface text-ink',
  // `on-navy` switches focus rings to white (see globals.css).
  navy: 'on-navy bg-navy-900 text-on-navy [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_a:not([class])]:text-white',
};

type SectionProps = React.ComponentProps<'section'> & {
  tone?: Tone;
  /** `reading` limits the width to 720px for the guide and legal pages. */
  width?: 'wide' | 'reading';
};

/** A page section with the PRD spacing (64px mobile, 96px desktop), background tone and content width. */
export function Section({ tone = 'white', width = 'wide', className, children, ...props }: SectionProps) {
  return (
    <section className={cn('section-y', tones[tone], className)} {...props}>
      <div className={width === 'reading' ? 'container-reading' : 'container-page'}>{children}</div>
    </section>
  );
}
