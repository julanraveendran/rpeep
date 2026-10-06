import { DataSection, FaqSection, FreeToolSection, Hero, HowSection, LawSection, PilotSection, WhyBuildingSection, WhyHardSection } from '@/components/home/HomeSections';
import { JsonLd } from '@/components/site/JsonLd';
import { faqJsonLd } from '@/lib/structured-data';

/** Home page: 11 sections in the order of PRD section 6. Header (1) and footer (11) come from the layout. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <LawSection />
      <WhyHardSection />
      <HowSection />
      <FreeToolSection />
      <PilotSection />
      <WhyBuildingSection />
      <DataSection />
      <FaqSection />
      <JsonLd data={faqJsonLd()} />
    </>
  );
}
