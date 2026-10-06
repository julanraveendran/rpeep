import { CTA } from '@/components/site/CTA';
import { JsonLd } from '@/components/site/JsonLd';
import { renderInline } from '@/components/site/ContentSections';
import { Section } from '@/components/site/Section';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { LegalDetail } from '@/components/ui/legal-detail';
import { faqs } from '@/content/faq';
import { freeTool } from '@/content/home';
import { guideIntro, guideSections, guideTitle } from '@/content/guide';
import { duties, measurementRules, regulationLabel, scopeRules } from '@/content/regulations';
import { pages } from '@/content/seo';
import { guideLastReviewed, links } from '@/content/site';
import { buildMetadata } from '@/lib/metadata';
import { formatUkDate } from '@/lib/report/format';
import { articleJsonLd } from '@/lib/structured-data';

export const metadata = buildMetadata(pages.guide);

const cell = 'border-b border-border px-3 py-2 align-top';
const head = 'border-b-2 border-navy-900 px-3 py-2 align-bottom font-semibold text-navy-900';

/** F7: the plain-English regulations guide (PRD section 14B). Reading width, table of contents, regulation numbers throughout. */
export default function GuidePage() {
  return (
    <Section width="reading" aria-labelledby="guide-title" className="py-12 md:py-16">
      <article>
        <h1 id="guide-title">{guideTitle}</h1>
        <p className="mt-2 text-sm text-muted">Last reviewed {formatUkDate(new Date(guideLastReviewed))}</p>
        <p className="mt-6 text-lg">{guideIntro}</p>
        <p className="mt-4">
          <a href={links.regulations} target="_blank" rel="noopener noreferrer">
            Read the regulations on legislation.gov.uk<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>

        <nav aria-labelledby="toc-heading" className="mt-8 rounded-card border border-border bg-surface p-5">
          <h2 id="toc-heading" className="text-lg">
            On this page
          </h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            {guideSections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.heading}</a>
              </li>
            ))}
          </ol>
        </nav>

        {guideSections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="mt-12">
            <h2 id={`${section.id}-heading`}>{section.heading}</h2>
            <div className="mt-4 grid gap-4">
              {section.blocks.map((block, index) => {
                switch (block.type) {
                  case 'p':
                    return <p key={index}>{renderInline(block.text)}</p>;
                  case 'h3':
                    return (
                      <h3 key={index} className="mt-2">
                        {block.text}
                      </h3>
                    );
                  case 'ul':
                    return (
                      <ul key={index} className="list-disc space-y-1 pl-6">
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    );
                  case 'rules':
                    return (
                      <div key={index} className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scope rules">
                        <table className="w-full border-collapse text-left">
                          <caption className="sr-only">The three gates (R1 to R3) and three tests (C1 to C3) for scope</caption>
                          <thead>
                            <tr>
                              <th scope="col" className={head}>
                                Rule
                              </th>
                              <th scope="col" className={head}>
                                Condition
                              </th>
                              <th scope="col" className={head}>
                                Regulation
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {scopeRules.map((rule) => (
                              <tr key={rule.id}>
                                <th scope="row" className={`${cell} font-semibold`}>
                                  {rule.id}
                                </th>
                                <td className={cell}>{rule.condition}</td>
                                <td className={`${cell} tabular whitespace-nowrap`}>{rule.regulation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  case 'measure':
                    return (
                      <ul key={index} className="list-disc space-y-2 pl-6">
                        {measurementRules.map((rule) => (
                          <li key={rule.regulation}>
                            {rule.text.replace(/\.$/, '')} (regulation {rule.regulation}).
                          </li>
                        ))}
                      </ul>
                    );
                  case 'duties':
                    return (
                      <div key={index} className="grid gap-3">
                        {duties.map((duty) => (
                          <div key={duty.id} className="rounded-card border border-border p-4">
                            <h3 className="text-lg">
                              <span className="tabular mr-2 text-navy-700">{duty.id}</span>
                              {duty.title}
                              <span className="tabular ml-2 text-sm font-semibold text-muted">({regulationLabel(duty.regulation)})</span>
                            </h3>
                            <p className="mt-1">{duty.plainEnglish}</p>
                            <LegalDetail regulation={regulationLabel(duty.regulation)} className="mt-2">
                              <p>{duty.plainEnglish}</p>
                            </LegalDetail>
                          </div>
                        ))}
                      </div>
                    );
                  case 'faq':
                    return (
                      <Accordion key={index}>
                        {faqs.map((faq) => (
                          <AccordionItem key={faq.question} question={faq.question}>
                            <p>{faq.answer}</p>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    );
                  case 'cta':
                    return (
                      <div key={index}>
                        <CTA href="/checker" location="guide">
                          {freeTool.cta}
                        </CTA>
                      </div>
                    );
                }
              })}
            </div>
          </section>
        ))}
      </article>
      <JsonLd data={articleJsonLd()} />
    </Section>
  );
}
