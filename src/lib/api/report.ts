import { consentTextVersions } from '@/content/forms';
import type { ApiDeps, ApiResult } from '@/lib/api/types';
import { safeErrorMessage } from '@/lib/log';
import type { ReportRow } from '@/lib/db';
import { scoreReadiness } from '@/lib/readiness/score';
import { reportFileName } from '@/lib/report/format';
import type { ReportData } from '@/lib/report/types';
import { fieldErrors, reportRequestSchema } from '@/lib/schemas';
import { evaluateScope } from '@/lib/scope/engine';

/**
 * `POST /api/report` (PRD sections 9 and 12). Takes the parsed JSON body and the visitor's IP and does the
 * eleven server steps in order. Everything the browser worked out is ignored: the status, the criteria and the
 * readiness score are computed again here, and those are what is stored, printed and returned.
 */
export async function handleReport(deps: ApiDeps, input: { body: unknown; ip: string }): Promise<ApiResult> {
  // 2. Validate. Unknown keys, such as a `status` or `result` sent by the browser, are stripped.
  const parsed = reportRequestSchema.safeParse(input.body);
  if (!parsed.success) return { status: 400, body: { ok: false, error: 'validation', fields: fieldErrors(parsed.error) } };
  const request = parsed.data;

  // 3. Verify the Turnstile token.
  if (!(await deps.verifyTurnstile(request.turnstileToken, input.ip))) {
    return { status: 403, body: { ok: false, error: 'bot_check' } };
  }

  // 4. Rate limit by hashed IP and by hashed email.
  const ipHash = deps.hash(input.ip);
  const ipAllowed = await deps.limiter.allow('report_ip', ipHash);
  const emailAllowed = ipAllowed && (await deps.limiter.allow('report_email', deps.hash(request.contact.email)));
  if (!ipAllowed || !emailAllowed) return { status: 429, body: { ok: false, error: 'rate_limited' } };

  // 5. Run the engine on the server. Readiness only counts for a building that is in scope.
  const scope = evaluateScope(request.answers);
  const readiness =
    request.readiness && scope.status === 'in_scope' ? { answers: request.readiness, result: scoreReadiness(request.readiness) } : null;

  const createdAt = deps.now();
  const { contact, utm } = request;

  // 6. Save the row.
  const row: ReportRow = {
    first_name: contact.firstName,
    email: contact.email,
    organisation: contact.organisation,
    role: contact.role,
    role_other: contact.roleOther,
    org_type: contact.orgType,
    buildings_band: contact.buildingsBand,
    building_ref: request.buildingRef,
    answers: request.answers,
    status: scope.status,
    criteria_met: scope.criteriaMet,
    missing: scope.missing,
    engine_version: scope.engineVersion,
    readiness_answers: readiness ? { ...readiness.answers } : null,
    readiness_score: readiness ? readiness.result.score : null,
    marketing_consent: contact.marketingConsent,
    consent_text_ver: consentTextVersions.reportForm,
    utm_source: utm.source,
    utm_medium: utm.medium,
    utm_campaign: utm.campaign,
    ip_hash: ipHash,
  };

  let reportId: string;
  try {
    reportId = await deps.db.insertReport(row);
  } catch (error) {
    deps.logError('report.insert', error);
    return { status: 500, body: { ok: false, error: 'server' } };
  }

  const report: ReportData = {
    reportId,
    createdAt,
    firstName: contact.firstName,
    organisation: contact.organisation,
    buildingRef: request.buildingRef,
    answers: request.answers,
    scope,
    readiness,
  };
  const fileName = reportFileName(request.buildingRef, createdAt);

  // 7. Render the PDF.
  let pdf: Uint8Array;
  try {
    pdf = await deps.renderPdf(report);
  } catch (error) {
    deps.logError('report.pdf', error);
    await recordEmailError(deps, reportId, 'pdf_render_failed');
    return { status: 500, body: { ok: false, error: 'server' } };
  }

  // 8. Email the visitor. A failure is stored, and the visitor can still download the PDF.
  let emailSent = false;
  try {
    const suppressed = await deps.db.isSuppressed(contact.email).catch(() => true);
    await deps.mailer.sendReportEmail({ report, to: contact.email, pdf, fileName, suppressed });
    emailSent = true;
  } catch (error) {
    deps.logError('report.email', error);
    await recordEmailError(deps, reportId, safeErrorMessage(error));
  }

  // 9. Tell the founder. A failure is logged, never returned.
  try {
    await deps.mailer.sendReportNotification({
      report,
      fileName,
      contact: {
        email: contact.email,
        role: contact.role,
        roleOther: contact.roleOther,
        orgType: contact.orgType,
        buildingsBand: contact.buildingsBand,
        marketingConsent: contact.marketingConsent,
        utm,
      },
    });
  } catch (error) {
    deps.logError('report.founder_notification', error);
  }

  // 10. Record that the email went out.
  if (emailSent) {
    try {
      await deps.db.markEmailSent(reportId, deps.now());
    } catch (error) {
      deps.logError('report.mark_email_sent', error);
    }
  }

  // 11. Done.
  return {
    status: 200,
    body: {
      ok: true,
      reportId,
      status: scope.status,
      emailSent,
      pdfBase64: Buffer.from(pdf).toString('base64'),
      fileName,
    },
  };
}

async function recordEmailError(deps: ApiDeps, reportId: string, message: string): Promise<void> {
  try {
    await deps.db.markEmailError(reportId, message);
  } catch (error) {
    deps.logError('report.mark_email_error', error);
  }
}
