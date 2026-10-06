/**
 * Writes a sample report PDF for each result type to a folder (default /tmp/rpeep-sample-pdfs) so they can be
 * checked by eye (PRD section 16, phase 9). Run: `npm run sample:pdfs [folder]`.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { scoreReadiness, type ReadinessAnswers } from '@/lib/readiness/score';
import { renderReportPdf } from '@/lib/pdf/render';
import { reportFileName } from '@/lib/report/format';
import type { ReportData } from '@/lib/report/types';
import { evaluateScope, type Answers } from '@/lib/scope/engine';

const folder = process.argv[2] ?? '/tmp/rpeep-sample-pdfs';
const createdAt = new Date('2026-10-06T14:30:00Z');
const gates = { inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more' } as const;

function build(
  name: string,
  answers: Partial<Answers>,
  options: { buildingRef?: string | null; readiness?: ReadinessAnswers } = {},
): [string, ReportData] {
  const scope = evaluateScope(answers);
  const readiness = options.readiness && scope.status === 'in_scope' ? { answers: options.readiness, result: scoreReadiness(options.readiness) } : null;
  return [
    name,
    {
      reportId: '3f0c9a42-6f0e-4d0e-9c43-2a5a5a4b7d11',
      createdAt,
      firstName: 'Sam',
      organisation: 'Example Homes',
      buildingRef: options.buildingRef === undefined ? 'Example House' : options.buildingRef,
      answers,
      scope,
      readiness,
    },
  ];
}

const samples = [
  build('in-scope-with-readiness', { ...gates, storeys: 4, heightMetres: 12, evacuationStrategy: 'temporary_simultaneous' }, {
    readiness: { R1: 'partly', R2: 'not_yet', R3: 'not_yet', R4: 'yes', R5: 'partly', R6: 'not_yet' },
  }),
  build('in-scope-no-readiness', { ...gates, storeys: 9 }, { buildingRef: null }),
  build('cannot-confirm', { ...gates, storeys: null, heightMetres: null, evacuationStrategy: 'unsure' }),
  build('not-in-scope-below-thresholds', { ...gates, storeys: 3, heightMetres: 9 }),
  build('not-in-scope-wales', { inEngland: 'no' }, { buildingRef: 'A very long building reference with-an-unbrokenstringthatgoesonandonandonandonandonforever' }),
];

await mkdir(folder, { recursive: true });
for (const [name, report] of samples) {
  const bytes = await renderReportPdf(report);
  const file = path.join(folder, `${name}.pdf`);
  await writeFile(file, bytes);
  console.log(`${file}  ${(bytes.length / 1024).toFixed(0)} KB  (${reportFileName(report.buildingRef, createdAt)})`);
}
