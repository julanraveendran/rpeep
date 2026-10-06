import Link from 'next/link';
import { Section } from '@/components/site/Section';
import { pages } from '@/content/seo';
import { contact } from '@/content/site';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata(pages.unsubscribe, { noindex: true });

const messages = {
  ok: { title: "You've been unsubscribed.", text: null },
  invalid: { title: "This link isn't valid.", text: `Email ${contact.email} and we'll remove you.` },
  error: { title: 'Something went wrong.', text: `Please try the link again, or email ${contact.email} and we'll remove you.` },
} as const;

/** F9: the page an unsubscribe link lands on. The work is done by /api/unsubscribe (PRD section 12). */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ status?: string | string[] }> }) {
  const { status } = await searchParams;
  const key = status === 'ok' || status === 'error' ? status : 'invalid';
  const message = messages[key];
  return (
    <Section width="reading" className="py-12 md:py-16">
      <h1>{message.title}</h1>
      {message.text ? <p className="mt-4 text-lg">{message.text}</p> : null}
      <p className="mt-6">
        <Link href="/">Back to the home page</Link>
      </p>
    </Section>
  );
}
