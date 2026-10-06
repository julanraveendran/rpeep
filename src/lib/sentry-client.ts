import * as Sentry from '@sentry/nextjs';
import { scrubBreadcrumb, scrubEvent, sentryDataCollection } from '@/lib/sentry-scrub';

let started = false;

/** Starts Sentry in the browser. Loaded lazily, after the page, so it is not part of the first-load JavaScript. */
export function initSentryClient(dsn: string | undefined = process.env.NEXT_PUBLIC_SENTRY_DSN): boolean {
  if (!dsn) return false;
  if (!started) {
    Sentry.init({
      dsn,
      dataCollection: sentryDataCollection,
      tracesSampleRate: 0,
      beforeSend: scrubEvent,
      beforeBreadcrumb: scrubBreadcrumb,
    });
    started = true;
  }
  return true;
}

export function captureClientException(error: unknown): void {
  if (initSentryClient()) Sentry.captureException(error);
}
