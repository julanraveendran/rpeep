import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { scoreReadiness, type ReadinessAnswers } from '@/lib/readiness/score';
import type { ReportData } from '@/lib/report/types';
import { evaluateScope, type Answers } from '@/lib/scope/engine';
import { renderReportPdf } from './render';

const gates = { inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more' } as const;
const readinessAnswers: ReadinessAnswers = { R1: 'partly', R2: 'not_yet', R3: 'not_yet', R4: 'yes', R5: 'partly', R6: 'not_yet' };

function report(answers: Partial<Answers>, extra: Partial<ReportData> = {}, withReadiness = false): ReportData {
  const scope = evaluateScope(answers);
  return {
    reportId: '3f0c9a42-6f0e-4d0e-9c43-2a5a5a4b7d11',
    createdAt: new Date('2026-10-06T14:30:00Z'),
    firstName: 'Sam',
    organisation: 'Example Homes',
    buildingRef: 'Example House',
    answers,
    scope,
    readiness: withReadiness && scope.status === 'in_scope' ? { answers: readinessAnswers, result: scoreReadiness(readinessAnswers) } : null,
    ...extra,
  };
}

const latin1 = (bytes: Uint8Array) => Buffer.from(bytes).toString('latin1');
const pageCount = (bytes: Uint8Array) => (latin1(bytes).match(/\/Type\s*\/Page(?![a-z])/g) ?? []).length;

const hasPdftotext = spawnSync('pdftotext', ['-v']).error === undefined;
function text(bytes: Uint8Array): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'rpeep-pdf-'));
  const file = path.join(dir, 'report.pdf');
  writeFileSync(file, bytes);
  return spawnSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' }).stdout;
}

describe('renderReportPdf (PRD section 9D)', () => {
  it('renders a PDF that starts with the PDF signature, for each result type', async () => {
    for (const r of [
      report({ ...gates, storeys: 9 }),
      report({ ...gates, storeys: null, heightMetres: null, evacuationStrategy: 'unsure' }),
      report({ inEngland: 'no' }),
    ]) {
      const bytes = await renderReportPdf(r);
      expect(latin1(bytes.subarray(0, 5))).toBe('%PDF-');
      expect(latin1(bytes.subarray(-8))).toContain('%%EOF');
    }
  });

  it('is A4 and under 300KB, with Inter embedded', async () => {
    const bytes = await renderReportPdf(report({ ...gates, storeys: 9 }, {}, true));
    expect(bytes.length).toBeLessThan(300 * 1024);
    const raw = latin1(bytes);
    expect(raw).toMatch(/\/MediaBox\s*\[\s*0\s+0\s+595\.28\d*\s+841\.89\d*\s*\]/);
    expect(raw).toMatch(/Inter-Regular/);
    expect(raw).toMatch(/Inter-Bold/);
    expect(raw).toMatch(/Inter-SemiBold/);
  });

  it('has two pages, or three when the readiness check was completed (in scope only)', async () => {
    expect(pageCount(await renderReportPdf(report({ ...gates, storeys: 9 })))).toBe(2);
    expect(pageCount(await renderReportPdf(report({ ...gates, storeys: 9 }, {}, true)))).toBe(3);
    // Readiness is ignored for a result that is not in scope, even if it is passed in.
    const notInScope = report({ ...gates, storeys: 2, heightMetres: 6 }, { readiness: { answers: readinessAnswers, result: scoreReadiness(readinessAnswers) } });
    expect(pageCount(await renderReportPdf(notInScope))).toBe(3);
    expect(pageCount(await renderReportPdf(report({ ...gates, storeys: 2, heightMetres: 6 })))).toBe(2);
  });

  it('copes with a very long, unbroken building reference and hostile text', async () => {
    const bytes = await renderReportPdf(
      report({ ...gates, storeys: 9 }, { buildingRef: `<script>alert(1)</script>${'x'.repeat(200)}`, organisation: '"><img src=x onerror=alert(1)>', firstName: '{{name}}' }),
    );
    expect(latin1(bytes.subarray(0, 4))).toBe('%PDF');
  });

  it.skipIf(!hasPdftotext)('contains the PRD text for an in-scope report with readiness', async () => {
    const out = text(await renderReportPdf(report({ ...gates, storeys: 4, heightMetres: 12, evacuationStrategy: 'temporary_simultaneous' }, {}, false)));
    expect(out).toContain('RPEEP Scope Report');
    expect(out).toContain('Prepared for      Sam, Example Homes');
    expect(out).toContain('6 October 2026');
    expect(out).toContain('Your building is in scope');
    expect(out).toContain('Duties that apply');
    expect(out).toContain('Temporary simultaneous evacuation');
    expect(out).toContain('Guidance only, not legal advice · Engine v1.0.0 · Page 1 of 2');
    expect(out).toContain('Page 2 of 2');
    expect(out).toContain('https://www.legislation.gov.uk/uksi/2025/797/made');
    // Long sentences wrap across lines in the extracted text, so compare with the white space collapsed.
    expect(out.replace(/\s+/g, ' ')).toContain('It is not legal advice. Responsibility for compliance remains with the Responsible Person.');
  });

  it.skipIf(!hasPdftotext)('shows "Not known" for "I don\'t know", the missing items and the re-run link for "cannot confirm"', async () => {
    const out = text(await renderReportPdf(report({ ...gates, storeys: null, heightMetres: 15, evacuationStrategy: 'stay_put' })));
    expect(out).toContain('Not known');
    expect(out).toContain('What we still need');
    expect(out).toContain('The number of storeys above ground level.');
    expect(out).toContain('Run the checker again at [DOMAIN]/checker');
  });

  it.skipIf(!hasPdftotext)('has the other-duties note and "check again" for a building below the thresholds, but not for England', async () => {
    const below = text(await renderReportPdf(report({ ...gates, storeys: 3, heightMetres: 9 })));
    expect(below).toContain('Regulatory Reform (Fire Safety) Order 2005');
    expect(below).toContain('If any answer changes, check again.');
    const wales = text(await renderReportPdf(report({ inEngland: 'no' })));
    expect(wales).not.toContain('Regulatory Reform');
    expect(wales).toContain('If any answer changes, check again.');
  });

  it.skipIf(!hasPdftotext)('has the readiness score, the gaps in R1–R6 order and the suggested next steps on page 3', async () => {
    const out = text(await renderReportPdf(report({ ...gates, storeys: 9 }, {}, true)));
    expect(out).toContain('4 out of 12 — Early stages');
    const order = ['R2', 'R3', 'R5', 'R6'].map((id) => out.indexOf(`${id} `));
    expect(order.every((index) => index > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(out).toContain('Suggested next steps');
    expect(out).toContain('Confirm the scope with a competent fire safety professional.');
  });
});
