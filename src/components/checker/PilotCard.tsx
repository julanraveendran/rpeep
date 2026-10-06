import { CTA } from '@/components/site/CTA';
import { Card } from '@/components/ui/card';
import { resultCopy } from '@/content/questions';

/** "Want help managing RPEEPs? Join the pilot" (PRD sections 8B and 9A). */
export function PilotCard({ location }: { location: string }) {
  return (
    <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-lg font-semibold text-navy-900">{resultCopy.pilot.text}</p>
      <CTA href="/pilot" location={location} variant="secondary">
        {resultCopy.pilot.cta}
      </CTA>
    </Card>
  );
}
