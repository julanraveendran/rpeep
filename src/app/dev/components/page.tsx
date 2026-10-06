import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HelpDisclosure } from '@/components/ui/help-disclosure';
import { LegalDetail } from '@/components/ui/legal-detail';
import { ResultBadge } from '@/components/checker/ResultBadge';
import { Stepper } from '@/components/checker/Stepper';
import { CTA } from '@/components/site/CTA';
import { Section } from '@/components/site/Section';
import { InteractiveExamples } from './InteractiveExamples';

export const metadata: Metadata = {
  title: 'Component showcase',
  robots: { index: false, follow: false },
};

const swatches = [
  ['navy-900', 'Header, headings, primary buttons'],
  ['navy-700', 'Hover states, links'],
  ['ink', 'Body text'],
  ['muted', 'Secondary text'],
  ['accent', 'Primary call-to-action button only'],
  ['surface', 'Alternating section backgrounds'],
  ['border', 'Card borders'],
  ['input-border', 'Input and radio card borders'],
  ['success', '"In scope" badge'],
  ['warning', '"Can\'t confirm yet" badge'],
  ['neutral', '"Not in scope" badge'],
  ['error', 'Form errors'],
] as const;

/** Developer-only page that shows every design-system component. It returns a 404 in production (PRD section 16, phase 2). */
export default function ComponentsPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <>
      <Section>
          <h1>Component showcase</h1>
          <p className="measure mt-3 text-muted">Developer page. Not available in production.</p>

          <h2 className="mt-12">Typography</h2>
          <div className="mt-4 space-y-3">
            <h1>Heading 1: Residential PEEPs, handled properly.</h1>
            <h2>Heading 2: What the regulations require</h2>
            <h3>Heading 3: Identify residents</h3>
            <p className="measure">
              Body text at 17px with a line height of 1.6, limited to 70 characters per line so it stays easy to read. Numbers use tabular
              figures: <span className="tabular">18.0 m · 7 storeys · 12 of 12</span>.
            </p>
            <p className="text-sm text-muted">Small text, 14px, in the muted colour.</p>
            <p>
              A <a href="#typography">text link</a> in the body.
            </p>
          </div>

          <h2 className="mt-12">Colour tokens</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {swatches.map(([name, use]) => (
              <li key={name} className="flex items-center gap-3">
                <span aria-hidden="true" className="size-12 shrink-0 rounded-card border border-border" style={{ background: `var(--${name})` }} />
                <span>
                  <code className="font-semibold">--{name}</code>
                  <span className="block text-sm text-muted">{use}</span>
                </span>
              </li>
            ))}
          </ul>

          <h2 className="mt-12">Buttons</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button disabled>Disabled</Button>
            <Button loading>Get my free report</Button>
            <CTA href="/checker" location="dev_showcase">
              Link as a button
            </CTA>
          </div>

          <h2 className="mt-12">Card</h2>
          <Card className="mt-4 max-w-md">
            <h3>Identify residents</h3>
            <p className="mt-2">Use reasonable endeavours to identify residents who may need help to evacuate.</p>
            <p className="tabular mt-3 inline-block rounded-full bg-surface px-3 py-1 text-sm font-semibold text-navy-900">Reg 5</p>
            <LegalDetail regulation="regulation 5" className="mt-3">
              Placeholder legal summary. The real text comes from <code>src/content/regulations.ts</code> in Phase 3.
            </LegalDetail>
          </Card>

          <h2 className="mt-12">Result badges</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ResultBadge status="in_scope" />
            <ResultBadge status="not_in_scope" />
            <ResultBadge status="cannot_confirm" />
          </div>

          <h2 className="mt-12">Stepper</h2>
          <div className="mt-4 grid max-w-md gap-6">
            <Stepper current={3} max={6} answered={2} />
            <Stepper current={6} max={6} answered={6} upTo={false} />
          </div>

          <h2 className="mt-12">Alerts</h2>
          <div className="mt-4 grid max-w-xl gap-3">
            <Alert variant="info" title="Guidance only">
              <p>This is guidance based on SI 2025/797, not legal advice.</p>
            </Alert>
            <Alert variant="warning" title="We can't confirm yet">
              <p>We need the height of the top storey.</p>
            </Alert>
            <Alert variant="error" title="Something went wrong">
              <p>Your report wasn&apos;t sent. Please try again.</p>
            </Alert>
          </div>

          <h2 className="mt-12">Help and legal disclosures</h2>
          <div className="mt-4 max-w-xl space-y-4">
            <HelpDisclosure>
              <p>The regulations apply in England only.</p>
            </HelpDisclosure>
            <LegalDetail regulation="regulation 3(1)">
              <p>Placeholder summary of the scope regulation.</p>
            </LegalDetail>
          </div>

          <h2 className="mt-12">Radio cards and number fields</h2>
          <InteractiveExamples />

          <h2 className="mt-12">Accordion</h2>
          <Accordion className="mt-4 max-w-xl">
            <AccordionItem question="Which buildings are covered?">
              <p>Placeholder answer. The real FAQ copy arrives in Phase 6.</p>
            </AccordionItem>
            <AccordionItem question="Does this apply in Wales, Scotland or Northern Ireland?">
              <p>The regulations apply in England only.</p>
            </AccordionItem>
          </Accordion>
      </Section>

      <Section tone="navy">
          <h2>On a navy section</h2>
          <p className="mt-3 text-on-navy-muted">Text on navy uses white or the lighter on-navy colour.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CTA href="/checker" location="dev_showcase_navy">
              Check if your building is in scope
            </CTA>
            <CTA href="/pilot" location="dev_showcase_navy" variant="secondary-inverse">
              Join the pilot
            </CTA>
          </div>
      </Section>
    </>
  );
}
