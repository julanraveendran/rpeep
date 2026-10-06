import { describe, expect, it } from 'vitest';
import { scoreReadiness, type ReadinessAnswers } from '@/lib/readiness/score';
import type { ReportData } from '@/lib/report/types';
import { evaluateScope, type Answers } from '@/lib/scope/engine';
import { escapeHtml, singleLine } from './html';
import { renderPilotConfirmation, renderPilotNotification, renderReportEmail, renderReportNotification } from './templates';

const gates = { inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more' } as const;
const readinessAnswers: ReadinessAnswers = { R1: 'yes', R2: 'yes', R3: 'partly', R4: 'partly', R5: 'not_yet', R6: 'not_yet' };

function report(answers: Partial<Answers>, extra: Partial<ReportData> = {}, withReadiness = false): ReportData {
  const scope = evaluateScope(answers);
  return {
    reportId: '3f0c9a42-6f0e-4d0e-9c43-2a5a5a4b7d11',
    createdAt: new Date('2026-10-06T14:30:00Z'),
    firstName: 'Sam',
    organisation: 'Example Homes',
    buildingRef: 'Example House',
    answers,
    scope,
    readiness: withReadiness ? { answers: readinessAnswers, result: scoreReadiness(readinessAnswers) } : null,
    ...extra,
  };
}

const links = { unsubscribeUrl: 'https://example.co.uk/api/unsubscribe?token=abc.def', pilotUrl: 'https://example.co.uk/pilot?utm_source=report_email' };
const render = (r: ReportData, suppressed = false) => renderReportEmail({ report: r, ...links, suppressed });

describe('report email (PRD section 9B)', () => {
  it('has the subject "Your RPEEP scope report — {reference}" and "your building" without one', () => {
    expect(render(report({ ...gates, storeys: 9 })).subject).toBe('Your RPEEP scope report — Example House');
    expect(render(report({ ...gates, storeys: 9 }, { buildingRef: null })).subject).toBe('Your RPEEP scope report — your building');
  });

  it('has the PRD body lines in order, in the plain-text version', () => {
    const { text } = render(report({ ...gates, storeys: 9 }, {}, true));
    const lines = text.split('\n');
    expect(lines[0]).toBe('Hi Sam,');
    expect(text).toContain('Your RPEEP scope report for Example House is attached.');
    expect(text).toContain('Result: Your building is in scope');
    expect(text).toContain('The building has at least seven storeys (regulation 3(1)(b)).');
    expect(text).toContain('The report lists the duties that apply, and the gaps from your readiness check.');
    expect(text).toContain("Want help managing RPEEPs? We're opening a small founding pilot: https://example.co.uk/pilot?utm_source=report_email");
    expect(text).toContain('[First name], Founder, [BRAND] · [DOMAIN]');
    expect(text.indexOf('Hi Sam')).toBeLessThan(text.indexOf('is attached'));
    expect(text.indexOf('Result:')).toBeLessThan(text.indexOf('Want help managing'));
    expect(text.indexOf('Want help managing')).toBeLessThan(text.indexOf('Founder'));
  });

  it('leaves out the readiness clause when the check was skipped, and the duties line when not in scope', () => {
    expect(render(report({ ...gates, storeys: 9 })).text).toContain('The report lists the duties that apply.');
    expect(render(report({ ...gates, storeys: 9 })).text).not.toContain('readiness');
    expect(render(report({ ...gates, storeys: 2, heightMetres: 6 })).text).not.toContain('The report lists');
    expect(render(report({ inEngland: 'no' })).text).toContain('Result: Your building is not in scope of these regulations');
  });

  it('shows the first thing still needed when it cannot confirm', () => {
    const { text } = render(report({ ...gates, storeys: null, heightMetres: 15, evacuationStrategy: 'stay_put' }));
    expect(text).toContain("Result: We can't confirm yet — we need a little more information");
    expect(text).toContain('The number of storeys above ground level.');
  });

  it('has the footer: legal details, why they received it, the disclaimer and an unsubscribe link, in both versions', () => {
    const { html, text } = render(report({ ...gates, storeys: 9 }));
    for (const body of [html, text]) {
      expect(body).toContain('Registered in England and Wales, company number [NUMBER]');
      expect(body).toContain('You received this because you requested a report at [DOMAIN].');
      expect(body).toContain('This is guidance based on SI 2025/797, not legal advice.');
      expect(body).toContain('https://example.co.uk/api/unsubscribe?token=abc.def');
    }
    expect(html).toContain('>Unsubscribe</a>');
  });

  it('leaves out the pilot promotion for an address that has unsubscribed, but keeps the report', () => {
    const { text, html } = render(report({ ...gates, storeys: 9 }), true);
    expect(text).not.toContain('founding pilot');
    expect(html).not.toContain('founding pilot');
    expect(text).toContain('Your RPEEP scope report for Example House is attached.');
  });

  it('is a single-column, table-based, image-free layout at most 600px wide, in dark text on white', () => {
    const { html } = render(report({ ...gates, storeys: 9 }));
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain('<html lang="en-GB">');
    expect(html).toContain('<table role="presentation" width="600"');
    expect(html).toContain('max-width:600px');
    expect(html).not.toMatch(/<img\b/i);
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toMatch(/<(div|span)[^>]*(display:\s*(flex|grid))/i);
    expect(html).toContain('background-color:#ffffff');
    expect(html).toContain('color:#1F2937');
    expect(html).toMatch(/font-family:-apple-system, 'Segoe UI', Roboto, Arial, sans-serif/);
  });

  it('escapes user input in the HTML and keeps it to one line in the subject', () => {
    const hostile = report(
      { ...gates, storeys: 9 },
      { firstName: '<b>Sam</b>', buildingRef: 'A"><script>alert(1)</script>\r\nBcc: attacker@example.org', organisation: '<i>Org</i>' },
    );
    const { html, subject } = render(hostile);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>Sam</b>');
    expect(html).toContain('&lt;b&gt;Sam&lt;/b&gt;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).toBe('Your RPEEP scope report — A"><script>alert(1)</script> Bcc: attacker@example.org');
  });
});

describe('founder notification for a report (PRD section 9C)', () => {
  const contact = {
    email: 'sam@example.org',
    role: 'other',
    roleOther: 'Surveyor',
    orgType: 'housing_association',
    buildingsBand: '6-20',
    marketingConsent: true,
    utm: { source: 'linkedin', medium: 'social', campaign: 'launch' },
  };

  it('has the subject "New report: {organisation} — {status} — {buildings band}"', () => {
    const { subject } = renderReportNotification({ report: report({ ...gates, storeys: 9 }), contact, fileName: 'x.pdf' });
    expect(subject).toBe('New report: Example Homes — In scope — 6–20');
  });

  it('lists every form field, the status, the criteria, the readiness score, the UTM values, the London time and the report ID', () => {
    const { text, html } = renderReportNotification({ report: report({ ...gates, storeys: 9 }, {}, true), contact, fileName: 'x.pdf' });
    for (const expected of [
      'First name: Sam',
      'Work email: sam@example.org',
      'Organisation: Example Homes',
      'Role: Other: Surveyor',
      'Organisation type: Housing association',
      'Buildings that may be in scope: 6–20',
      'Updates opt-in: Yes',
      'Building reference: Example House',
      'Scope status: In scope',
      'Criteria met: C2_STOREYS_7',
      'Readiness score: 6 out of 12 (Partly prepared)',
      'utm_source: linkedin',
      'utm_medium: social',
      'utm_campaign: launch',
      'Received: 6 October 2026, 15:30',
      'Report ID: 3f0c9a42-6f0e-4d0e-9c43-2a5a5a4b7d11',
    ]) {
      expect(text).toContain(expected);
    }
    expect(html).toContain('sam@example.org');
  });

  it('says the readiness check was not completed, and escapes hostile input', () => {
    const { text, html, subject } = renderReportNotification({
      report: report({ ...gates, storeys: 9 }, { organisation: '<script>x</script>\nEvil' }),
      contact,
      fileName: 'x.pdf',
    });
    expect(text).toContain('Readiness score: Not completed');
    expect(html).not.toContain('<script>');
    expect(subject).not.toMatch(/[\r\n]/);
  });
});

describe('pilot emails (PRD section 10)', () => {
  it('confirms the application with the PRD subject and wording', () => {
    const email = renderPilotConfirmation({ firstName: 'Sam', createdAt: new Date('2026-10-06T14:30:00Z') });
    expect(email.subject).toBe('Your [BRAND] pilot application');
    expect(email.text).toContain("We'll review your application and reply within 3 working days from hello@[DOMAIN].");
    expect(email.html).toContain('reply within 3 working days from hello@[DOMAIN]');
    expect(email.html).not.toMatch(/<img\b/i);
  });

  const application = {
    first_name: 'Sam',
    last_name: 'Jones',
    email: 'sam@example.org',
    organisation: 'Example Homes',
    role: 'property_block_manager',
    role_other: null,
    org_type: 'managing_agent',
    buildings_band: '2-5',
    current_methods: ['spreadsheets', 'compliance_software'],
    current_software: 'Acme',
    hardest_part: 'Finding residents.',
    top_features: ['find_residents', 'record_consent'],
    wants_fra_tracker: 'maybe',
    price_band: '100_250',
    willing_to_pay: true,
    start_timing: 'within_3_months',
    marketing_consent: false,
    report_id: null,
    utm_source: 'report_email',
    utm_medium: null,
    utm_campaign: null,
  };

  it('notifies the founder with the subject "Pilot application: {organisation} — {buildings band} — {price band}"', () => {
    const { subject, text } = renderPilotNotification({ applicationId: 'app-1', createdAt: new Date('2026-10-06T14:30:00Z'), application });
    expect(subject).toBe('Pilot application: Example Homes — 2–5 — £100–£250');
    for (const expected of [
      'Last name: Jones',
      'How RPEEPs are managed today: Spreadsheets, Our existing compliance software',
      'Existing software: Acme',
      'Hardest part: Finding residents.',
      'Features that matter most: Finding and contacting residents, Recording consent',
      'Willing to pay: Yes',
      'Start: Within 3 months',
      'Received: 6 October 2026, 15:30',
      'Application ID: app-1',
    ]) {
      expect(text).toContain(expected);
    }
  });
});

describe('html helpers', () => {
  it('escapes the five characters that matter in HTML', () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  });

  it('turns line breaks and control characters into spaces', () => {
    expect(singleLine('a\r\nb\tc\u0000d e')).toBe('a b c d e');
  });
});
