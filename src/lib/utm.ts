/**
 * UTM parameters from the landing URL, kept in `sessionStorage` under `rpeep-utm-v1` and sent with the report and pilot
 * requests (PRD section 9A, "Hidden fields"). Client side only.
 */

export const UTM_STORAGE_KEY = 'rpeep-utm-v1';

export type Utm = { source: string | null; medium: string | null; campaign: string | null };

export const EMPTY_UTM: Utm = { source: null, medium: null, campaign: null };

const clean = (value: string | null): string | null => {
  const trimmed = value?.trim().slice(0, 200);
  return trimmed ? trimmed : null;
};

/** The UTM values in a query string, or `null` if it has none. */
export function parseUtm(search: string): Utm | null {
  const params = new URLSearchParams(search);
  const utm: Utm = { source: clean(params.get('utm_source')), medium: clean(params.get('utm_medium')), campaign: clean(params.get('utm_campaign')) };
  return utm.source || utm.medium || utm.campaign ? utm : null;
}

/** Saves the UTM values in the URL, if there are any. Values from an earlier page in this session are replaced only by new ones. */
export function captureUtm(search: string): void {
  const utm = parseUtm(search);
  if (!utm) return;
  try {
    window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // Storage blocked: attribution is optional.
  }
}

export function readUtm(): Utm {
  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return EMPTY_UTM;
    const parsed = JSON.parse(raw) as Partial<Record<keyof Utm, unknown>>;
    const text = (value: unknown) => (typeof value === 'string' ? clean(value) : null);
    return { source: text(parsed.source), medium: text(parsed.medium), campaign: text(parsed.campaign) };
  } catch {
    return EMPTY_UTM;
  }
}
