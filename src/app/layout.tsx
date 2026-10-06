import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { JsonLd } from '@/components/site/JsonLd';
import { SkipLink } from '@/components/site/SkipLink';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={inter.variable}>
      <body>
        <SkipLink />
        <Header />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <JsonLd data={organizationJsonLd()} />
        {/* Cookieless analytics. Nothing is loaded if no domain is set. */}
        {plausibleDomain ? <Script defer data-domain={plausibleDomain} src="https://plausible.io/js/script.js" /> : null}
      </body>
    </html>
  );
}
