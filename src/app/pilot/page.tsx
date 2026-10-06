import { PilotForm } from '@/components/forms/PilotForm';
import { Section } from '@/components/site/Section';
import { pilotPage } from '@/content/pilot';
import { pages } from '@/content/seo';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata(pages.pilot);

/** F6: pilot sign-up with survey questions (PRD section 10). */
export default function PilotPage() {
  return (
    <Section width="reading" aria-labelledby="pilot-title" className="py-12 md:py-16">
      <h1 id="pilot-title">{pilotPage.title}</h1>
      <p className="mt-4 text-lg">{pilotPage.intro}</p>

      <h2 className="mt-8 text-xl">{pilotPage.nextHeading}</h2>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        {pilotPage.next.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="mt-10">
        <PilotForm />
      </div>
    </Section>
  );
}
