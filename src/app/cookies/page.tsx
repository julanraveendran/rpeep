import { LegalPage } from '@/components/site/LegalPage';
import { cookies } from '@/content/legal';
import { pages } from '@/content/seo';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata(pages.cookies);

export default function Page() {
  return <LegalPage document={cookies} />;
}
