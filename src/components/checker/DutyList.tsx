import { Card } from '@/components/ui/card';
import { LegalDetail } from '@/components/ui/legal-detail';
import { duties, regulationLabel } from '@/content/regulations';
import { resultCopy } from '@/content/questions';

/** Duties D1–D9 as cards with a "Legal detail" panel each, for in-scope buildings (PRD sections 7D and 8B). */
export function DutyList() {
  return (
    <section aria-labelledby="duties-heading">
      <h2 id="duties-heading" className="text-xl">
        {resultCopy.dutiesHeading}
      </h2>
      <ol className="mt-4 grid gap-4">
        {duties.map((duty) => (
          <li key={duty.id}>
            <Card className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <h3>{duty.title}</h3>
                <span className="tabular shrink-0 rounded-full bg-surface px-3 py-1 text-sm font-semibold text-navy-900 ring-1 ring-border">
                  Reg {duty.regulation}
                </span>
              </div>
              <p>{duty.plainEnglish}</p>
              <LegalDetail regulation={regulationLabel(duty.regulation)}>
                <p>{duty.plainEnglish}</p>
              </LegalDetail>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
