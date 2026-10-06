import { Checker } from '@/components/checker/Checker';
import { JsonLd } from '@/components/site/JsonLd';
import { pages } from '@/content/seo';
import { buildMetadata } from '@/lib/metadata';
import { webApplicationJsonLd } from '@/lib/structured-data';

export const metadata = buildMetadata(pages.checker);

export default function CheckerPage() {
  return (
    <>
      <Checker />
      <JsonLd data={webApplicationJsonLd()} />
    </>
  );
}
