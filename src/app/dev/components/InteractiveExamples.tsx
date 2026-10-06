'use client';

import { useState } from 'react';
import { NumberField } from '@/components/checker/NumberField';
import { RadioCardGroup } from '@/components/checker/RadioCardGroup';

/** Client-side examples for the controls that hold state. */
export function InteractiveExamples() {
  const [england, setEngland] = useState<string | null>(null);
  const [storeys, setStoreys] = useState('');
  const [storeysUnknown, setStoreysUnknown] = useState(false);
  const [height, setHeight] = useState('11,5');
  const [heightUnknown, setHeightUnknown] = useState(false);

  return (
    <div className="mt-4 grid gap-8 lg:grid-cols-2">
      <RadioCardGroup
        name="dev-england"
        legend={<h3>Is the building in England?</h3>}
        value={england}
        onChange={setEngland}
        options={[
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: "No — it's in Wales, Scotland or Northern Ireland" },
        ]}
      />
      <RadioCardGroup
        name="dev-error"
        legend={<h3>With an error</h3>}
        value={null}
        onChange={() => {}}
        error="Choose an option to continue."
        options={[
          { value: 'a', label: 'Option A', description: 'A short description' },
          { value: 'b', label: 'Option B' },
        ]}
      />
      <NumberField
        id="dev-storeys"
        label="How many storeys does the building have above ground level?"
        unit="storeys"
        inputMode="numeric"
        value={storeys}
        onChange={setStoreys}
        unknown={storeysUnknown}
        onUnknownChange={setStoreysUnknown}
      />
      <NumberField
        id="dev-height"
        label="How high is the top storey above ground level?"
        unit="m"
        value={height}
        onChange={setHeight}
        unknown={heightUnknown}
        onUnknownChange={setHeightUnknown}
        error="Enter a height between 0.1 and 350 metres, using up to one decimal place, or tick 'I don't know'."
      />
    </div>
  );
}
