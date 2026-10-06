/**
 * The four emails (PRD sections 9B, 9C and 10). Each returns a subject, an HTML body and a plain-text body.
 * Wording that is not user data comes from `src/content/`.
 */

import { buildingsBandLabels, orgTypeLabels, priceBandLabels, roleLabels, currentMethodLabels, featureLabels, fraTrackerLabels, startTimingLabels } from '@/content/forms';
import { disclaimer } from '@/content/questions';
import { missingCopy, reasonCopy, resultHeadlines } from '@/content/regulations';
import { contact, founder, legalLine, site } from '@/content/site';
import { detailsTable, escapeHtml, layout, link, p, singleLine, small } from '@/lib/email/html';
import { formatLondonDateTime } from '@/lib/report/format';
import type { ReportData } from '@/lib/report/types';
import type { ReportContactDetails } from '@/lib/api/types';

export type RenderedEmail = { subject: string; html: string; text: string };

const signature = `${founder.firstName}, ${founder.role}, ${site.name} · ${site.domain}`;

const statusLabels = { in_scope: 'In scope', not_in_scope: 'Not in scope', cannot_confirm: "Can't confirm yet" } as const;

function label<T extends Record<string, string>>(labels: T, key: string): string {
  return (labels as Record<string, string>)[key] ?? key;
}

// ---------------------------------------------------------------------------
// 9B. Email to the visitor with the PDF attached
// ---------------------------------------------------------------------------

export type ReportEmailContent = {
  report: ReportData;
  /** Link that unsubscribes this address (signed token). */
  unsubscribeUrl: string;
  /** Link to the pilot page with `utm_source=report_email`. */
  pilotUrl: string;
  /** If true the address has unsubscribed: leave out the pilot promotion. */
  suppressed: boolean;
};

export function renderReportEmail({ report, unsubscribeUrl, pilotUrl, suppressed }: ReportEmailContent): RenderedEmail {
  const reference = report.buildingRef ? singleLine(report.buildingRef) : 'your building';
  const { scope } = report;
  const subject = `Your RPEEP scope report — ${reference}`;
  const headline = resultHeadlines[scope.status];
  const firstReason = scope.reasons[0] ? reasonCopy[scope.reasons[0]] : scope.missing[0] ? missingCopy[scope.missing[0]] : null;
  const inScopeLine =
    scope.status === 'in_scope' ? `The report lists the duties that apply${report.readiness ? ', and the gaps from your readiness check' : ''}.` : null;
  const pilotLine = suppressed ? null : "Want help managing RPEEPs? We're opening a small founding pilot:";
  const footerLines = [
    legalLine(report.createdAt.getUTCFullYear()),
    `You received this because you requested a report at ${site.domain}.`,
    disclaimer,
  ];

  const text = [
    `Hi ${singleLine(report.firstName)},`,
    '',
    `Your RPEEP scope report for ${reference} is attached.`,
    '',
    `Result: ${headline}`,
    ...(firstReason ? [firstReason] : []),
    ...(inScopeLine ? ['', inScopeLine] : []),
    ...(pilotLine ? ['', `${pilotLine} ${pilotUrl}`] : []),
    '',
    signature,
    '',
    '--',
    ...footerLines,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');

  const html = layout({
    title: subject,
    preheader: `${headline}.`,
    bodyHtml: [
      p(`Hi ${escapeHtml(singleLine(report.firstName))},`),
      p(`Your RPEEP scope report for ${escapeHtml(reference)} is attached.`),
      p(`<strong>Result:</strong> ${escapeHtml(headline)}${firstReason ? `<br>${escapeHtml(firstReason)}` : ''}`),
      inScopeLine ? p(escapeHtml(inScopeLine)) : '',
      pilotLine ? p(`${escapeHtml(pilotLine)} ${link(pilotUrl, pilotUrl)}`) : '',
      p(escapeHtml(signature)),
    ].join('\n'),
    footerHtml: [
      ...footerLines.map((line) => small(escapeHtml(line))),
      small(link(unsubscribeUrl, 'Unsubscribe')),
    ].join('\n'),
  });

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// 9C. Founder notification for a report request
// ---------------------------------------------------------------------------

export function renderReportNotification(input: { report: ReportData; contact: ReportContactDetails; fileName: string }): RenderedEmail {
  const { report, contact: person } = input;
  const { scope } = report;
  const band = label(buildingsBandLabels, person.buildingsBand);
  const subject = singleLine(`New report: ${report.organisation} — ${statusLabels[scope.status]} — ${band}`);
  const role = person.roleOther ? `${label(roleLabels, person.role)}: ${person.roleOther}` : label(roleLabels, person.role);

  const rows: (readonly [string, string])[] = [
    ['First name', report.firstName],
    ['Work email', person.email],
    ['Organisation', report.organisation],
    ['Role', role],
    ['Organisation type', label(orgTypeLabels, person.orgType)],
    ['Buildings that may be in scope', band],
    ['Updates opt-in', person.marketingConsent ? 'Yes' : 'No'],
    ['Building reference', report.buildingRef ?? ''],
    ['Scope status', statusLabels[scope.status]],
    ['Criteria met', scope.criteriaMet.join(', ') || 'None'],
    ['Missing', scope.missing.join(', ') || 'None'],
    ['Readiness score', report.readiness ? `${report.readiness.result.score} out of 12 (${report.readiness.result.bandLabel})` : 'Not completed'],
    ['utm_source', person.utm.source ?? ''],
    ['utm_medium', person.utm.medium ?? ''],
    ['utm_campaign', person.utm.campaign ?? ''],
    ['Engine version', scope.engineVersion],
    ['Received', formatLondonDateTime(report.createdAt)],
    ['Report ID', report.reportId],
    ['PDF file name', input.fileName],
  ];

  return {
    subject,
    text: [subject, '', ...rows.map(([name, value]) => `${name}: ${singleLine(value)}`)].join('\n'),
    html: layout({ title: subject, bodyHtml: p(`<strong>${escapeHtml(subject)}</strong>`) + detailsTable(rows) }),
  };
}

// ---------------------------------------------------------------------------
// 10. Pilot confirmation and founder notification
// ---------------------------------------------------------------------------

export function renderPilotConfirmation(input: { firstName: string; createdAt: Date }): RenderedEmail {
  const subject = `Your ${site.name} pilot application`;
  const body = `We'll review your application and reply within 3 working days from ${contact.email}.`;
  const footerLines = [legalLine(input.createdAt.getUTCFullYear()), `You received this because you applied for the pilot at ${site.domain}.`];
  const name = singleLine(input.firstName);
  return {
    subject,
    text: [`Hi ${name},`, '', `Thanks for applying to the ${site.name} founding pilot.`, body, '', signature, '', '--', ...footerLines].join('\n'),
    html: layout({
      title: subject,
      preheader: body,
      bodyHtml: [p(`Hi ${escapeHtml(name)},`), p(`Thanks for applying to the ${escapeHtml(site.name)} founding pilot.`), p(escapeHtml(body)), p(escapeHtml(signature))].join('\n'),
      footerHtml: footerLines.map((line) => small(escapeHtml(line))).join('\n'),
    }),
  };
}

export function renderPilotNotification(input: { applicationId: string; createdAt: Date; application: Record<string, unknown> }): RenderedEmail {
  const a = input.application as Record<string, string | string[] | boolean | null | undefined>;
  const text = (key: string) => {
    const value = a[key];
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value == null ? '' : String(value);
  };
  const band = label(buildingsBandLabels, text('buildings_band'));
  const price = label(priceBandLabels, text('price_band'));
  const subject = singleLine(`Pilot application: ${text('organisation')} — ${band} — ${price}`);
  const role = a.role_other ? `${label(roleLabels, text('role'))}: ${text('role_other')}` : label(roleLabels, text('role'));

  const rows: (readonly [string, string])[] = [
    ['First name', text('first_name')],
    ['Last name', text('last_name')],
    ['Work email', text('email')],
    ['Organisation', text('organisation')],
    ['Role', role],
    ['Organisation type', label(orgTypeLabels, text('org_type'))],
    ['Buildings that may be in scope', band],
    ['How RPEEPs are managed today', (a.current_methods as string[] | undefined)?.map((m) => label(currentMethodLabels, m)).join(', ') ?? ''],
    ['Existing software', text('current_software')],
    ['Hardest part', text('hardest_part')],
    ['Features that matter most', (a.top_features as string[] | undefined)?.map((f) => label(featureLabels, f)).join(', ') ?? ''],
    ['Wants FRA action tracking', label(fraTrackerLabels, text('wants_fra_tracker'))],
    ['Expected price per building per year', price],
    ['Willing to pay', text('willing_to_pay')],
    ['Start', label(startTimingLabels, text('start_timing'))],
    ['Updates opt-in', text('marketing_consent')],
    ['Linked report ID', text('report_id')],
    ['utm_source', text('utm_source')],
    ['utm_medium', text('utm_medium')],
    ['utm_campaign', text('utm_campaign')],
    ['Received', formatLondonDateTime(input.createdAt)],
    ['Application ID', input.applicationId],
  ];

  return {
    subject,
    text: [subject, '', ...rows.map(([name, value]) => `${name}: ${singleLine(value)}`)].join('\n'),
    html: layout({ title: subject, bodyHtml: p(`<strong>${escapeHtml(subject)}</strong>`) + detailsTable(rows) }),
  };
}
