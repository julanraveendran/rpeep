import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { contact } from '../src/content/site';
import { chooseAndContinue, enterNumber, passGates, resultHeading, startChecker } from './helpers';
import { getEvents, mockPilotApi, mockReportApi, recordEvents, REPORT_ID, stubTurnstile } from './fixtures';

/** Fill the six fields of the report form. */
async function fillReportForm(page: Page, overrides: { email?: string } = {}) {
  await page.getByLabel('First name').fill('Sam');
  await page.getByLabel('Work email').fill(overrides.email ?? 'Sam@Example.org');
  await page.getByLabel('Organisation', { exact: true }).fill('Example Homes');
  await page.getByLabel('Role').selectOption('head_building_safety');
  await page.getByLabel('Organisation type').selectOption('housing_association');
  await page.getByLabel('Buildings that may be in scope').selectOption('6-20');
}

async function reachInScopeResult(page: Page, reference = 'Example House') {
  await startChecker(page, { reference });
  await passGates(page);
  await enterNumber(page, '9');
  await expect(resultHeading(page, 'Your building is in scope')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await stubTurnstile(page);
  await recordEvents(page);
});

test.describe('report form', () => {
  test('home → hero CTA → checker → 9 storeys → in scope → readiness → report form → success → PDF downloads', async ({ page }) => {
    const api = await mockReportApi(page);
    await page.goto('/?utm_source=linkedin&utm_medium=social&utm_campaign=launch');
    await page.getByRole('link', { name: 'Check if your building is in scope (2 min)' }).click();
    await expect(page).toHaveURL(/\/checker$/);
    await page.getByLabel(/Building name or reference/).fill('Example House');
    await page.getByRole('button', { name: 'Start' }).click();
    await passGates(page);
    await enterNumber(page, '9');
    await expect(resultHeading(page, 'Your building is in scope')).toBeVisible();

    await page.getByRole('link', { name: 'Check how ready you are (1 minute)' }).click();
    const picks = [0, 1, 2, 0, 1, 2]; // Yes, Partly, Not yet, Yes, Partly, Not yet
    for (const [index, pick] of picks.entries()) await page.locator(`input[name="R${index + 1}"]`).nth(pick).check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { level: 1, name: '6 out of 12 — Partly prepared' })).toBeVisible();

    await fillReportForm(page);
    await page.getByLabel('Send me occasional updates').check();
    await page.getByRole('button', { name: 'Get my free report' }).click();

    await expect(page.getByRole('heading', { name: 'Your report is ready' })).toBeFocused();
    await expect(page.getByText("We've also emailed it to")).toContainText('Sam@Example.org'.toLowerCase());
    await expect(page.getByText('It can take a few minutes — check your junk folder.')).toBeVisible();
    await expect(page.getByText('Want help managing RPEEPs?')).toBeVisible();

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PDF' }).click()]);
    expect(download.suggestedFilename()).toBe('RPEEP-scope-report-example-house-2026-10-06.pdf');
    expect(readFileSync((await download.path())!).subarray(0, 4).toString('latin1')).toBe('%PDF');

    // What the browser sent: the answers, never a result.
    expect(api.bodies).toHaveLength(1);
    const body = api.bodies[0]!;
    expect(body.answers).toEqual({ inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more', storeys: 9 });
    expect(body.readiness).toEqual({ R1: 'yes', R2: 'partly', R3: 'not_yet', R4: 'yes', R5: 'partly', R6: 'not_yet' });
    expect(body.buildingRef).toBe('Example House');
    expect(body.turnstileToken).toBe('test-token');
    expect(body.utm).toEqual({ source: 'linkedin', medium: 'social', campaign: 'launch' });
    expect(body.contact).toMatchObject({ firstName: 'Sam', email: 'sam@example.org', organisation: 'Example Homes', role: 'head_building_safety', orgType: 'housing_association', buildingsBand: '6-20', marketingConsent: true });
    expect(body).not.toHaveProperty('status');
    expect(body).not.toHaveProperty('result');

    // Analytics (PRD section 14C): events with the right properties, and no personal data.
    const events = await getEvents(page);
    expect(events.map(([name]) => name)).toEqual([
      'cta_clicked',
      'checker_started',
      'question_answered',
      'question_answered',
      'question_answered',
      'question_answered',
      'checker_completed',
      'readiness_completed',
      'report_requested',
      'report_downloaded',
    ]);
    expect(events[0]).toEqual(['cta_clicked', { location: 'hero' }]);
    expect(events.find(([name]) => name === 'checker_completed')?.[1]).toEqual({ status: 'in_scope' });
    expect(events.find(([name]) => name === 'readiness_completed')?.[1]).toEqual({ score: 6 });
    expect(events.find(([name]) => name === 'report_requested')?.[1]).toEqual({ status: 'in_scope' });
    expect(events.filter(([name]) => name === 'question_answered').map(([, props]) => props)).toEqual([
      { step: 'inEngland' },
      { step: 'excludedPremises' },
      { step: 'dwellings' },
      { step: 'storeys' },
    ]);
    expect(JSON.stringify(events)).not.toMatch(/sam@|Example Homes|Example House/i);
  });

  test('"Skip to my free report" works without the readiness check, and the form is not shown before the checker is finished', async ({ page }) => {
    await mockReportApi(page);
    await page.goto('/checker#report');
    await expect(page.getByRole('heading', { level: 1, name: 'Is the building in England?' })).toBeVisible();
    await reachInScopeResult(page);
    await page.getByRole('link', { name: 'Skip to my free report' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Get your free report' })).toBeVisible();
    await fillReportForm(page);
    await page.getByRole('button', { name: 'Get my free report' }).click();
    await expect(page.getByRole('heading', { name: 'Your report is ready' })).toBeVisible();
  });

  test('submitting empty shows an error summary and inline errors, and fixing them succeeds', async ({ page }) => {
    const api = await mockReportApi(page);
    await reachInScopeResult(page);
    await page.getByRole('link', { name: 'Skip to my free report' }).click();

    await page.getByRole('button', { name: 'Get my free report' }).click();
    const summary = page.getByRole('alert').filter({ hasText: 'There is a problem' });
    await expect(summary).toBeFocused();
    for (const message of ['Enter your first name.', 'Enter a valid email address.', 'Enter your organisation.', 'Choose your role.', 'Choose your organisation type.', 'Choose how many buildings may be in scope.']) {
      await expect(summary.getByRole('link', { name: message })).toBeVisible();
      await expect(page.getByText(message, { exact: true }).nth(1)).toBeVisible(); // the inline copy under the field
    }
    expect(api.bodies).toHaveLength(0);

    // Each summary link moves focus to its field without changing the checker's step.
    await summary.getByRole('link', { name: 'Enter your first name.' }).click();
    await expect(page.getByLabel('First name')).toBeFocused();
    await expect(page).toHaveURL(/#report$/);

    await fillReportForm(page);
    await expect(page.getByText('Enter your first name.')).toHaveCount(0);
    await page.getByRole('button', { name: 'Get my free report' }).click();
    await expect(page.getByRole('heading', { name: 'Your report is ready' })).toBeVisible();
  });

  test('keeps the answers and shows the PRD message when the server fails, and works on a second try', async ({ page }) => {
    await mockReportApi(page, (count) => (count === 1 ? { status: 500, body: { ok: false, error: 'server' } } : {}));
    await reachInScopeResult(page);
    await page.getByRole('link', { name: 'Skip to my free report' }).click();
    await fillReportForm(page);
    await page.getByRole('button', { name: 'Get my free report' }).click();
    await expect(page.getByRole('alert').filter({ hasText: `Something went wrong and your report wasn't sent. Please try again. If it keeps happening, email ${contact.email}.` })).toBeVisible();
    await expect(page.getByLabel('First name')).toHaveValue('Sam');
    await expect(page.getByLabel('Organisation', { exact: true })).toHaveValue('Example Homes');
    await page.getByRole('button', { name: 'Get my free report' }).click();
    await expect(page.getByRole('heading', { name: 'Your report is ready' })).toBeVisible();
  });

  test.describe('API failures', () => {
    for (const [status, error, message] of [
      [403, 'bot_check', "We couldn't verify you're human. Please refresh and try again."],
      [429, 'rate_limited', 'Too many requests. Please wait 10 minutes and try again.'],
    ] as const) {
      test(`shows the message for ${status}`, async ({ page }) => {
        await mockReportApi(page, { status, body: { ok: false, error } });
        await reachInScopeResult(page);
        await page.getByRole('link', { name: 'Skip to my free report' }).click();
        await fillReportForm(page);
        await page.getByRole('button', { name: 'Get my free report' }).click();
        await expect(page.getByRole('alert').filter({ hasText: message })).toBeVisible();
        await expect(page.getByLabel('Work email')).toHaveValue('Sam@Example.org');
      });
    }
  });

  test('puts server field errors under the right field', async ({ page }) => {
    await mockReportApi(page, { status: 400, body: { ok: false, error: 'validation', fields: { 'contact.email': 'Enter a valid email address.' } } });
    await reachInScopeResult(page);
    await page.getByRole('link', { name: 'Skip to my free report' }).click();
    await fillReportForm(page);
    await page.getByRole('button', { name: 'Get my free report' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'There is a problem' })).toBeVisible();
    await expect(page.getByLabel('Work email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('says when the email could not be sent, but still offers the download', async ({ page }) => {
    await mockReportApi(page, { body: { ok: true, reportId: REPORT_ID, status: 'not_in_scope', emailSent: false, pdfBase64: 'JVBERi0=', fileName: 'x.pdf' } });
    await startChecker(page);
    await chooseAndContinue(page, /^No — it's in Wales/);
    await page.getByRole('link', { name: 'Email me this result' }).click();
    await fillReportForm(page);
    await page.getByRole('button', { name: 'Get my free report' }).click();
    await expect(page.getByText("We couldn't email it, but you can download it now.")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
  });

  test('"Other" reveals a 60-character role field, and the email field accepts personal domains', async ({ page }) => {
    const api = await mockReportApi(page);
    await reachInScopeResult(page);
    await page.getByRole('link', { name: 'Skip to my free report' }).click();
    await expect(page.getByLabel('Describe your role')).toHaveCount(0);
    await fillReportForm(page, { email: 'sam@gmail.com' });
    await page.getByLabel('Role').selectOption('other');
    await expect(page.getByLabel('Describe your role')).toHaveAttribute('maxlength', '60');
    await page.getByLabel('Describe your role').fill('Surveyor');
    await page.getByRole('button', { name: 'Get my free report' }).click();
    await expect(page.getByRole('heading', { name: 'Your report is ready' })).toBeVisible();
    expect((api.bodies[0]!.contact as Record<string, unknown>).roleOther).toBe('Surveyor');
  });
});

test.describe('pilot form', () => {
  const hardest = 'Finding residents who need help to evacuate.';

  async function fillPilot(page: Page) {
    await page.getByLabel('First name').fill('Sam');
    await page.getByLabel('Last name').fill('Jones');
    await page.getByLabel('Work email').fill('sam@example.org');
    await page.getByLabel('Organisation', { exact: true }).fill('Example Homes');
    await page.getByLabel('Role').selectOption('property_block_manager');
    await page.getByLabel('Organisation type').selectOption('managing_agent');
    await page.getByLabel('Buildings that may be in scope').selectOption('2-5');
    await page.getByRole('checkbox', { name: 'Spreadsheets' }).check();
    await page.getByLabel('What is the hardest part of RPEEPs for you?').fill(hardest);
    await page.getByRole('radio', { name: 'Maybe' }).check();
    await page.getByRole('radio', { name: '£100–£250' }).check();
    await page.getByRole('radio', { name: 'Within 3 months' }).check();
  }

  test('from a finished checker the fields pre-fill; choosing a 4th feature is blocked; submit; the thanks page shows the first name', async ({ page }) => {
    await mockReportApi(page);
    const pilot = await mockPilotApi(page);
    await reachInScopeResult(page);
    await page.getByRole('link', { name: 'Skip to my free report' }).click();
    await fillReportForm(page);
    await page.getByRole('button', { name: 'Get my free report' }).click();
    await expect(page.getByRole('heading', { name: 'Your report is ready' })).toBeVisible();

    await page.getByRole('link', { name: 'Join the pilot' }).click();
    await expect(page).toHaveURL(/\/pilot$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Join the founding pilot' })).toBeVisible();
    await expect(page.getByLabel('First name')).toHaveValue('Sam');
    await expect(page.getByLabel('Work email')).toHaveValue('sam@example.org');
    await expect(page.getByLabel('Organisation', { exact: true })).toHaveValue('Example Homes');
    await expect(page.getByLabel('Role')).toHaveValue('head_building_safety');
    await expect(page.getByLabel('Organisation type')).toHaveValue('housing_association');
    await expect(page.getByLabel('Buildings that may be in scope')).toHaveValue('6-20');
    await expect(page.getByLabel('Last name')).toHaveValue('');

    // At most three features.
    const features = page.getByRole('group', { name: 'Which features matter most?' });
    for (const name of ['Finding and contacting residents', 'Recording consent', 'PCFRA forms']) await features.getByRole('checkbox', { name }).check();
    await expect(features.getByRole('checkbox', { name: 'Review reminders' })).toBeDisabled();
    await expect(features.getByRole('checkbox', { name: 'Evidence pack for audits' })).toBeDisabled();
    await features.getByRole('checkbox', { name: 'PCFRA forms' }).uncheck();
    await expect(features.getByRole('checkbox', { name: 'Review reminders' })).toBeEnabled();

    await page.getByLabel('Last name').fill('Jones');
    await page.getByRole('checkbox', { name: 'Our existing compliance software' }).check();
    await page.getByLabel('Which one?').fill('Acme Compliance');
    await page.getByLabel('What is the hardest part of RPEEPs for you?').fill(hardest);
    await expect(page.getByText(`${hardest.length} of 800 characters`)).toBeVisible();
    await page.getByRole('radio', { name: 'Yes, very' }).check();
    await page.getByRole('radio', { name: 'Over £500' }).check();
    await page.getByLabel("I'd consider a paid pilot if it meets our needs.").check();
    await page.getByRole('radio', { name: 'Now' }).check();
    await page.getByRole('button', { name: 'Apply for the pilot' }).click();

    await expect(page).toHaveURL(/\/pilot\/thanks$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Thanks, Sam' })).toBeVisible();
    await expect(page.getByText(`We'll review your application and reply within 3 working days from ${contact.email}.`)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to the free checker' })).toHaveAttribute('href', '/checker');

    expect(pilot.bodies).toHaveLength(1);
    expect(pilot.bodies[0]).toMatchObject({
      firstName: 'Sam',
      lastName: 'Jones',
      email: 'sam@example.org',
      organisation: 'Example Homes',
      role: 'head_building_safety',
      orgType: 'housing_association',
      buildingsBand: '6-20',
      currentMethods: ['compliance_software'],
      currentSoftware: 'Acme Compliance',
      topFeatures: ['find_residents', 'record_consent'],
      wantsFraTracker: 'yes_very',
      priceBand: 'over_500',
      willingToPay: true,
      startTiming: 'now',
      marketingConsent: false,
      reportId: REPORT_ID,
      turnstileToken: 'test-token',
    });

    const events = await getEvents(page);
    expect(events.map(([name]) => name)).toContain('pilot_started');
    expect(events.filter(([name]) => name === 'pilot_started')).toHaveLength(1);
    expect(events.find(([name]) => name === 'pilot_submitted')?.[1]).toEqual({
      orgType: 'housing_association',
      buildingsBand: '6-20',
      priceBand: 'over_500',
      willingToPay: true,
    });
    expect(JSON.stringify(events)).not.toMatch(/Sam|Jones|example/i);
  });

  test('a visitor with no checker can apply, and sees the PRD errors for what is missing', async ({ page }) => {
    const pilot = await mockPilotApi(page);
    await page.goto('/pilot');
    await expect(page.getByText('We review every application within 3 working days.')).toBeVisible();
    await expect(page.getByText('No calls needed unless you want one.')).toBeVisible();
    await expect(page.getByLabel('First name')).toHaveValue('');

    await page.getByRole('button', { name: 'Apply for the pilot' }).click();
    const summary = page.getByRole('alert').filter({ hasText: 'There is a problem' });
    await expect(summary).toBeFocused();
    await expect(summary.getByRole('link', { name: 'Choose at least one option.' })).toBeVisible();
    await expect(summary.getByRole('link', { name: 'Tell us the hardest part, in 10 to 800 characters.' })).toBeVisible();
    expect(pilot.bodies).toHaveLength(0);

    await fillPilot(page);
    await page.getByLabel('What is the hardest part of RPEEPs for you?').fill('Too short');
    await page.getByRole('button', { name: 'Apply for the pilot' }).click();
    await expect(page.getByText('Tell us the hardest part, in 10 to 800 characters.').first()).toBeVisible();
    await page.getByLabel('What is the hardest part of RPEEPs for you?').fill(hardest);
    await page.getByRole('button', { name: 'Apply for the pilot' }).click();
    await expect(page).toHaveURL(/\/pilot\/thanks$/);
    expect(pilot.bodies[0]).toMatchObject({ reportId: null, willingToPay: false, marketingConsent: false, utm: { source: null, medium: null, campaign: null } });
  });

  test('says so when the application cannot be sent, and keeps what was typed', async ({ page }) => {
    await mockPilotApi(page, { status: 500, body: { ok: false, error: 'server' } });
    await page.goto('/pilot');
    await fillPilot(page);
    await page.getByRole('button', { name: 'Apply for the pilot' }).click();
    await expect(page.getByRole('alert').filter({ hasText: "Something went wrong and your application wasn't sent." })).toBeVisible();
    await expect(page.getByLabel('Last name')).toHaveValue('Jones');
    await expect(page).toHaveURL(/\/pilot$/);
  });

  test('the report email link (utm_source=report_email) is captured and sent with the application', async ({ page }) => {
    const pilot = await mockPilotApi(page);
    await page.goto('/pilot?utm_source=report_email');
    await fillPilot(page);
    await page.getByRole('button', { name: 'Apply for the pilot' }).click();
    await expect(page).toHaveURL(/\/pilot\/thanks$/);
    expect((pilot.bodies[0] as { utm: unknown }).utm).toEqual({ source: 'report_email', medium: null, campaign: null });
  });
});

test.describe('unsubscribe page', () => {
  test('shows the PRD message for each outcome', async ({ page }) => {
    await page.goto('/unsubscribe?status=ok');
    await expect(page.getByRole('heading', { level: 1, name: "You've been unsubscribed." })).toBeVisible();
    await page.goto('/unsubscribe?status=invalid');
    await expect(page.getByRole('heading', { level: 1, name: "This link isn't valid." })).toBeVisible();
    await expect(page.getByText(`Email ${contact.email} and we'll remove you.`)).toBeVisible();
    await page.goto('/unsubscribe');
    await expect(page.getByRole('heading', { level: 1, name: "This link isn't valid." })).toBeVisible();
  });
});
