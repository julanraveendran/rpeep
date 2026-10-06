'use client';

import { useEffect } from 'react';
import { contact } from '@/content/site';

/**
 * F11: shown when a page fails to render or a client component throws. The error goes to Sentry, with personal data
 * removed. This file is part of every page's JavaScript, so it uses plain elements, not the shared Button and Section.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    import('@/lib/sentry-client').then((sentry) => sentry.captureClientException(error)).catch(() => {});
  }, [error]);

  return (
    <div className="section-y bg-white">
      <div className="container-reading">
        <h1>Something went wrong</h1>
        <p className="mt-4 text-lg">Please try again. If it keeps happening, email {contact.email}.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-button border-2 border-accent bg-accent px-5 py-2.5 text-base font-semibold text-white hover:border-[#9a3412] hover:bg-[#9a3412]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
