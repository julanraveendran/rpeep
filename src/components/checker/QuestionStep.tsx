'use client';

import { useState } from 'react';
import { BuildingOutline } from '@/components/illustrations/BuildingOutline';
import { NumberField } from '@/components/checker/NumberField';
import { RadioCardGroup } from '@/components/checker/RadioCardGroup';
import { Stepper } from '@/components/checker/Stepper';
import { Button } from '@/components/ui/button';
import { HelpDisclosure } from '@/components/ui/help-disclosure';
import { MAX_SCOPE_QUESTIONS, scopeQuestions } from '@/content/questions';
import { messages, parseHeight, parseStoreys } from '@/lib/schemas';
import type { Answers, QuestionId } from '@/lib/scope/engine';

type QuestionStepProps = {
  id: QuestionId;
  answers: Partial<Answers>;
  /** Position of this question among the questions asked so far, starting at 1. */
  current: number;
  /** Questions answered so far, for the progress bar. */
  answeredCount: number;
  onContinue: (value: Answers[QuestionId]) => void;
  onBack: () => void;
};

/** One scope question per screen (PRD section 8A, screens 2 to 7). Remount with a new `key` for each question. */
export function QuestionStep({ id, answers, current, answeredCount, onContinue, onBack }: QuestionStepProps) {
  const question = scopeQuestions[id];
  const saved = answers[id];

  const [choice, setChoice] = useState<string | null>(typeof saved === 'string' ? saved : null);
  const [text, setText] = useState(typeof saved === 'number' ? String(saved) : '');
  const [unknown, setUnknown] = useState(saved === null);
  const [error, setError] = useState<string | undefined>();

  function submit() {
    if (question.kind === 'radio') {
      if (!choice) return setError(messages.choose);
      return onContinue(choice as Answers[QuestionId]);
    }
    if (unknown) return onContinue(null as Answers[QuestionId]);
    const parsed = id === 'storeys' ? parseStoreys(text) : parseHeight(text);
    if (parsed === undefined) return setError(id === 'storeys' ? messages.storeys : messages.height);
    return onContinue(parsed as Answers[QuestionId]);
  }

  const help = Array.isArray(question.help) ? (
    <ul className="list-disc space-y-1 pl-5">
      {question.help.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  ) : (
    <p>{question.help}</p>
  );

  const heading = (
    <h1 data-step-heading tabIndex={-1} className="text-2xl md:text-3xl">
      {question.question}
    </h1>
  );

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Stepper current={current} max={MAX_SCOPE_QUESTIONS} answered={answeredCount} className="mb-8" />

      <div className={question.kind === 'number' ? 'grid items-start gap-8 md:grid-cols-[1.4fr_1fr]' : undefined}>
        <div>
          {question.kind === 'radio' ? (
            <RadioCardGroup
              name={id}
              legend={heading}
              options={question.options}
              value={choice}
              onChange={(value) => {
                setChoice(value);
                setError(undefined);
              }}
              error={error}
            />
          ) : (
            <>
              {heading}
              <NumberField
                id={`field-${id}`}
                label={question.question}
                hideLabel
                unit={question.unit}
                inputMode={question.inputMode}
                value={text}
                onChange={(value) => {
                  setText(value);
                  setError(undefined);
                }}
                unknown={unknown}
                onUnknownChange={(value) => {
                  setUnknown(value);
                  setError(undefined);
                }}
                error={error}
                className="mt-6"
              />
            </>
          )}
          <HelpDisclosure className="mt-6">{help}</HelpDisclosure>
        </div>
        {id === 'storeys' || id === 'heightMetres' ? (
          <div className="text-navy-700">
            <BuildingOutline variant={id === 'storeys' ? 'storeys' : 'height'} />
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
