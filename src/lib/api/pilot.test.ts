import { beforeEach, describe, expect, it } from 'vitest';
import { LIMITS } from '@/lib/ratelimit';
import { handlePilot } from './pilot';
import { createTestContext, pilotBody, reportBody, type TestContext } from './test-utils';
import { handleReport } from './report';

let ctx: TestContext;
beforeEach(() => {
  ctx = createTestContext();
});

const post = (body: unknown, ip = '203.0.113.7') => handlePilot(ctx.deps, { body, ip });

describe('POST /api/pilot', () => {
  it('stores the application, sends both emails and returns ok', async () => {
    const { status, body } = await post(pilotBody());
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(ctx.db.pilots).toHaveLength(1);
    expect(ctx.db.pilots[0]).toMatchObject({
      first_name: 'Sam',
      last_name: 'Jones',
      email: 'sam@example.org',
      current_methods: ['spreadsheets', 'compliance_software'],
      current_software: 'Acme Compliance',
      hardest_part: 'Finding residents who need help to evacuate.',
      top_features: ['find_residents', 'record_consent'],
      wants_fra_tracker: 'maybe',
      price_band: '100_250',
      willing_to_pay: true,
      start_timing: 'within_3_months',
      marketing_consent: true,
      consent_text_ver: 'pilot-form-v1',
      utm_source: 'report_email',
    });
    expect(ctx.mailer.pilotConfirmations).toEqual([{ applicationId: ctx.db.pilots[0]!.id, to: 'sam@example.org', firstName: 'Sam' }]);
    expect(ctx.mailer.pilotNotifications).toHaveLength(1);
  });

  it('does not put the hashed IP in the founder notification, and stores the hash rather than the IP', async () => {
    await post(pilotBody(), '203.0.113.7');
    expect(ctx.mailer.pilotNotifications[0]?.application).not.toHaveProperty('ip_hash');
    expect(ctx.db.pilots[0]?.ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(ctx.db.pilots[0])).not.toContain('203.0.113.7');
  });

  it('returns 400 with field errors, for example no way of managing RPEEPs and four features', async () => {
    const { status, body } = await post({ ...pilotBody(), currentMethods: [], topFeatures: ['find_residents', 'record_consent', 'pcfra_forms', 'review_reminders'] });
    expect(status).toBe(400);
    expect(body).toMatchObject({ error: 'validation', fields: { currentMethods: 'Choose at least one option.', topFeatures: 'Choose up to 3 features.' } });
    expect(ctx.db.pilots).toHaveLength(0);
  });

  it('returns 403 for a failed Turnstile check and stores nothing', async () => {
    ctx.turnstile.ok = false;
    const { status } = await post(pilotBody());
    expect(status).toBe(403);
    expect(ctx.db.pilots).toHaveLength(0);
    expect(ctx.mailer.pilotConfirmations).toHaveLength(0);
  });

  it('allows 3 requests per 10 minutes per IP and returns 429 for the fourth', async () => {
    for (let i = 0; i < 3; i++) expect((await post(pilotBody())).status).toBe(200);
    const { status, body } = await post(pilotBody());
    expect(status).toBe(429);
    expect(body).toEqual({ ok: false, error: 'rate_limited' });
    expect(LIMITS.pilot_ip).toMatchObject({ requests: 3, window: '10 m' });
  });

  it('keeps the pilot and report limits separate', async () => {
    for (let i = 0; i < 3; i++) await post(pilotBody());
    expect((await handleReport(ctx.deps, { body: reportBody(), ip: '203.0.113.7' })).status).toBe(200);
  });

  it('still returns ok if the confirmation or the founder email fails', async () => {
    ctx.mailer.failPilotConfirmation = true;
    ctx.mailer.failPilotNotification = true;
    const { status, body } = await post(pilotBody());
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(ctx.db.pilots).toHaveLength(1);
    expect(ctx.logged.map((entry) => entry.context)).toEqual(['pilot.confirmation_email', 'pilot.founder_notification']);
  });

  it('returns 500 if the application cannot be saved, and sends nothing', async () => {
    ctx.db.failInsertPilot = true;
    const { status } = await post(pilotBody());
    expect(status).toBe(500);
    expect(ctx.mailer.pilotConfirmations).toHaveLength(0);
  });

  it('links to a report that exists, and ignores one that does not', async () => {
    await handleReport(ctx.deps, { body: reportBody(), ip: '198.51.100.1' });
    const reportId = ctx.db.reports[0]!.id;
    await post({ ...pilotBody(), reportId });
    await post({ ...pilotBody(), reportId: '3f0c9a42-6f0e-4d0e-9c43-2a5a5a4b7d11' }, '198.51.100.2');
    expect(ctx.db.pilots.map((row) => row.report_id)).toEqual([reportId, null]);
  });

  it('keeps the software name only when compliance software is ticked, and the role text only for "Other"', async () => {
    await post({ ...pilotBody(), currentMethods: ['spreadsheets'], currentSoftware: 'Acme', role: 'other', roleOther: 'Surveyor' });
    expect(ctx.db.pilots[0]).toMatchObject({ current_software: null, role: 'other', role_other: 'Surveyor' });
  });

  it('treats willing to pay and updates as unticked unless true', async () => {
    const body: Record<string, unknown> = pilotBody();
    delete body.willingToPay;
    delete body.marketingConsent;
    await post(body);
    expect(ctx.db.pilots[0]).toMatchObject({ willing_to_pay: false, marketing_consent: false });
  });
});
