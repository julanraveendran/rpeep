import { LegalPage } from '@/components/site/LegalPage';
import { privacy } from '@/content/legal';
import { pages } from '@/content/seo';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata(pages.privacy);

export default function Page() {
  return <LegalPage document={privacy} />;
}
