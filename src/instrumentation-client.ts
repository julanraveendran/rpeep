/**
 * Runs in the browser before the app starts. Sentry is loaded after the page has loaded, so it adds nothing to the
 * first-load JavaScript (PRD section 14D). Errors that happen before it is ready are kept and sent once it starts.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  const early: unknown[] = [];
  const onError = (event: ErrorEvent) => early.push(event.error ?? event.message);
  const onRejection = (event: PromiseRejectionEvent) => early.push(event.reason);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  const start = () => {
    import('./lib/sentry-client')
      .then(({ initSentryClient, captureClientException }) => {
        if (!initSentryClient(dsn)) return;
        window.removeEventListener('error', onError);
        window.removeEventListener('unhandledrejection', onRejection);
        for (const error of early.splice(0)) captureClientException(error);
      })
      .catch(() => {
        // Sentry could not load (blocked): nothing else to do.
      });
  };

  if (document.readyState === 'complete') window.setTimeout(start, 0);
  else window.addEventListener('load', () => window.setTimeout(start, 0), { once: true });
}
