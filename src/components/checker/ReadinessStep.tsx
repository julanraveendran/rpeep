'use client';

import { useState, type ReactNode } from 'react';
import { RadioCardGroup } from '@/components/checker/RadioCardGroup';
import { ReadinessGaps } from '@/components/checker/ReadinessGaps';
import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/error-summary';
import { readinessAnswerOptions, readinessCopy, readinessQuestions } from '@/content/questions';
import { completeReadiness } from '@/lib/checker/state';
import { scoreReadiness, type ReadinessAnswers, type ReadinessId } from '@/lib/readiness/score';
import { messages } from '@/lib/schemas';

type ReadinessStepProps = {
  readiness: Partial<ReadinessAnswers>;
  /** True once the result has been shown. */
  done: boolean;
  onAnswer: (id: ReadinessId, value: ReadinessAnswers[ReadinessId]) => void;
  /** Called with the complete answers when the visitor continues. */
  onSubmit: (answers: ReadinessAnswers) => void;
  onEdit: () => void;
  onBack: () => void;
  /** The report form, shown under the result. */
  children?: ReactNode;
};

const fieldId = (id: ReadinessId) => `readiness-${id}`;

/** Part B (PRD section 8C): six questions, then the score, the gap list and the report form. */
export function ReadinessStep({ readiness, done, onAnswer, onSubmit, onEdit, onBack, children }: ReadinessStepProps) {
  const [failedSubmits, setFailedSubmits] = useState(0);
  const complete = completeReadiness(readiness);

  if (done && complete) {
    const result = scoreReadiness(complete);
    return (
      <div className="grid gap-10">
        <h1 data-step-heading tabIndex={-1} className="tabular text-2xl md:text-3xl">
          {result.summary}
        </h1>
        <ReadinessGaps gaps={result.gaps} />
        <div>
          <Button variant="ghost" onClick={onEdit}>
            {readinessCopy.changeAnswers}
          </Button>
        </div>
        {children}
      </div>
    );
  }

  const missing = readinessQuestions.filter((question) => !readiness[question.id]);
  const showErrors = failedSubmits > 0;

  return (
    <form
      noValidate
      className="grid gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (complete) return onSubmit(complete);
        setFailedSubmits((count) => count + 1);
      }}
    >
      <h1 data-step-heading tabIndex={-1} className="text-2xl md:text-3xl">
        {readinessCopy.title}
      </h1>

      {showErrors && missing.length > 0 ? (
        <ErrorSummary
          key={failedSubmits}
          title={readinessCopy.validationSummary}
          errors={missing.map((question) => ({ id: fieldId(question.id), message: `${question.id}: ${messages.choose}` }))}
        />
      ) : null}

      {readinessQuestions.map((question) => (
        <RadioCardGroup
          key={question.id}
          id={fieldId(question.id)}
          name={question.id}
          legend={
            <h2 className="text-lg">
              <span className="tabular mr-2 text-navy-700">{question.id}</span>
              {question.question}
            </h2>
          }
          layout="inline"
          options={readinessAnswerOptions}
          value={readiness[question.id]}
          onChange={(value) => onAnswer(question.id, value as ReadinessAnswers[ReadinessId])}
          error={showErrors && !readiness[question.id] ? messages.choose : undefined}
        />
      ))}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
