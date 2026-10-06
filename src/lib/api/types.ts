import type { Db } from '@/lib/db';
import type { RateLimiter } from '@/lib/ratelimit';
import type { ReportData } from '@/lib/report/types';

/** What a handler returns. The route turns it into a `Response`. */
export type ApiResult = { status: number; body: Record<string, unknown> };

/** Details of the person who asked for a report, for the founder notification (PRD section 9C). */
export type ReportContactDetails = {
  email: string;
  role: string;
  roleOther: string | null;
  orgType: string;
  buildingsBand: string;
  marketingConsent: boolean;
  utm: { source: string | null; medium: string | null; campaign: string | null };
};

export type ReportEmailInput = {
  report: ReportData;
  to: string;
  pdf: Uint8Array;
  fileName: string;
  /** True if the address has unsubscribed: the email is still sent (it is a requested report) but leaves out the pilot promotion. */
  suppressed: boolean;
};

export type ReportNotificationInput = {
  report: ReportData;
  contact: ReportContactDetails;
  fileName: string;
};

export type PilotEmailInput = {
  applicationId: string;
  to: string;
  firstName: string;
};

export type PilotNotificationInput = {
  applicationId: string;
  createdAt: Date;
  /** Every field of the application, as stored. */
  application: Record<string, unknown>;
};

/** Sends email. Each function throws if the email could not be sent. */
export type Mailer = {
  sendReportEmail(input: ReportEmailInput): Promise<void>;
  sendReportNotification(input: ReportNotificationInput): Promise<void>;
  sendPilotConfirmation(input: PilotEmailInput): Promise<void>;
  sendPilotNotification(input: PilotNotificationInput): Promise<void>;
};

export type ApiDeps = {
  db: Db;
  limiter: RateLimiter;
  mailer: Mailer;
  /** Verifies a Turnstile token for the visitor's IP. */
  verifyTurnstile(token: string, ip: string): Promise<boolean>;
  /** Renders the report PDF on the server. */
  renderPdf(report: ReportData): Promise<Uint8Array>;
  /** Salted hash of a value, for IPs and emails. Never a raw value. */
  hash(value: string): string;
  now(): Date;
  unsubscribeSecret: string;
  logError(context: string, error: unknown): void;
};
