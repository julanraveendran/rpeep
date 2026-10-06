/** Dates and file names for reports and emails. Always Europe/London, always computed on the server (PRD section 9D). */

const LONDON = 'Europe/London';

/** "6 October 2026" */
export function formatUkDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: LONDON }).format(date);
}

/** "2026-10-06" */
export function londonIsoDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: LONDON }).format(date);
}

/** "6 October 2026, 16:04" for the founder notification. */
export function formatLondonDateTime(date: Date): string {
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: LONDON }).format(date);
  return `${formatUkDate(date)}, ${time}`;
}

/** Lower-case letters, digits and single hyphens only, at most 40 characters. */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

/** `RPEEP-scope-report-{reference-slug or 'building'}-{YYYY-MM-DD}.pdf` (PRD section 9B). */
export function reportFileName(buildingRef: string | null | undefined, date: Date): string {
  const slug = buildingRef ? slugify(buildingRef) : '';
  return `RPEEP-scope-report-${slug || 'building'}-${londonIsoDate(date)}.pdf`;
}
