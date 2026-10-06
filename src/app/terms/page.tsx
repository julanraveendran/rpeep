import { LegalPage } from '@/components/site/LegalPage';
import { terms } from '@/content/legal';
import { pages } from '@/content/seo';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata(pages.terms);

export default function Page() {
  return <LegalPage document={terms} />;
}
