import { handlePilot } from '@/lib/api/pilot';
import { handleFormRequest } from '@/lib/api/respond';
import { getApiDeps } from '@/lib/api/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/pilot: PRD sections 10 and 12. */
export function POST(request: Request) {
  return handleFormRequest(request, (input) => handlePilot(getApiDeps(), input), 'api.pilot');
}
