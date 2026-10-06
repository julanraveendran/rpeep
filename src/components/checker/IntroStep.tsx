'use client';

import { Disclaimer } from '@/components/checker/Disclaimer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { checkerIntro } from '@/content/questions';

type IntroStepProps = {
  buildingRef: string;
  onBuildingRefChange: (value: string) => void;
  onStart: () => void;
};

/** Screen 1: introduction, the optional building reference and the "Start" button (PRD section 8A). */
export function IntroStep({ buildingRef, onBuildingRefChange, onStart }: IntroStepProps) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onStart();
      }}
    >
      <h1 data-step-heading tabIndex={-1}>
        {checkerIntro.title}
      </h1>
      <p className="measure mt-4 text-lg">{checkerIntro.text}</p>

      <div className="mt-8 max-w-md">
        <label htmlFor="building-ref" className="mb-2 block font-semibold text-navy-900">
          {checkerIntro.referenceLabel}
        </label>
        <Input
          id="building-ref"
          value={buildingRef}
          maxLength={checkerIntro.referenceMaxLength}
          autoComplete="off"
          aria-describedby="building-ref-help"
          onChange={(event) => onBuildingRefChange(event.target.value)}
        />
        <p id="building-ref-help" className="mt-2 text-sm text-muted">
          {checkerIntro.referenceHelper}
        </p>
      </div>

      <div className="mt-8">
        <Button type="submit">{checkerIntro.start}</Button>
      </div>
      <Disclaimer className="mt-8" />
    </form>
  );
}
