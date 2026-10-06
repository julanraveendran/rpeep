/**
 * The only place that talks to Plausible (PRD section 14C). It does nothing if
 * Plausible is blocked or not loaded, and it never receives names, emails or
 * organisation names.
 */

type Props = Record<string, string | number | boolean>;

export type AnalyticsEvents = {
  cta_clicked: { location: string };
  checker_started: undefined;
  question_answered: { step: string };
  checker_completed: { status: string };
  readiness_completed: { score: number };
  report_requested: { status: string };
  report_downloaded: undefined;
  pilot_started: undefined;
  pilot_submitted: { orgType: string; buildingsBand: string; priceBand: string; willingToPay: boolean };
};

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void;
  }
}

type TrackArgs<E extends keyof AnalyticsEvents> = AnalyticsEvents[E] extends undefined
  ? []
  : [props: AnalyticsEvents[E]];

export function track<E extends keyof AnalyticsEvents>(event: E, ...args: TrackArgs<E>): void {
  if (typeof window === 'undefined') return;
  try {
    const props = args[0] as Props | undefined;
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    // Analytics must never break the page.
  }
}
