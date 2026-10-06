import type { ReactNode } from 'react';
import type { LegalBlock, LegalSection } from '@/content/legal';

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Turns `[label](url)` in a text into a link. External links open in a new tab, with a hidden warning for screen readers. */
export function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, href] = match as unknown as [string, string, string];
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const external = /^https?:\/\//.test(href);
    parts.push(
      external ? (
        <a key={index} href={href} target="_blank" rel="noopener noreferrer">
          {label}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        <a key={index} href={href}>
          {label}
        </a>
      ),
    );
    last = index + whole.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Block({ block }: { block: LegalBlock }) {
  if (block.type === 'p') return <p>{renderInline(block.text)}</p>;
  if (block.type === 'ul') {
    return (
      <ul className="list-disc space-y-1 pl-6">
        {block.items.map((item) => (
          <li key={item}>{renderInline(item)}</li>
        ))}
      </ul>
    );
  }
  return (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={block.caption}>
      <table className="w-full border-collapse text-left text-base">
        <caption className="sr-only">{block.caption}</caption>
        <thead>
          <tr>
            {block.headers.map((header) => (
              <th key={header} scope="col" className="border-b-2 border-navy-900 px-3 py-2 align-bottom font-semibold text-navy-900">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row.join('|')}>
              {row.map((cell, index) =>
                index === 0 ? (
                  <th key={cell} scope="row" className="border-b border-border px-3 py-2 align-top font-semibold">
                    {cell}
                  </th>
                ) : (
                  <td key={cell} className="border-b border-border px-3 py-2 align-top">
                    {renderInline(cell)}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The sections of a reading page: an H2 for each, then its blocks. */
export function ContentSections({ sections }: { sections: readonly LegalSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="mt-10">
          <h2 id={`${section.id}-heading`}>{section.heading}</h2>
          <div className="mt-4 grid gap-4">
            {section.blocks.map((block, index) => (
              <Block key={index} block={block} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
