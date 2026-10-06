import { NextResponse, type NextRequest } from 'next/server';
import { buildCsp, createNonce } from '@/lib/security-headers';

/**
 * Adds a Content-Security-Policy with a fresh nonce to every page (PRD section 13). Next.js reads the nonce from the
 * header and puts it on its own scripts. Pages that use a nonce are rendered on each request, not at build time.
 */
export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildCsp({
    nonce,
    isDev: process.env.NODE_ENV === 'development',
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: not the API, Next.js static files, or the favicon.
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
