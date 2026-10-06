import type { Page, Route } from '@playwright/test';

/** A tiny file that starts with the PDF signature, standing in for the server-rendered report. */
export const PDF_BASE64 = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n').toString('base64');

export const REPORT_ID = '3f0c9a42-6f0e-4d0e-9c43-2a5a5a4b7d11';

/**
 * Replaces Cloudflare's Turnstile script with a stub that hands out a token straight away, so the tests need no network.
 * The real widget is not exercised here.
 */
export async function stubTurnstile(page: Page) {
  await page.route('**/challenges.cloudflare.com/turnstile/v0/api.js*', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      // Like the real widget, a reset asks for a new token and the callback is called again.
      body: `(function () { var options; var count = 0; window.turnstile = { render: function (el, o) { options = o; count++; setTimeout(function () { options.callback('test-token'); }, 30); return 'widget-1'; }, reset: function () { setTimeout(function () { options.callback('test-token'); }, 30); }, remove: function () {} }; })();`,
    }),
  );
}

export type Captured = { bodies: Record<string, unknown>[] };

type ReportReply = { status?: number; body?: Record<string, unknown> };

/** Answers POST /api/report from the test, and records every request body. */
export async function mockReportApi(page: Page, reply: ReportReply | ((count: number) => ReportReply) = {}): Promise<Captured> {
  const captured: Captured = { bodies: [] };
  await page.route('**/api/report', async (route: Route) => {
    captured.bodies.push(route.request().postDataJSON());
    const chosen = typeof reply === 'function' ? reply(captured.bodies.length) : reply;
    await route.fulfill({
      status: chosen.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(
        chosen.body ?? {
          ok: true,
          reportId: REPORT_ID,
          status: 'in_scope',
          emailSent: true,
          pdfBase64: PDF_BASE64,
          fileName: 'RPEEP-scope-report-example-house-2026-10-06.pdf',
        },
      ),
    });
  });
  return captured;
}

export async function mockPilotApi(page: Page, reply: ReportReply = {}): Promise<Captured> {
  const captured: Captured = { bodies: [] };
  await page.route('**/api/pilot', async (route: Route) => {
    captured.bodies.push(route.request().postDataJSON());
    await route.fulfill({ status: reply.status ?? 200, contentType: 'application/json', body: JSON.stringify(reply.body ?? { ok: true }) });
  });
  return captured;
}

/** Records Plausible custom events, in place of the real script (which is never loaded in tests). */
export async function recordEvents(page: Page) {
  await page.addInitScript(() => {
    const events: [string, unknown][] = [];
    (window as unknown as { __events: typeof events }).__events = events;
    window.plausible = (name, options) => void events.push([name, options?.props ?? null]);
  });
}

export const getEvents = (page: Page) =>
  page.evaluate(() => (window as unknown as { __events: [string, Record<string, unknown> | null][] }).__events);
