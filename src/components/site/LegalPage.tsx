import { ContentSections } from '@/components/site/ContentSections';
import { Section } from '@/components/site/Section';
import type { LegalDocument } from '@/content/legal';
import { legalVersion } from '@/content/site';
import { formatUkDate } from '@/lib/report/format';

/** A legal or policy page at reading width, with its version and last-updated date. */
export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <Section width="reading" aria-labelledby="page-title" className="py-12 md:py-16">
      <h1 id="page-title">{document.title}</h1>
      <p className="mt-2 text-sm text-muted">
        Version {legalVersion.version} · Last updated {formatUkDate(new Date(legalVersion.lastUpdated))}
      </p>
      <p className="mt-6 text-lg">{document.intro}</p>
      <ContentSections sections={document.sections} />
    </Section>
  );
}
