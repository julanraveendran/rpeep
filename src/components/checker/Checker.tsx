'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { IntroStep } from '@/components/checker/IntroStep';
import { QuestionStep } from '@/components/checker/QuestionStep';
import { ReadinessStep } from '@/components/checker/ReadinessStep';
import { ReportSection } from '@/components/checker/ReportSection';
import { ResultStep } from '@/components/checker/ResultStep';
import { Button } from '@/components/ui/button';
import { resultHeadlines } from '@/content/regulations';
import { MAX_SCOPE_QUESTIONS, readinessCopy, reportCopy, scopeQuestions } from '@/content/questions';
import { track } from '@/lib/analytics';
import {
  askedQuestions,
  cleared,
  hashToStep,
  nextAfterAnswer,
  previousStep,
  resolveStep,
  resultFor,
  sameStep,
  stepToHash,
  withAnswer,
  withBuildingRef,
  withReadinessAnswer,
  withReadinessDone,
  type Step,
} from '@/lib/checker/state';
import { navigateToStep, useCheckerState, useHash } from '@/lib/checker/store';
import { scoreReadiness } from '@/lib/readiness/score';
import type { QuestionId, ScopeStatus } from '@/lib/scope/engine';
import { checkerIntro } from '@/content/questions';

/** False on the server and during hydration, true afterwards. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** Text for the `aria-live` region when the step changes (PRD section 8A). */
function describeStep(
  step: Step,
  context: { questions: readonly QuestionId[]; status: ScopeStatus | undefined; readinessDone: boolean },
): string {
  switch (step.kind) {
    case 'intro':
      return checkerIntro.title;
    case 'question': {
      const position = Math.max(1, context.questions.indexOf(step.id) + 1);
      return `Question ${position} of up to ${MAX_SCOPE_QUESTIONS}: ${scopeQuestions[step.id].question}`;
    }
    case 'result':
      return context.status ? resultHeadlines[context.status] : '';
    case 'readiness':
      return context.readinessDone ? 'Your readiness result' : readinessCopy.title;
    case 'report':
      return reportCopy.title;
  }
}

/**
 * The free RPEEP Scope Checker (PRD section 8). It shows one step at a time, keeps the current step in the
 * URL hash (so the browser Back button works) and the answers in `sessionStorage`. It runs the same engine
 * as the server, but the server never trusts what the browser worked out.
 */
export function Checker() {
  const [state, update] = useCheckerState();
  const hash = useHash();
  const hydrated = useHydrated();

  const requested = hashToStep(hash);
  const step = resolveStep(requested, state);
  const stepKey = stepToHash(step);

  const result = useMemo(() => resultFor(state.answers), [state.answers]);
  const { answered, next } = askedQuestions(state.answers);

  // A hash that cannot be reached yet (typed in, or left over after an answer changed) is corrected.
  useEffect(() => {
    if (hydrated && !sameStep(requested, step)) navigateToStep(step, { replace: true });
  }, [hydrated, requested, step]);

  // Move focus to the new heading and announce the step, but not on first load.
  const containerRef = useRef<HTMLDivElement>(null);
  const previousKey = useRef<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    if (!hydrated) return;
    if (previousKey.current === null) {
      previousKey.current = stepKey;
      return;
    }
    if (previousKey.current === stepKey) return;
    previousKey.current = stepKey;
    containerRef.current?.querySelector<HTMLElement>('[data-step-heading]')?.focus();
    setAnnouncement(describeStep(step, { questions: next ? [...answered, next] : answered, status: result?.status, readinessDone: state.readinessDone }));
    // Announce only when the step changes, not when the answers on it change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, stepKey]);

  // Analytics: the result screen was shown.
  const status = result?.status;
  useEffect(() => {
    if (hydrated && step.kind === 'result' && status) track('checker_completed', { status });
  }, [hydrated, step.kind, status]);

  function startAgain() {
    update(() => cleared());
    navigateToStep({ kind: 'intro' });
  }

  function back() {
    navigateToStep(previousStep(step, state));
  }

  let content: React.ReactNode;
  switch (step.kind) {
    case 'intro':
      content = (
        <IntroStep
          buildingRef={state.buildingRef}
          onBuildingRefChange={(value) => update((current) => withBuildingRef(current, value))}
          onStart={() => {
            track('checker_started');
            navigateToStep({ kind: 'question', id: 'inEngland' });
          }}
        />
      );
      break;

    case 'question': {
      const order = next ? [...answered, next] : answered;
      content = (
        <QuestionStep
          key={step.id}
          id={step.id}
          answers={state.answers}
          current={Math.max(1, order.indexOf(step.id) + 1)}
          answeredCount={answered.length}
          onBack={back}
          onContinue={(value) => {
            track('question_answered', { step: step.id });
            const updated = withAnswer(state, step.id, value as never);
            update(() => updated);
            navigateToStep(nextAfterAnswer(updated));
          }}
        />
      );
      break;
    }

    case 'result':
      content = result ? (
        <ResultStep result={result} answers={state.answers} buildingRef={state.buildingRef} onStartAgain={startAgain} />
      ) : null;
      break;

    case 'readiness':
      content = (
        <ReadinessStep
          readiness={state.readiness}
          done={state.readinessDone}
          onAnswer={(id, value) => update((current) => withReadinessAnswer(current, id, value))}
          onSubmit={(answers) => {
            track('readiness_completed', { score: scoreReadiness(answers).score });
            update((current) => withReadinessDone(current));
          }}
          onEdit={() => update((current) => ({ ...current, readinessDone: false }))}
          onBack={back}
        >
          <ReportSection />
        </ReadinessStep>
      );
      break;

    case 'report':
      content = (
        <div className="grid gap-8">
          <h1 data-step-heading tabIndex={-1} className="text-2xl md:text-3xl">
            {reportCopy.title}
          </h1>
          <ReportSection />
          <div>
            <Button variant="secondary" onClick={back}>
              Back
            </Button>
          </div>
        </div>
      );
      break;
  }

  return (
    <div className="container-reading py-10 md:py-16">
      <div ref={containerRef}>{content}</div>
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
