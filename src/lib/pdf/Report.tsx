/**
 * The branded A4 report (PRD section 9D), rendered on the server with @react-pdf/renderer.
 *
 * Page 1 is the summary for every result. Page 2 depends on the result: duties for a building in scope, what is still
 * needed when we cannot confirm, or the other-duties note when it is not in scope. Page 3 is the readiness check, only if
 * it was completed. Sources and the full disclaimer close the last page. All user input is rendered as plain text.
 */

import path from 'node:path';
import { Circle, Document, Font, Link, Page, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import { describeAnswer, scopeQuestions } from '@/content/questions';
import { readinessQuestion } from '@/content/questions';
import { duties, missingCopy, noteCopy, reasonCopy, resultHeadlines } from '@/content/regulations';
import { company, contact, links, site } from '@/content/site';
import { askedQuestions } from '@/lib/checker/state';
import { formatUkDate } from '@/lib/report/format';
import type { ReportData } from '@/lib/report/types';
import type { ScopeStatus } from '@/lib/scope/engine';

// ---------------------------------------------------------------------------
// Fonts: Inter from /public/fonts (Regular, SemiBold, Bold), embedded in the PDF.
// ---------------------------------------------------------------------------

const fontDir = path.join(process.cwd(), 'public', 'fonts');
Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(fontDir, 'Inter-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontDir, 'Inter-SemiBold.ttf'), fontWeight: 600 },
    { src: path.join(fontDir, 'Inter-Bold.ttf'), fontWeight: 700 },
  ],
});

// Never hyphenate: a hyphen added inside a URL or a regulation number would change what it says.
Font.registerHyphenationCallback((word) => [word]);

/**
 * A building reference or organisation name can be one very long word, which would run off the page.
 * Allow a break after every 30 characters of an unbroken run. User input is rendered as plain text only.
 */
function breakable(text: string): string {
  return text.replace(/\S{30,}/g, (run) => run.match(/.{1,30}/g)?.join(' ') ?? run);
}

// ---------------------------------------------------------------------------
// Design tokens (PRD section 5)
// ---------------------------------------------------------------------------

const colour = {
  navy: '#0F2A44',
  ink: '#1F2937',
  muted: '#4B5563',
  border: '#E5E7EB',
  surface: '#F7F8FA',
  success: '#15803D',
  warning: '#B45309',
  neutral: '#475569',
  white: '#FFFFFF',
} as const;

const MM = 2.8346; // points per millimetre

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: colour.ink,
    paddingTop: 20 * MM,
    paddingLeft: 20 * MM,
    paddingRight: 20 * MM,
    paddingBottom: 26 * MM,
  },
  brandBar: {
    backgroundColor: colour.navy,
    color: colour.white,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandName: { fontSize: 14, fontWeight: 700, color: colour.white },
  brandUrl: { fontSize: 9, color: colour.white },
  title: { fontSize: 24, fontWeight: 700, color: colour.navy, marginBottom: 12 },
  h2: { fontSize: 15, fontWeight: 700, color: colour.navy, marginTop: 16, marginBottom: 8 },
  metaRow: { flexDirection: 'row', marginBottom: 2 },
  metaLabel: { width: 78, fontWeight: 600, color: colour.muted },
  metaValue: { flex: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { color: colour.white, fontWeight: 700, fontSize: 11, marginLeft: 6 },
  headline: { fontSize: 15, fontWeight: 700, color: colour.navy, marginTop: 10 },
  bullet: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { width: 12 },
  bulletText: { flex: 1 },
  note: { backgroundColor: colour.surface, borderLeftWidth: 3, borderLeftColor: colour.navy, padding: 8, marginTop: 8 },
  tableHead: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: colour.navy, paddingBottom: 4, fontWeight: 700, color: colour.navy },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: colour.border, paddingVertical: 5 },
  colQuestion: { width: '58%', paddingRight: 8 },
  colAnswer: { width: '42%', fontWeight: 600 },
  dutyBox: { width: 12, height: 12, borderWidth: 1, borderColor: colour.ink, marginTop: 1, marginRight: 8 },
  dutyBody: { flex: 1, paddingRight: 8 },
  dutyTitle: { fontWeight: 700, color: colour.navy },
  dutyReg: { width: 52, textAlign: 'right', fontWeight: 600 },
  bold: { fontWeight: 700 },
  semibold: { fontWeight: 600 },
  small: { fontSize: 8.5, color: colour.muted },
  sources: { marginTop: 18, paddingTop: 10, borderTopWidth: 1, borderTopColor: colour.border },
  footer: {
    position: 'absolute',
    bottom: 12 * MM,
    left: 20 * MM,
    right: 20 * MM,
    fontSize: 8,
    color: colour.muted,
    textAlign: 'center',
   
    borderTopWidth: 0.75,
    borderTopColor: colour.border,
    paddingTop: 6,
  },
});

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

const badgeColour: Record<ScopeStatus, string> = {
  in_scope: colour.success,
  not_in_scope: colour.neutral,
  cannot_confirm: colour.warning,
};

const badgeLabel: Record<ScopeStatus, string> = {
  in_scope: 'In scope',
  not_in_scope: 'Not in scope',
  cannot_confirm: "Can't confirm yet",
};

/** Shape plus text, never colour alone: a check, a minus or a question mark inside a circle. */
function StatusIcon({ status }: { status: ScopeStatus }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke={colour.white} strokeWidth={2} fill="none" />
      {status === 'in_scope' ? <Path d="M7 12.5l3.2 3.2L17 9" stroke={colour.white} strokeWidth={2.2} fill="none" /> : null}
      {status === 'not_in_scope' ? <Path d="M7 12h10" stroke={colour.white} strokeWidth={2.2} fill="none" /> : null}
      {status === 'cannot_confirm' ? (
        <>
          <Path d="M9.4 9.4a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.2-2.6 4" stroke={colour.white} strokeWidth={2} fill="none" />
          <Circle cx={12} cy={17.6} r={1.1} fill={colour.white} />
        </>
      ) : null}
    </Svg>
  );
}

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <View>
      {items.map((item) => (
        <View key={item} style={styles.bullet} wrap={false}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function PageFooter({ engineVersion }: { engineVersion: string }) {
  return (
    <Text
      fixed
      style={styles.footer}
      render={({ pageNumber, totalPages }) => `${site.name} · Guidance only, not legal advice · Engine v${engineVersion} · Page ${pageNumber} of ${totalPages}`}
    />
  );
}

function BrandBar({ title }: { title: string }) {
  return (
    <View style={styles.brandBar}>
      <Text style={styles.brandName}>{site.name}</Text>
      <Text style={styles.brandUrl}>{title}</Text>
    </View>
  );
}

/** Sources and the full disclaimer (PRD section 9D, "Final section"). Closes the last page. */
function SourcesAndDisclaimer() {
  return (
    <View style={styles.sources} wrap={false}>
      <Text style={styles.bold}>Sources</Text>
      <Text style={{ marginTop: 3 }}>{links.regulationsTitle}</Text>
      <Link src={links.regulations} style={{ color: colour.navy }}>
        {links.regulations}
      </Link>
      <Text style={[styles.bold, { marginTop: 10 }]}>Disclaimer</Text>
      <Text style={{ marginTop: 3 }}>
        This report is guidance based on your answers and on the Fire Safety (Residential Evacuation Plans) (England) Regulations 2025. It is not legal
        advice. Responsibility for compliance remains with the Responsible Person. Confirm the scope and your duties with a competent fire safety
        professional.
      </Text>
      <Text style={[styles.small, { marginTop: 10 }]}>
        {site.name} · {contact.email}
        {company.legalForm === 'limited_company' ? ` · ${company.legalEntityName}, company number ${company.companyNumber}` : ''}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

function SummaryPage({ report, closing }: { report: ReportData; closing: boolean }) {
  const { scope, answers } = report;
  const { answered } = askedQuestions(answers);
  const reasons = scope.reasons.map((code) => reasonCopy[code]);
  const notes = scope.notes.map((code) => noteCopy[code]);

  return (
    <Page size="A4" style={styles.page}>
      <BrandBar title="RPEEP Scope Report" />
      <Text style={styles.title}>RPEEP Scope Report</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Building</Text>
        <Text style={styles.metaValue}>{report.buildingRef ? breakable(report.buildingRef) : 'Not given'}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Date</Text>
        <Text style={styles.metaValue}>{formatUkDate(report.createdAt)}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Prepared for</Text>
        <Text style={styles.metaValue}>
          {breakable(report.firstName)}, {breakable(report.organisation)}
        </Text>
      </View>

      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: badgeColour[scope.status] }]}>
          <StatusIcon status={scope.status} />
          <Text style={styles.badgeText}>{badgeLabel[scope.status]}</Text>
        </View>
      </View>
      <Text style={styles.headline}>{resultHeadlines[scope.status]}</Text>

      {reasons.length > 0 ? (
        <>
          <Text style={styles.h2}>Why</Text>
          <Bullets items={reasons} />
        </>
      ) : null}

      {notes.map((note) => (
        <View key={note} style={styles.note} wrap={false}>
          <Text>{note}</Text>
        </View>
      ))}

      <Text style={styles.h2}>Your answers</Text>
      <View style={styles.tableHead}>
        <Text style={styles.colQuestion}>Question</Text>
        <Text style={{ width: '42%' }}>Answer</Text>
      </View>
      {answered.map((id) => (
        <View key={id} style={styles.tableRow} wrap={false}>
          <Text style={styles.colQuestion}>{scopeQuestions[id].question}</Text>
          <Text style={styles.colAnswer}>{describeAnswer(id, answers) ?? 'Not known'}</Text>
        </View>
      ))}

      {closing ? <SourcesAndDisclaimer /> : null}
      <PageFooter engineVersion={scope.engineVersion} />
    </Page>
  );
}

function SecondPage({ report, closing }: { report: ReportData; closing: boolean }) {
  const { scope } = report;
  return (
    <Page size="A4" style={styles.page}>
      <BrandBar title="RPEEP Scope Report" />

      {scope.status === 'in_scope' ? (
        <>
          <Text style={[styles.h2, { marginTop: 0 }]}>Duties that apply</Text>
          <View style={styles.tableHead}>
            <Text style={{ width: 20 }} />
            <Text style={{ flex: 1 }}>Duty</Text>
            <Text style={styles.dutyReg}>Regulation</Text>
          </View>
          {duties.map((duty) => (
            <View key={duty.id} style={styles.tableRow} wrap={false}>
              <View style={styles.dutyBox} />
              <View style={styles.dutyBody}>
                <Text style={styles.dutyTitle}>{duty.title}</Text>
                <Text>{duty.plainEnglish}</Text>
              </View>
              <Text style={styles.dutyReg}>{duty.regulation}</Text>
            </View>
          ))}
        </>
      ) : null}

      {scope.status === 'cannot_confirm' ? (
        <>
          <Text style={[styles.h2, { marginTop: 0 }]}>What we still need</Text>
          <Bullets items={scope.missing.map((code) => missingCopy[code])} />
          <Text style={{ marginTop: 10 }}>
            Run the checker again at <Text style={styles.semibold}>{`${site.domain}/checker`}</Text>
          </Text>
        </>
      ) : null}

      {scope.status === 'not_in_scope' ? (
        <>
          <Text style={[styles.h2, { marginTop: 0 }]}>What this means</Text>
          {scope.notes.includes('OTHER_DUTIES') ? <Text>{noteCopy.OTHER_DUTIES}</Text> : null}
          <Text style={{ marginTop: 8 }}>If any answer changes, check again.</Text>
        </>
      ) : null}

      {closing ? <SourcesAndDisclaimer /> : null}
      <PageFooter engineVersion={scope.engineVersion} />
    </Page>
  );
}

const nextSteps = [
  'Confirm the scope with a competent fire safety professional.',
  'Ask your local fire and rescue service which method it wants for resident information.',
  'Start identifying residents and record every attempt.',
];

function ReadinessPage({ report }: { report: ReportData }) {
  const readiness = report.readiness;
  if (!readiness) return null;
  const { result } = readiness;
  return (
    <Page size="A4" style={styles.page}>
      <BrandBar title="RPEEP Scope Report" />
      <Text style={[styles.h2, { marginTop: 0 }]}>Readiness check</Text>
      <Text style={{ fontSize: 18, fontWeight: 700, color: colour.navy }}>{result.summary}</Text>

      <Text style={styles.h2}>Gaps to work on</Text>
      {result.gaps.length === 0 ? (
        <Text>You answered &quot;Yes&quot; to every question.</Text>
      ) : (
        result.gaps.map((id) => (
          <View key={id} style={styles.tableRow} wrap={false}>
            <Text style={{ width: 26, fontWeight: 700, color: colour.navy }}>{id}</Text>
            <Text style={{ flex: 1 }}>{readinessQuestion(id).gapText}</Text>
          </View>
        ))
      )}

      <Text style={styles.h2}>Suggested next steps</Text>
      <Bullets items={nextSteps} />

      <SourcesAndDisclaimer />
      <PageFooter engineVersion={report.scope.engineVersion} />
    </Page>
  );
}

/** The whole report. */
export function ReportDocument({ report }: { report: ReportData }) {
  const hasReadiness = report.readiness !== null;
  return (
    <Document
      title={`RPEEP Scope Report${report.buildingRef ? ` – ${report.buildingRef}` : ''}`}
      author={site.name}
      subject="Guidance only, not legal advice"
      creator={site.name}
      producer={site.name}
      language="en-GB"
    >
      <SummaryPage report={report} closing={false} />
      <SecondPage report={report} closing={!hasReadiness} />
      {hasReadiness ? <ReadinessPage report={report} /> : null}
    </Document>
  );
}
