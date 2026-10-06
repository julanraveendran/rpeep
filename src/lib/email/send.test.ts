import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReportData } from '@/lib/report/types';
import { evaluateScope } from '@/lib/scope/engine';
import { createMailer, createResendTransport, type OutgoingEmail } from './send';
import { verifyUnsubscribeToken } from '@/lib/tokens';

const sendMock = vi.fn();
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: (...args: unknown[]) => sendMock(...args) };
  },
}));

const secret = 'unsub-'.repeat(10);
const siteEnv = { NEXT_PUBLIC_SITE_URL: 'https://example.co.uk' };
const answers = { inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more', storeys: 9 } as const;
const report: ReportData = {
  reportId: '3f0c9a42-6f0e-4d0e-9c43-2a5a5a4b7d11',
  createdAt: new Date('2026-10-06T14:30:00Z'),
  firstName: 'Sam',
  organisation: 'Example Homes',
  buildingRef: 'Example House',
  answers,
  scope: evaluateScope(answers),
  readiness: null,
};

function setup() {
  const sent: OutgoingEmail[] = [];
  const mailer = createMailer({
    transport: { send: async (message) => void sent.push(message) },
    from: 'Brand <hello@example.co.uk>',
    replyTo: 'founder@example.co.uk',
    founderEmail: 'founder@example.co.uk',
    unsubscribeSecret: secret,
    siteEnv,
  });
  return { sent, mailer };
}

describe('mailer', () => {
  it('sends the report to the visitor with the PDF attached under the PRD file name', async () => {
    const { sent, mailer } = setup();
    const pdf = new TextEncoder().encode('%PDF-1.7 fake');
    await mailer.sendReportEmail({ report, to: 'sam@example.org', pdf, fileName: 'RPEEP-scope-report-example-house-2026-10-06.pdf', suppressed: false });
    expect(sent).toHaveLength(1);
    const message = sent[0]!;
    expect(message).toMatchObject({ from: 'Brand <hello@example.co.uk>', to: 'sam@example.org', replyTo: 'founder@example.co.uk', subject: 'Your RPEEP scope report — Example House' });
    expect(message.attachments).toEqual([{ filename: 'RPEEP-scope-report-example-house-2026-10-06.pdf', content: pdf, contentType: 'application/pdf' }]);
    expect(message.text.length).toBeGreaterThan(0); // a plain-text version is always sent
    expect(message.html).toContain('<table');
  });

  it('adds one-click unsubscribe headers with a signed token for the recipient', async () => {
    const { sent, mailer } = setup();
    await mailer.sendReportEmail({ report, to: 'Sam@Example.org', pdf: new Uint8Array(), fileName: 'x.pdf', suppressed: false });
    const message = sent[0]!;
    const url = /<(https:\/\/example\.co\.uk\/api\/unsubscribe\?token=[^>]+)>/.exec(message.headers?.['List-Unsubscribe'] ?? '')?.[1];
    expect(url).toBeDefined();
    expect(message.headers?.['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(verifyUnsubscribeToken(new URL(url!).searchParams.get('token'), secret)).toBe('sam@example.org');
    expect(message.html).toContain(url!.replace(/&/g, '&amp;'));
    expect(message.text).toContain(url!);
  });

  it('links to /pilot with utm_source=report_email', async () => {
    const { sent, mailer } = setup();
    await mailer.sendReportEmail({ report, to: 'sam@example.org', pdf: new Uint8Array(), fileName: 'x.pdf', suppressed: false });
    expect(sent[0]!.text).toContain('https://example.co.uk/pilot?utm_source=report_email');
  });

  it('sends the founder notifications to FOUNDER_EMAIL, with no attachment', async () => {
    const { sent, mailer } = setup();
    await mailer.sendReportNotification({
      report,
      fileName: 'x.pdf',
      contact: { email: 'sam@example.org', role: 'head_compliance', roleOther: null, orgType: 'managing_agent', buildingsBand: '1', marketingConsent: false, utm: { source: null, medium: null, campaign: null } },
    });
    await mailer.sendPilotNotification({ applicationId: 'a1', createdAt: report.createdAt, application: { organisation: 'Example Homes', buildings_band: '1', price_band: 'not_sure', role: 'head_compliance' } });
    expect(sent.map((m) => m.to)).toEqual(['founder@example.co.uk', 'founder@example.co.uk']);
    expect(sent.every((m) => !m.attachments)).toBe(true);
    expect(sent[0]!.subject).toBe('New report: Example Homes — In scope — 1');
    expect(sent[1]!.subject).toBe('Pilot application: Example Homes — 1 — Not sure');
  });

  it('sends the pilot confirmation to the applicant', async () => {
    const { sent, mailer } = setup();
    await mailer.sendPilotConfirmation({ applicationId: 'a1', to: 'sam@example.org', firstName: 'Sam' });
    expect(sent[0]).toMatchObject({ to: 'sam@example.org', subject: 'Your [BRAND] pilot application' });
  });
});

describe('Resend transport', () => {
  beforeEach(() => sendMock.mockReset());

  it('passes the message to Resend, with the attachment as a Buffer', async () => {
    sendMock.mockResolvedValue({ data: { id: '1' }, error: null });
    await createResendTransport('key').send({
      from: 'A <a@example.org>',
      to: 'b@example.org',
      replyTo: 'c@example.org',
      subject: 'S',
      html: '<p>h</p>',
      text: 'h',
      attachments: [{ filename: 'f.pdf', content: new Uint8Array([37, 80, 68, 70]), contentType: 'application/pdf' }],
      headers: { 'List-Unsubscribe': '<https://x>' },
    });
    const arg = sendMock.mock.calls[0]![0];
    expect(arg).toMatchObject({ from: 'A <a@example.org>', to: 'b@example.org', replyTo: 'c@example.org', subject: 'S', text: 'h', headers: { 'List-Unsubscribe': '<https://x>' } });
    expect(Buffer.isBuffer(arg.attachments[0].content)).toBe(true);
    expect(arg.attachments[0].content.toString('latin1')).toBe('%PDF');
  });

  it('turns an error returned by Resend into a thrown error (Resend does not throw)', async () => {
    sendMock.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'Invalid `from` field' } });
    await expect(createResendTransport('key').send({ from: 'x', to: 'y', subject: 's', html: 'h', text: 't' })).rejects.toThrow(/validation_error/);
  });
});
