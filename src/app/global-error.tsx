'use client';

import { useEffect } from 'react';
import { contact } from '@/content/site';
import './globals.css';

/** Shown when the root layout itself fails. It replaces the layout, so it has to supply `<html>` and `<body>`. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    import('@/lib/sentry-client').then((sentry) => sentry.captureClientException(error)).catch(() => {});
  }, [error]);

  return (
    <html lang="en-GB">
      <body>
        <main className="container-reading py-16">
          <h1>Something went wrong</h1>
          <p className="mt-4 text-lg">Please try again. If it keeps happening, email {contact.email}.</p>
          <button type="button" onClick={reset} className="mt-6 min-h-11 cursor-pointer rounded-button border-2 border-accent bg-accent px-5 py-2.5 font-semibold text-white">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
