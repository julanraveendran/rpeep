import { handleReport } from '@/lib/api/report';
import { handleFormRequest } from '@/lib/api/respond';
import { getApiDeps } from '@/lib/api/services';

// Node.js runtime (the PDF library and Node crypto need it). Region lhr1 is set in vercel.json.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** POST /api/report: PRD sections 9 and 12. */
export function POST(request: Request) {
  return handleFormRequest(request, (input) => handleReport(getApiDeps(), input), 'api.report');
}
