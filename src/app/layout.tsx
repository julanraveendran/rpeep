import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { CtaTracker } from '@/components/site/CtaTracker';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { JsonLd } from '@/components/site/JsonLd';
import { SkipLink } from '@/components/site/SkipLink';
import { UtmCapture } from '@/components/site/UtmCapture';
import { pages } from '@/content/seo';
import { site } from '@/content/site';
import { buildMetadata } from '@/lib/metadata';
import { getSiteUrl } from '@/lib/site-url';
import { organizationJsonLd } from '@/lib/structured-data';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  ...buildMetadata(pages.home),
  metadataBase: new URL(getSiteUrl()),
  applicationName: site.name,
};

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The nonce from src/proxy.ts. Reading it makes every page render per request, which a nonce needs.
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang="en-GB" className={inter.variable}>
      <body>
        <SkipLink />
        <UtmCapture />
        <CtaTracker />
        <Header />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <JsonLd data={organizationJsonLd()} />
        {/* Cookieless analytics. Nothing is loaded if no domain is set. */}
        {plausibleDomain ? <Script defer nonce={nonce} data-domain={plausibleDomain} src="https://plausible.io/js/script.js" /> : null}
      </body>
    </html>
  );
}
