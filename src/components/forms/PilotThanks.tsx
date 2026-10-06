'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Section } from '@/components/site/Section';
import { pilotThanks } from '@/content/pilot';
import { useCheckerState } from '@/lib/checker/store';

/** "Thanks, {first name}" after a pilot application (PRD section 10). */
export function PilotThanks() {
  const [state] = useCheckerState();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <Section width="reading" className="py-12 md:py-16">
      <h1 ref={heading} tabIndex={-1}>
        {pilotThanks.title(state.pilotFirstName)}
      </h1>
      <p className="mt-4 text-lg">{pilotThanks.text}</p>
      <p className="mt-6">
        <Link href="/checker">{pilotThanks.backLink}</Link>
      </p>
    </Section>
  );
}
