import { beforeEach, describe, expect, it } from 'vitest';
import { handleReport } from './report';
import { LIMITS } from '@/lib/ratelimit';
import { createTestContext, PDF_BYTES, reportBody, TEST_SALT, type TestContext } from './test-utils';
import { saltedHash } from '@/lib/ip';

let ctx: TestContext;
beforeEach(() => {
  ctx = createTestContext();
});

const post = (body: unknown, ip = '203.0.113.7') => handleReport(ctx.deps, { body, ip });

describe('POST /api/report: the happy path (PRD section 15B)', () => {
  it('returns 200 with the PDF as base64 that starts with the PDF signature', async () => {
    const { status, body } = await post(reportBody());
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(typeof body.pdfBase64).toBe('string');
    const bytes = Buffer.from(body.pdfBase64 as string, 'base64');
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes.subarray(0, 4).toString('latin1')).toBe('%PDF');
    expect(Buffer.compare(bytes, Buffer.from(PDF_BYTES))).toBe(0);
  });

  it('returns the report id, the server status, emailSent and the file name', async () => {
    const { body } = await post(reportBody());
    expect(body).toMatchObject({
      ok: true,
      status: 'in_scope',
      emailSent: true,
      fileName: 'RPEEP-scope-report-example-house-2026-10-06.pdf',
    });
    expect(body.reportId).toBe(ctx.db.reports[0]?.id);
  });

  it('stores the row from the server engine run, with the PRD column values', async () => {
    await post(reportBody());
    expect(ctx.db.reports).toHaveLength(1);
    const row = ctx.db.reports[0]!;
    expect(row).toMatchObject({
      first_name: 'Sam',
      email: 'sam@example.org', // lower-cased
      organisation: 'Example Homes',
      role: 'head_building_safety',
      role_other: null,
      org_type: 'housing_association',
      buildings_band: '6-20',
      building_ref: 'Example House',
      status: 'in_scope',
      criteria_met: ['C2_STOREYS_7'],
      missing: [],
      engine_version: '1.0.0',
      readiness_score: 4,
      marketing_consent: false,
      consent_text_ver: 'report-form-v1',
      utm_source: 'linkedin',
      utm_medium: 'social',
      utm_campaign: 'launch',
    });
    expect(row.answers).toEqual({ inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more', storeys: 9 });
    expect(row.readiness_answers).toEqual({ R1: 'partly', R2: 'not_yet', R3: 'not_yet', R4: 'yes', R5: 'partly', R6: 'not_yet' });
    expect(row.email_sent_at).not.toBeNull();
  });

  it('emails the visitor with the PDF attached, and notifies the founder', async () => {
    await post(reportBody());
    expect(ctx.mailer.reportEmails).toHaveLength(1);
    expect(ctx.mailer.reportEmails[0]).toMatchObject({ to: 'sam@example.org', suppressed: false });
    expect(ctx.mailer.reportEmails[0]?.pdf).toBe(PDF_BYTES);
    expect(ctx.mailer.reportEmails[0]?.fileName).toBe('RPEEP-scope-report-example-house-2026-10-06.pdf');
    expect(ctx.mailer.reportNotifications).toHaveLength(1);
    expect(ctx.mailer.reportNotifications[0]?.contact).toMatchObject({ email: 'sam@example.org', orgType: 'housing_association', buildingsBand: '6-20' });
  });

  it('works without readiness or a building reference', async () => {
    const body: Record<string, unknown> = reportBody();
    delete body.readiness;
    delete body.buildingRef;
    const { status, body: response } = await post(body);
    expect(status).toBe(200);
    expect(response.fileName).toBe('RPEEP-scope-report-building-2026-10-06.pdf');
    expect(ctx.db.reports[0]?.readiness_answers).toBeNull();
    expect(ctx.db.reports[0]?.readiness_score).toBeNull();
  });
});

describe('POST /api/report: the server is the source of truth', () => {
  it('ignores a status sent by the browser: not-in-scope answers stay "not_in_scope"', async () => {
    const body = {
      ...reportBody(),
      status: 'in_scope',
      result: { status: 'in_scope', criteriaMet: ['C1_HEIGHT_18'] },
      answers: { inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more', storeys: 3, heightMetres: 9 },
    };
    const { status, body: response } = await post(body);
    expect(status).toBe(200);
    expect(response.status).toBe('not_in_scope');
    expect(ctx.db.reports[0]?.status).toBe('not_in_scope');
    expect(ctx.db.reports[0]?.criteria_met).toEqual([]);
  });

  it('ignores readiness sent for a building that is not in scope', async () => {
    const body = { ...reportBody(), answers: { inEngland: 'no' } };
    const { status } = await post(body);
    expect(status).toBe(200);
    expect(ctx.db.reports[0]?.status).toBe('not_in_scope');
    expect(ctx.db.reports[0]?.readiness_answers).toBeNull();
    expect(ctx.db.reports[0]?.readiness_score).toBeNull();
  });

  it('stores "cannot_confirm" with the missing items, and no readiness', async () => {
    const body = {
      ...reportBody(),
      answers: { inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more', storeys: null, heightMetres: 15, evacuationStrategy: 'stay_put' },
    };
    const { body: response } = await post(body);
    expect(response.status).toBe('cannot_confirm');
    expect(ctx.db.reports[0]).toMatchObject({ status: 'cannot_confirm', missing: ['STOREYS'], criteria_met: [], readiness_score: null });
  });

  it('computes the readiness score on the server, ignoring a score sent by the browser', async () => {
    const body = { ...reportBody(), readinessScore: 12, readiness: { R1: 'yes', R2: 'yes', R3: 'yes', R4: 'yes', R5: 'partly', R6: 'partly' } };
    await post(body);
    expect(ctx.db.reports[0]?.readiness_score).toBe(10);
  });

  it('drops answers to questions the checker would not have asked', async () => {
    const body = {
      ...reportBody(),
      answers: { inEngland: 'no', excludedPremises: 'no', dwellings: 'two_or_more', storeys: 20, heightMetres: 80 },
    };
    await post(body);
    expect(ctx.db.reports[0]?.answers).toEqual({ inEngland: 'no' });
  });

  it('rejects answers that are not a finished checker flow', async () => {
    const { status, body } = await post({ ...reportBody(), answers: { inEngland: 'yes' } });
    expect(status).toBe(400);
    expect(body).toMatchObject({ ok: false, error: 'validation', fields: { 'answers.excludedPremises': 'Choose an option to continue.' } });
    expect(ctx.db.reports).toHaveLength(0);
  });
});

describe('POST /api/report: validation, bot check and rate limits', () => {
  it('returns 400 with field errors for an invalid body, before anything else happens', async () => {
    const { status, body } = await post({ ...reportBody(), contact: { ...reportBody().contact, email: 'nope', role: 'ceo' } });
    expect(status).toBe(400);
    expect(body).toMatchObject({ ok: false, error: 'validation', fields: { 'contact.email': expect.any(String), 'contact.role': 'Choose your role.' } });
    expect(ctx.turnstile.calls).toHaveLength(0);
    expect(ctx.db.reports).toHaveLength(0);
  });

  it('returns 400 for a body that is not an object', async () => {
    for (const body of [null, 'text', 42, []]) expect((await post(body)).status).toBe(400);
  });

  it('returns 403 for a failed Turnstile check and stores and sends nothing', async () => {
    ctx.turnstile.ok = false;
    const { status, body } = await post(reportBody());
    expect(status).toBe(403);
    expect(body).toEqual({ ok: false, error: 'bot_check' });
    expect(ctx.db.reports).toHaveLength(0);
    expect(ctx.mailer.reportEmails).toHaveLength(0);
    expect(ctx.mailer.reportNotifications).toHaveLength(0);
    expect(ctx.pdf.calls).toBe(0);
  });

  it('passes the token and the visitor IP to Turnstile', async () => {
    await post(reportBody(), '198.51.100.9');
    expect(ctx.turnstile.calls).toEqual([{ token: 'token-1', ip: '198.51.100.9' }]);
  });

  it('allows five requests in 10 minutes from one IP and returns 429 for the sixth', async () => {
    for (let i = 1; i <= 5; i++) {
      const body = reportBody();
      body.contact.email = `person${i}@example.org`;
      expect((await post(body)).status, `request ${i}`).toBe(200);
    }
    const sixth = reportBody();
    sixth.contact.email = 'person6@example.org';
    const { status, body } = await post(sixth);
    expect(status).toBe(429);
    expect(body).toEqual({ ok: false, error: 'rate_limited' });
    expect(ctx.db.reports).toHaveLength(5);
    expect(LIMITS.report_ip).toMatchObject({ requests: 5, window: '10 m' });
  });

  it('counts each IP separately, and lets the same IP back in after 10 minutes', async () => {
    for (let i = 0; i < 5; i++) await post({ ...reportBody(), contact: { ...reportBody().contact, email: `a${i}@example.org` } });
    expect((await post(reportBody(), '198.51.100.20')).status).toBe(200);
    expect((await post(reportBody())).status).toBe(429);
    ctx.clock.now = new Date(ctx.clock.now.getTime() + 10 * 60 * 1000 + 1000);
    expect((await post(reportBody())).status).toBe(200);
  });

  it('allows 20 requests per 24 hours per email address and returns 429 for the 21st', async () => {
    let count = 0;
    for (let i = 0; i < 20; i++) {
      // Spread across IPs and time so that only the per-email limit is reached.
      ctx.clock.now = new Date(ctx.clock.now.getTime() + 11 * 60 * 1000);
      expect((await post(reportBody(), `192.0.2.${i + 1}`)).status).toBe(200);
      count++;
    }
    expect(count).toBe(20);
    ctx.clock.now = new Date(ctx.clock.now.getTime() + 11 * 60 * 1000);
    const { status } = await post(reportBody(), '192.0.2.99');
    expect(status).toBe(429);
    expect(LIMITS.report_email).toMatchObject({ requests: 20, window: '24 h' });
  });

  it('treats the same email in different letter case as one address', async () => {
    for (let i = 0; i < 20; i++) {
      ctx.clock.now = new Date(ctx.clock.now.getTime() + 11 * 60 * 1000);
      const body = reportBody();
      body.contact.email = i % 2 === 0 ? 'SAM@example.org' : ' sam@Example.org ';
      await post(body, `192.0.2.${i + 1}`);
    }
    ctx.clock.now = new Date(ctx.clock.now.getTime() + 11 * 60 * 1000);
    expect((await post(reportBody(), '192.0.2.200')).status).toBe(429);
  });
});

describe('POST /api/report: when email or other services fail', () => {
  it('still returns 200 with emailSent false when Resend fails, and stores email_error', async () => {
    ctx.mailer.failReportEmail = true;
    const { status, body } = await post(reportBody());
    expect(status).toBe(200);
    expect(body.emailSent).toBe(false);
    expect(typeof body.pdfBase64).toBe('string');
    const row = ctx.db.reports[0]!;
    expect(row.email_sent_at).toBeNull();
    expect(row.email_error).toContain('Resend failed');
    expect(row.email_error).not.toContain('someone@example.org'); // no personal data in the stored error
    expect(ctx.logged.some((entry) => entry.context === 'report.email')).toBe(true);
  });

  it('still notifies the founder when the visitor email fails', async () => {
    ctx.mailer.failReportEmail = true;
    await post(reportBody());
    expect(ctx.mailer.reportNotifications).toHaveLength(1);
  });

  it('logs a failed founder notification but still succeeds and records the email as sent', async () => {
    ctx.mailer.failReportNotification = true;
    const { status, body } = await post(reportBody());
    expect(status).toBe(200);
    expect(body.emailSent).toBe(true);
    expect(ctx.db.reports[0]?.email_sent_at).not.toBeNull();
    expect(ctx.logged.map((entry) => entry.context)).toContain('report.founder_notification');
  });

  it('returns 500 and stores nothing if the row cannot be saved, without rendering or sending anything', async () => {
    ctx.db.failInsertReport = true;
    const { status, body } = await post(reportBody());
    expect(status).toBe(500);
    expect(body).toEqual({ ok: false, error: 'server' });
    expect(ctx.pdf.calls).toBe(0);
    expect(ctx.mailer.reportEmails).toHaveLength(0);
  });

  it('returns 500 if the PDF cannot be rendered, and notes it on the row', async () => {
    ctx.pdf.fail = true;
    const { status, body } = await post(reportBody());
    expect(status).toBe(500);
    expect(body).toEqual({ ok: false, error: 'server' });
    expect(ctx.db.reports[0]?.email_error).toBe('pdf_render_failed');
    expect(ctx.mailer.reportEmails).toHaveLength(0);
  });

  it('marks the email as suppressed (no pilot promotion) if the address has unsubscribed, but still sends the report', async () => {
    ctx.db.suppressions.add('sam@example.org');
    const { body } = await post(reportBody());
    expect(body.emailSent).toBe(true);
    expect(ctx.mailer.reportEmails[0]?.suppressed).toBe(true);
  });
});

describe('POST /api/report: privacy', () => {
  it('stores a salted hash of the IP, never the raw address, and never sends the raw IP to the rate limiter', async () => {
    await post(reportBody(), '203.0.113.7');
    const row = ctx.db.reports[0]!;
    expect(row.ip_hash).toBe(saltedHash('203.0.113.7', TEST_SALT));
    expect(row.ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain('203.0.113.7');
  });

  it('stores marketing consent only when the box was ticked, with the wording version', async () => {
    const ticked = reportBody();
    ticked.contact.marketingConsent = true;
    await post(ticked);
    await post(reportBody(), '198.51.100.1');
    expect(ctx.db.reports.map((row) => row.marketing_consent)).toEqual([true, false]);
    expect(ctx.db.reports.every((row) => row.consent_text_ver === 'report-form-v1')).toBe(true);
  });
});
