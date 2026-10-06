import { LegalPage } from '@/components/site/LegalPage';
import { accessibility } from '@/content/legal';
import { pages } from '@/content/seo';
import { buildMetadata } from '@/lib/metadata';

export const metadata = buildMetadata(pages.accessibility);

export default function Page() {
  return <LegalPage document={accessibility} />;
}
