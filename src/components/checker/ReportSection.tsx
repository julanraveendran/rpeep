import { reportCopy } from '@/content/questions';

/** The report form (PRD section 9A). The form itself is built in the forms phase. */
export function ReportSection() {
  return (
    <section aria-labelledby="report-heading">
      <h2 id="report-heading" className="text-xl">
        {reportCopy.title}
      </h2>
    </section>
  );
}
