import Link from 'next/link';
import { CalendarClock, Check, Search, UserCheck, type LucideIcon } from 'lucide-react';
import { BuildingOutline } from '@/components/illustrations/BuildingOutline';
import { ConceptDashboard } from '@/components/home/ConceptDashboard';
import { JourneySteps } from '@/components/home/JourneySteps';
import { CTA } from '@/components/site/CTA';
import { Section } from '@/components/site/Section';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { LegalDetail } from '@/components/ui/legal-detail';
import { data, freeTool, hero, how, law, lawCards, lawWideCard, pilot, whyBuilding, whyHard, type LawCard } from '@/content/home';
import { faqs } from '@/content/faq';
import { dutyById, regulationLabel } from '@/content/regulations';
import { links } from '@/content/site';

/** 2. Hero (navy). The illustration is hidden on mobile. */
export function Hero() {
  return (
    <Section tone="navy" aria-labelledby="hero-title" className="py-16 md:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="mb-4 font-semibold text-on-navy-muted">{hero.eyebrow}</p>
          <h1 id="hero-title">{hero.title}</h1>
          <p className="measure mt-5 text-lg text-on-navy">{hero.subheading}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CTA href="/checker" location="hero">
              {hero.primaryCta}
            </CTA>
            <CTA href="/pilot" location="hero_pilot" variant="secondary-inverse">
              {hero.secondaryCta}
            </CTA>
          </div>
          <p className="mt-6 text-sm text-on-navy-muted">{hero.trustLine}</p>
        </div>
        <div className="hidden text-white/80 lg:block">
          <BuildingOutline variant="hero" />
        </div>
      </div>
    </Section>
  );
}

function DutyCard({ card, wide = false }: { card: LawCard; wide?: boolean }) {
  const duty = dutyById(card.dutyId);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3>{card.title}</h3>
        <span className="tabular shrink-0 rounded-full bg-surface px-3 py-1 text-sm font-semibold text-navy-900 ring-1 ring-border">
          {card.badge}
        </span>
      </div>
      <p className={wide ? 'measure text-ink' : 'text-ink'}>{duty.plainEnglish}</p>
      <LegalDetail regulation={regulationLabel(duty.regulation)} className="mt-auto">
        <p>{duty.plainEnglish}</p>
      </LegalDetail>
    </Card>
  );
}

/** 3. What the law now requires (surface). */
export function LawSection() {
  return (
    <Section id="law" tone="surface" aria-labelledby="law-title">
      <h2 id="law-title" className="measure">
        {law.title}
      </h2>
      <p className="measure mt-4 text-lg">
        {law.intro}{' '}
        <a href={links.regulations} target="_blank" rel="noopener noreferrer">
          {law.linkLabel}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lawCards.map((card) => (
          <DutyCard key={card.dutyId} card={card} />
        ))}
      </div>
      <div className="mt-6">
        <DutyCard card={lawWideCard} wide />
      </div>
    </Section>
  );
}

const whyIcons: Record<(typeof whyHard.items)[number]['icon'], LucideIcon> = {
  search: Search,
  consent: UserCheck,
  calendar: CalendarClock,
};

/** 4. Why it's hard today (white). */
export function WhyHardSection() {
  return (
    <Section aria-labelledby="why-hard-title">
      <h2 id="why-hard-title">{whyHard.title}</h2>
      <ul className="mt-10 grid gap-8 md:grid-cols-3">
        {whyHard.items.map((item) => {
          const Icon = whyIcons[item.icon];
          return (
            <li key={item.title} className="flex flex-col gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-surface text-navy-900 ring-1 ring-border">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <p>
                <strong className="block text-lg text-navy-900">{item.title}</strong>
                {item.text}
              </p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/** 5. How the product will help (surface). */
export function HowSection() {
  return (
    <Section id="how" tone="surface" aria-labelledby="how-title">
      <h2 id="how-title">{how.title}</h2>
      <p className="mt-3 inline-block rounded-full border border-navy-700 px-3 py-1 text-sm font-semibold text-navy-700">{how.label}</p>
      <div className="mt-10">
        <JourneySteps />
      </div>
      <ConceptDashboard className="mx-auto mt-14 max-w-xl" />
    </Section>
  );
}

/** 6. Free tool (white, bordered card, centred). */
export function FreeToolSection() {
  return (
    <Section aria-labelledby="free-tool-title">
      <Card className="mx-auto max-w-2xl p-8 text-center md:p-10">
        <h2 id="free-tool-title">{freeTool.title}</h2>
        <p className="mx-auto mt-4 max-w-prose text-lg">{freeTool.text}</p>
        <div className="mt-6">
          <CTA href="/checker" location="free_tool">
            {freeTool.cta}
          </CTA>
        </div>
        <p className="mt-4 text-sm text-muted">{freeTool.smallPrint}</p>
      </Card>
    </Section>
  );
}

/** 7. Pilot (navy). Does not state a price. */
export function PilotSection() {
  return (
    <Section tone="navy" aria-labelledby="pilot-title">
      <h2 id="pilot-title">{pilot.title}</h2>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {pilot.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-3 text-lg text-on-navy">
            <Check className="mt-1 size-5 shrink-0" aria-hidden="true" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <CTA href="/pilot" location="pilot_section">
          {pilot.cta}
        </CTA>
      </div>
    </Section>
  );
}

/** 8. Why we're building this (white). */
export function WhyBuildingSection() {
  return (
    <Section aria-labelledby="why-building-title" width="reading">
      <h2 id="why-building-title">{whyBuilding.title}</h2>
      <p className="mt-4 text-lg">{whyBuilding.text}</p>
      <p className="mt-6 font-semibold text-navy-900">{whyBuilding.signature}</p>
    </Section>
  );
}

/** 9. Your data (surface). */
export function DataSection() {
  return (
    <Section tone="surface" aria-labelledby="data-title">
      <h2 id="data-title">{data.title}</h2>
      <ul className="mt-6 grid gap-3">
        {data.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-3">
            <Check className="mt-1.5 size-5 shrink-0 text-success" aria-hidden="true" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6">
        <Link href="/privacy">{data.linkLabel}</Link>
      </p>
    </Section>
  );
}

/** 10. FAQ (white, accordion). */
export function FaqSection() {
  return (
    <Section id="faq" aria-labelledby="faq-title" width="reading">
      <h2 id="faq-title">Frequently asked questions</h2>
      <Accordion className="mt-8">
        {faqs.map((faq) => (
          <AccordionItem key={faq.question} question={faq.question}>
            <p>{faq.answer}</p>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}
