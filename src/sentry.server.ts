import * as Sentry from '@sentry/nextjs';
import { setErrorReporter } from '@/lib/log';
import { scrubBreadcrumb, scrubEvent, sentryDataCollection } from '@/lib/sentry-scrub';

/** Starts Sentry on the server, but only if `SENTRY_DSN` is set (it is optional in development). */
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    dataCollection: sentryDataCollection,
    tracesSampleRate: 0,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });
  // Errors we catch and log ourselves (a failed email, say) also go to Sentry, with their context as a tag.
  setErrorReporter((context, error) => {
    Sentry.captureException(error, { tags: { context } });
  });
}
