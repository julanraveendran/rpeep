import { PilotThanks } from '@/components/forms/PilotThanks';
import { pages } from '@/content/seo';
import { buildMetadata } from '@/lib/metadata';

// Not for search engines: it only makes sense straight after an application.
export const metadata = buildMetadata({ ...pages.pilot, path: '/pilot/thanks', title: `Thanks | ${pages.pilot.title}` }, { noindex: true });

export default function PilotThanksPage() {
  return <PilotThanks />;
}
