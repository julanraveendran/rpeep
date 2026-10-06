/** In-memory stand-ins for Supabase, Resend, Turnstile and Upstash, used by the API tests. Not imported by app code. */

import { createMemoryLimiter } from '@/lib/ratelimit';
import { saltedHash } from '@/lib/ip';
import type { Db, PilotRow, ReportRow } from '@/lib/db';
import type { ApiDeps, Mailer } from '@/lib/api/types';

export class FakeDb implements Db {
  reports: (ReportRow & { id: string; email_sent_at: string | null; email_error: string | null })[] = [];
  pilots: (PilotRow & { id: string })[] = [];
  suppressions = new Set<string>();
  withdrawn: string[] = [];
  failInsertReport = false;
  failInsertPilot = false;
  private counter = 0;

  private nextId() {
    this.counter += 1;
    return `00000000-0000-4000-8000-${String(this.counter).padStart(12, '0')}`;
  }

  async insertReport(row: ReportRow) {
    if (this.failInsertReport) throw new Error('insert failed');
    const id = this.nextId();
    this.reports.push({ ...row, id, email_sent_at: null, email_error: null });
    return id;
  }
  async markEmailSent(reportId: string, at: Date) {
    const row = this.reports.find((r) => r.id === reportId);
    if (row) Object.assign(row, { email_sent_at: at.toISOString(), email_error: null });
  }
  async markEmailError(reportId: string, message: string) {
    const row = this.reports.find((r) => r.id === reportId);
    if (row) row.email_error = message;
  }
  async reportExists(reportId: string) {
    return this.reports.some((r) => r.id === reportId);
  }
  async insertPilot(row: PilotRow) {
    if (this.failInsertPilot) throw new Error('insert failed');
    const id = this.nextId();
    this.pilots.push({ ...row, id });
    return id;
  }
  async isSuppressed(email: string) {
    return this.suppressions.has(email);
  }
  async suppress(email: string) {
    this.suppressions.add(email);
  }
  async withdrawMarketingConsent(email: string) {
    this.withdrawn.push(email);
    for (const row of [...this.reports, ...this.pilots]) if (row.email === email) row.marketing_consent = false;
  }
}

export class FakeMailer implements Mailer {
  reportEmails: Parameters<Mailer['sendReportEmail']>[0][] = [];
  reportNotifications: Parameters<Mailer['sendReportNotification']>[0][] = [];
  pilotConfirmations: Parameters<Mailer['sendPilotConfirmation']>[0][] = [];
  pilotNotifications: Parameters<Mailer['sendPilotNotification']>[0][] = [];
  failReportEmail = false;
  failReportNotification = false;
  failPilotConfirmation = false;
  failPilotNotification = false;

  async sendReportEmail(input: Parameters<Mailer['sendReportEmail']>[0]) {
    if (this.failReportEmail) throw new Error('Resend failed for someone@example.org');
    this.reportEmails.push(input);
  }
  async sendReportNotification(input: Parameters<Mailer['sendReportNotification']>[0]) {
    if (this.failReportNotification) throw new Error('notification failed');
    this.reportNotifications.push(input);
  }
  async sendPilotConfirmation(input: Parameters<Mailer['sendPilotConfirmation']>[0]) {
    if (this.failPilotConfirmation) throw new Error('confirmation failed');
    this.pilotConfirmations.push(input);
  }
  async sendPilotNotification(input: Parameters<Mailer['sendPilotNotification']>[0]) {
    if (this.failPilotNotification) throw new Error('notification failed');
    this.pilotNotifications.push(input);
  }
}

export const TEST_SALT = 'salt-'.repeat(12);
export const TEST_UNSUBSCRIBE_SECRET = 'unsub-'.repeat(10);
export const PDF_BYTES = new TextEncoder().encode('%PDF-1.7\n%fake report\n');

export type TestContext = {
  deps: ApiDeps;
  db: FakeDb;
  mailer: FakeMailer;
  logged: { context: string; error: unknown }[];
  turnstile: { ok: boolean; calls: { token: string; ip: string }[] };
  clock: { now: Date };
  pdf: { fail: boolean; calls: number };
};

export function createTestContext(): TestContext {
  const db = new FakeDb();
  const mailer = new FakeMailer();
  const logged: TestContext['logged'] = [];
  const turnstile: TestContext['turnstile'] = { ok: true, calls: [] };
  const clock = { now: new Date('2026-10-06T14:30:00Z') };
  const pdf = { fail: false, calls: 0 };
  const limiter = createMemoryLimiter(() => clock.now.getTime());

  const deps: ApiDeps = {
    db,
    limiter,
    mailer,
    verifyTurnstile: async (token, ip) => {
      turnstile.calls.push({ token, ip });
      return turnstile.ok;
    },
    renderPdf: async () => {
      pdf.calls += 1;
      if (pdf.fail) throw new Error('render failed');
      return PDF_BYTES;
    },
    hash: (value) => saltedHash(value, TEST_SALT),
    now: () => clock.now,
    unsubscribeSecret: TEST_UNSUBSCRIBE_SECRET,
    logError: (context, error) => logged.push({ context, error }),
  };
  return { deps, db, mailer, logged, turnstile, clock, pdf };
}

/** The example request body from PRD section 12. */
export const reportBody = () => ({
  answers: { inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more', storeys: 9 },
  readiness: { R1: 'partly', R2: 'not_yet', R3: 'not_yet', R4: 'yes', R5: 'partly', R6: 'not_yet' },
  buildingRef: 'Example House',
  contact: {
    firstName: 'Sam',
    email: 'Sam@Example.org',
    organisation: 'Example Homes',
    role: 'head_building_safety',
    roleOther: null,
    orgType: 'housing_association',
    buildingsBand: '6-20',
    marketingConsent: false,
  },
  utm: { source: 'linkedin', medium: 'social', campaign: 'launch' },
  turnstileToken: 'token-1',
});

export const pilotBody = () => ({
  firstName: 'Sam',
  lastName: 'Jones',
  email: 'sam@example.org',
  organisation: 'Example Homes',
  role: 'property_block_manager',
  roleOther: null,
  orgType: 'managing_agent',
  buildingsBand: '2-5',
  currentMethods: ['spreadsheets', 'compliance_software'],
  currentSoftware: 'Acme Compliance',
  hardestPart: 'Finding residents who need help to evacuate.',
  topFeatures: ['find_residents', 'record_consent'],
  wantsFraTracker: 'maybe',
  priceBand: '100_250',
  willingToPay: true,
  startTiming: 'within_3_months',
  marketingConsent: true,
  utm: { source: 'report_email', medium: null, campaign: null },
  turnstileToken: 'token-2',
});
