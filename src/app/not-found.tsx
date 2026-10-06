import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/site/Section';

// Next.js already adds `noindex` to a 404 page.
export const metadata: Metadata = { title: 'Page not found' };

/** F11: custom 404 page. */
export default function NotFound() {
  return (
    <Section width="reading" className="py-12 md:py-16">
      <h1>Page not found</h1>
      <p className="mt-4 text-lg">We can&apos;t find that page. Check the address, or go to the home page or the free checker.</p>
      <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/">Home page</Link>
        <Link href="/checker">Free checker</Link>
      </p>
    </Section>
  );
}
