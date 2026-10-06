import { consentTextVersions } from '@/content/forms';
import type { ApiDeps, ApiResult } from '@/lib/api/types';
import type { PilotRow } from '@/lib/db';
import { fieldErrors, pilotRequestSchema } from '@/lib/schemas';

/** `POST /api/pilot` (PRD section 10 and 12): same pattern as the report, with a limit of 3 per 10 minutes per IP. */
export async function handlePilot(deps: ApiDeps, input: { body: unknown; ip: string }): Promise<ApiResult> {
  const parsed = pilotRequestSchema.safeParse(input.body);
  if (!parsed.success) return { status: 400, body: { ok: false, error: 'validation', fields: fieldErrors(parsed.error) } };
  const request = parsed.data;

  if (!(await deps.verifyTurnstile(request.turnstileToken, input.ip))) {
    return { status: 403, body: { ok: false, error: 'bot_check' } };
  }

  const ipHash = deps.hash(input.ip);
  if (!(await deps.limiter.allow('pilot_ip', ipHash))) return { status: 429, body: { ok: false, error: 'rate_limited' } };

  // Link the application to a report only if that report exists, so a made-up id cannot break the insert.
  let reportId: string | null = null;
  if (request.reportId) {
    reportId = await deps.db
      .reportExists(request.reportId)
      .then((exists) => (exists ? request.reportId : null))
      .catch(() => null);
  }

  const row: PilotRow = {
    first_name: request.firstName,
    last_name: request.lastName,
    email: request.email,
    organisation: request.organisation,
    role: request.role,
    role_other: request.roleOther,
    org_type: request.orgType,
    buildings_band: request.buildingsBand,
    current_methods: request.currentMethods,
    current_software: request.currentSoftware,
    hardest_part: request.hardestPart,
    top_features: request.topFeatures,
    wants_fra_tracker: request.wantsFraTracker,
    price_band: request.priceBand,
    willing_to_pay: request.willingToPay,
    start_timing: request.startTiming,
    marketing_consent: request.marketingConsent,
    consent_text_ver: consentTextVersions.pilotForm,
    report_id: reportId,
    utm_source: request.utm.source,
    utm_medium: request.utm.medium,
    utm_campaign: request.utm.campaign,
    ip_hash: ipHash,
  };

  let applicationId: string;
  try {
    applicationId = await deps.db.insertPilot(row);
  } catch (error) {
    deps.logError('pilot.insert', error);
    return { status: 500, body: { ok: false, error: 'server' } };
  }

  // Both emails are best effort: the application is already saved.
  try {
    await deps.mailer.sendPilotConfirmation({ applicationId, to: request.email, firstName: request.firstName });
  } catch (error) {
    deps.logError('pilot.confirmation_email', error);
  }
  try {
    const { ip_hash: _ipHash, ...application } = row;
    void _ipHash;
    await deps.mailer.sendPilotNotification({ applicationId, createdAt: deps.now(), application });
  } catch (error) {
    deps.logError('pilot.founder_notification', error);
  }

  return { status: 200, body: { ok: true } };
}
