import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildingsBandLabels,
  consentTextVersions,
  currentMethodLabels,
  featureLabels,
  fraTrackerLabels,
  keysOf,
  marketingConsentLabel,
  orgTypeLabels,
  priceBandLabels,
  roleLabels,
  startTimingLabels,
  toOptions,
} from './forms';

const prd = readFileSync(new URL('../../docs/PRD.md', import.meta.url), 'utf8');

/** The options listed in a PRD table row, split on " · " (or ", " for the 1 / 2–5 bands). */
function prdOptions(rowStart: string, separator = ' · '): string[] {
  const line = prd.split('\n').find((l) => l.startsWith(rowStart));
  expect(line, `row "${rowStart}" not found in docs/PRD.md`).toBeDefined();
  const cells = (line as string).slice(1, (line as string).lastIndexOf('|')).split(' | ');
  return (cells[cells.length - 1] as string)
    .replace(/ \(reveals[^)]*\)/g, '')
    .replace(/^Options: /, '')
    .split(separator)
    .map((option) => option.trim());
}

describe('form options match docs/PRD.md', () => {
  it('role (9A)', () => {
    expect(Object.values(roleLabels)).toEqual(prdOptions('| Role | select'));
  });

  it('organisation type (9A)', () => {
    expect(Object.values(orgTypeLabels)).toEqual(prdOptions('| Organisation type | select'));
  });

  it('buildings band (9A)', () => {
    expect(Object.values(buildingsBandLabels)).toEqual(prdOptions('| Buildings that may be in scope | select'));
  });

  it('how RPEEPs are managed today (P8)', () => {
    expect(Object.values(currentMethodLabels)).toEqual(prdOptions('| P8 |'));
  });

  it('features (P10)', () => {
    expect(Object.values(featureLabels)).toEqual(prdOptions('| P10 |'));
  });

  it('FRA action tracking (P11)', () => {
    expect(Object.values(fraTrackerLabels)).toEqual(prdOptions('| P11 |'));
  });

  it('price band (P12)', () => {
    expect(Object.values(priceBandLabels)).toEqual(prdOptions('| P12 |'));
  });

  it('start timing (P14)', () => {
    expect(Object.values(startTimingLabels)).toEqual(prdOptions('| P14 |'));
  });
});

describe('consent', () => {
  it('uses the PRD wording, with the brand from site.ts', () => {
    expect(marketingConsentLabel).toBe('Send me occasional updates about [BRAND] and the pilot. Unsubscribe any time.');
  });

  it('versions each form so we know which wording was agreed to', () => {
    expect(consentTextVersions).toEqual({ reportForm: 'report-form-v1', pilotForm: 'pilot-form-v1' });
  });
});

describe('helpers', () => {
  it('toOptions keeps the display order and keysOf returns the keys', () => {
    expect(toOptions({ a: 'A', b: 'B' })).toEqual([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    expect(keysOf({ x: '1', y: '2' })).toEqual(['x', 'y']);
  });
});
