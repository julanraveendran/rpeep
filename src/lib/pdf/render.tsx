import { renderToBuffer } from '@react-pdf/renderer';
import { ReportDocument } from '@/lib/pdf/Report';
import type { ReportData } from '@/lib/report/types';

/** Renders the report to PDF bytes. Server only: the PDF library is never bundled for the browser (PRD section 14D). */
export async function renderReportPdf(report: ReportData): Promise<Uint8Array> {
  const buffer = await renderToBuffer(<ReportDocument report={report} />);
  return new Uint8Array(buffer);
}
