'use client';

import { AnswersSummary } from '@/components/checker/AnswersSummary';
import { Disclaimer } from '@/components/checker/Disclaimer';
import { DutyList } from '@/components/checker/DutyList';
import { PilotCard } from '@/components/checker/PilotCard';
import { ResultBadge } from '@/components/checker/ResultBadge';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { missingCopy, noteCopy, reasonCopy, resultHeadlines } from '@/content/regulations';
import { resultCopy } from '@/content/questions';
import { editStep, stepToHash } from '@/lib/checker/state';
import type { Answers, ScopeResult } from '@/lib/scope/engine';

type ResultStepProps = {
  result: ScopeResult;
  answers: Partial<Answers>;
  buildingRef: string;
  onStartAgain: () => void;
};

const { actions } = resultCopy;

/**
 * The result screen (PRD section 8B). Buttons that only move to another step are links to a hash, so the
 * browser Back button and "open in new tab" behave as expected.
 */
export function ResultStep({ result, answers, buildingRef, onStartAgain }: ResultStepProps) {
  const editHash = stepToHash(editStep(answers));
  const link = (href: string, label: string, variant: 'primary' | 'secondary' | 'ghost') => (
    <Button asChild variant={variant}>
      <a href={href}>{label}</a>
    </Button>
  );

  return (
    <div className="grid gap-10">
      <header className="grid gap-4">
        <div>
          <ResultBadge status={result.status} />
        </div>
        <h1 data-step-heading tabIndex={-1} className="text-2xl md:text-3xl">
          {resultHeadlines[result.status]}
        </h1>
        {buildingRef ? (
          <p className="text-lg">
            <span className="font-semibold text-navy-900">{resultCopy.buildingLabel}:</span> {buildingRef}
          </p>
        ) : null}
      </header>

      {/* Why, or what is still needed */}
      {result.status === 'cannot_confirm' ? (
        <section aria-labelledby="missing-heading">
          <h2 id="missing-heading" className="text-xl">
            {resultCopy.missingHeading}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            {result.missing.map((code) => (
              <li key={code}>{missingCopy[code]}</li>
            ))}
          </ul>
        </section>
      ) : (
        <section aria-labelledby="reasons-heading">
          <h2 id="reasons-heading" className="text-xl">
            {resultCopy.reasonsHeading}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            {result.reasons.map((code) => (
              <li key={code}>{reasonCopy[code]}</li>
            ))}
          </ul>
        </section>
      )}

      {result.notes.length > 0 ? (
        <div className="grid gap-3">
          {result.notes.map((code) => (
            <Alert key={code} variant="info">
              <p>{noteCopy[code]}</p>
            </Alert>
          ))}
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {result.status === 'in_scope' ? (
          <>
            {link('#readiness', actions.checkReadiness, 'primary')}
            {link('#report', actions.skipToReport, 'secondary')}
            {link(editHash, actions.editAnswers, 'ghost')}
            <Button variant="ghost" onClick={onStartAgain}>
              {actions.startAgain}
            </Button>
          </>
        ) : null}
        {result.status === 'cannot_confirm' ? (
          <>
            {link(editHash, actions.editAnswers, 'primary')}
            {link('#report', actions.emailResult, 'secondary')}
            <Button variant="ghost" onClick={onStartAgain}>
              {actions.startAgain}
            </Button>
          </>
        ) : null}
        {result.status === 'not_in_scope' ? (
          <>
            <Button onClick={onStartAgain}>{actions.checkAnother}</Button>
            {link('#report', actions.emailResult, 'secondary')}
            {link(editHash, actions.editAnswers, 'ghost')}
          </>
        ) : null}
      </div>

      {result.status === 'in_scope' ? <DutyList /> : null}

      <AnswersSummary answers={answers} buildingRef={buildingRef} />
      <PilotCard location="checker_result" />
      <Disclaimer />
    </div>
  );
}
