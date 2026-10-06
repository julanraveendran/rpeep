import { describeAnswer, resultCopy, scopeQuestions } from '@/content/questions';
import { askedQuestions } from '@/lib/checker/state';
import type { Answers } from '@/lib/scope/engine';

/** "Your answers" with an edit link for each one (PRD section 8B). Links change the URL hash, which the checker follows. */
export function AnswersSummary({ answers, buildingRef }: { answers: Partial<Answers>; buildingRef?: string }) {
  const { answered } = askedQuestions(answers);
  return (
    <section aria-labelledby="answers-heading">
      <h2 id="answers-heading" className="text-xl">
        {resultCopy.answersHeading}
      </h2>
      <dl className="mt-4 divide-y divide-border rounded-card border border-border bg-white">
        {buildingRef ? (
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_1.2fr_auto] sm:items-center sm:gap-4">
            <dt className="text-sm font-semibold text-muted">{resultCopy.buildingLabel}</dt>
            <dd className="font-semibold text-navy-900">{buildingRef}</dd>
            <dd />
          </div>
        ) : null}
        {answered.map((id) => (
          <div key={id} className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_1.2fr_auto] sm:items-center sm:gap-4">
            <dt className="text-sm font-semibold text-muted">{scopeQuestions[id].summaryLabel}</dt>
            <dd className="tabular font-semibold text-navy-900">{describeAnswer(id, answers)}</dd>
            <dd>
              <a href={`#q-${id}`} className="inline-flex min-h-11 items-center font-semibold">
                {resultCopy.edit}
                <span className="sr-only"> {scopeQuestions[id].summaryLabel}</span>
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
