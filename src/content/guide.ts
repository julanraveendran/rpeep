/**
 * The plain-English guide at /rpeep-regulations-explained: PRD section 14B (1,200–1,800 words). Every section cites regulation numbers,
 * and every regulatory statement comes from `regulations.ts` or PRD section 7. Do not add legal claims that are not in the PRD.
 */

import { faqs } from '@/content/faq';
import { dutyById, duties, measurementRules, scopeRules, scopeSummary } from '@/content/regulations';
import { freeTool } from '@/content/home';
import { regulationsInForce, site } from '@/content/site';

export type GuideBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: readonly string[] }
  | { type: 'h3'; text: string }
  | { type: 'rules' }
  | { type: 'measure' }
  | { type: 'duties' }
  | { type: 'faq' }
  | { type: 'cta' };

export type GuideSection = { id: string; heading: string; blocks: readonly GuideBlock[] };

export const guideTitle = 'RPEEP regulations explained';

export const guideIntro =
  'This guide explains the Fire Safety (Residential Evacuation Plans) (England) Regulations 2025 (SI 2025/797) in plain English. Each section gives the regulation numbers, so you can check what it says against the official text on legislation.gov.uk. It is guidance, not legal advice.';

export const guideSections: readonly GuideSection[] = [
  {
    id: 'what-and-when',
    heading: 'What the regulations are and when they started',
    blocks: [
      {
        type: 'p',
        text: `The Fire Safety (Residential Evacuation Plans) (England) Regulations 2025 came into force on ${regulationsInForce}. They are SI 2025/797. The Grenfell Tower Inquiry recommended personal emergency evacuation plans for residents who need help to escape, and these regulations are the result.`,
      },
      {
        type: 'p',
        text: `On this site, RPEEP is shorthand for the residential personal emergency evacuation plans that the regulations require. ${site.name} is built to help you manage them.`,
      },
      {
        type: 'p',
        text: 'The regulations apply in England only (regulation 1(3)). Different rules apply in Wales, Scotland and Northern Ireland.',
      },
      {
        type: 'p',
        text: 'The duties fall on the Responsible Person. That is usually the building owner, landlord or managing agent — the person defined as the responsible person under the Fire Safety Order.',
      },
    ],
  },
  {
    id: 'which-buildings',
    heading: 'Which buildings are covered',
    blocks: [
      {
        type: 'p',
        text: 'A building is in scope when it passes three gates and meets at least one of three tests. The gates can only rule a building out. Any one of the tests rules it in. In short, in scope means R1 and R2 and R3 and (C1 or C2 or C3) in the table below.',
      },
      { type: 'rules' },
      { type: 'p', text: `${scopeSummary} (regulation 3(1)).` },
      { type: 'h3', text: 'How height and storeys are measured' },
      { type: 'measure' },
      {
        type: 'p',
        text: 'The boundaries are exact. A top storey that is 18.0 metres above ground level is in scope, because the test is "at least" 18 metres (regulation 3(1)(a)). A top storey that is 11.0 metres above ground level with a simultaneous evacuation strategy is not in scope, because the test is "more than" 11 metres (regulation 3(1)(c)). At 11.1 metres with a simultaneous evacuation strategy, the building is in scope. Six storeys does not meet the storey test, and seven does (regulation 3(1)(b)).',
      },
      {
        type: 'p',
        text: 'A temporary simultaneous evacuation strategy, for example during remediation works, counts as simultaneous. If your building is in scope only because of its current strategy, check the scope again when the strategy changes.',
      },
      {
        type: 'p',
        text: 'If you do not know the height, the number of storeys or the evacuation strategy, and the answer could still change the result, the free checker says it cannot confirm yet. It tells you what it needs and where to find it, for example in your fire risk assessment, fire strategy or building drawings.',
      },
      {
        type: 'p',
        text: 'A building in England with two or more homes that is not excluded, but falls below every threshold, is not in scope of these regulations (regulation 3(1)). Other duties under the Regulatory Reform (Fire Safety) Order 2005 still apply, including keeping a suitable and sufficient fire risk assessment.',
      },
    ],
  },
  {
    id: 'relevant-resident',
    heading: 'Who is a relevant resident',
    blocks: [
      {
        type: 'p',
        text: 'A relevant resident is a resident whose ability to evacuate without help is compromised by a cognitive or physical impairment or condition, where the flat is their only or main home (regulation 4).',
      },
      {
        type: 'p',
        text: 'The Responsible Person must use reasonable endeavours to identify these residents (regulation 5). Residents rarely tell landlords, so the duty is to make reasonable efforts, such as letters, notices in common areas and a simple way to self-refer, and to keep a record of every attempt.',
      },
      {
        type: 'p',
        text: "Where it applies, work with a resident's representative, such as a person with parental responsibility, a registered attorney or a Court of Protection deputy (regulation 11).",
      },
      {
        type: 'p',
        text: 'Residents do not have to take part. The Responsible Person must offer an assessment, and residents can decline (regulation 6).',
      },
    ],
  },
  {
    id: 'duties',
    heading: 'The nine duties',
    blocks: [
      {
        type: 'p',
        text: 'For a building in scope, the Responsible Person has the duties below. The regulation numbers are those of SI 2025/797 as made.',
      },
      { type: 'duties' },
    ],
  },
  {
    id: 'fire-service',
    heading: 'Sharing information with the fire service',
    blocks: [
      { type: 'p', text: `${dutyById('D6').plainEnglish.replace(/\.$/, '')} (regulation 10).` },
      {
        type: 'p',
        text: "Information goes to the fire service only with the resident's explicit consent (regulation 10(2)). Check how your local fire and rescue service wants to receive information, and record explicit consent before sharing anything (regulation 10).",
      },
      { type: 'p', text: 'Handle all this information in line with data protection law (regulation 12).' },
    ],
  },
  {
    id: 'building-plan',
    heading: 'Building emergency evacuation plans',
    blocks: [
      { type: 'p', text: `${dutyById('D8').plainEnglish.replace(/\.$/, '')} (regulation 13).` },
      {
        type: 'p',
        text: 'This plan is separate from the plans for individual residents. It covers the building as a whole.',
      },
    ],
  },
  {
    id: 'reviews',
    heading: 'Reviews',
    blocks: [
      { type: 'p', text: `${dutyById('D5').plainEnglish.replace(/\.$/, '')} (regulation 9(3)–(4)).` },
      {
        type: 'p',
        text: 'The building emergency evacuation plan also needs reviewing within 12 months and then at least every 12 months (regulation 13). Set up reminders for every review: within 12 months, then at least every 12 months (regulations 9 and 13).',
      },
    ],
  },
  {
    id: 'common-questions',
    heading: 'Common questions',
    blocks: [{ type: 'faq' }],
  },
  {
    id: 'check-your-building',
    heading: 'Check your building',
    blocks: [{ type: 'p', text: `${freeTool.text} ${freeTool.smallPrint}` }, { type: 'cta' }],
  },
];

/** Every piece of text on the page, for the word count and for tests. */
export function guideText(): string[] {
  const text: string[] = [guideTitle, guideIntro];
  for (const section of guideSections) {
    text.push(section.heading);
    for (const block of section.blocks) {
      switch (block.type) {
        case 'p':
        case 'h3':
          text.push(block.text);
          break;
        case 'ul':
          text.push(...block.items);
          break;
        case 'rules':
          text.push(...scopeRules.flatMap((rule) => [rule.id, rule.condition, rule.regulation]));
          break;
        case 'measure':
          text.push(...measurementRules.flatMap((rule) => [rule.text, rule.regulation]));
          break;
        case 'duties':
          text.push(...duties.flatMap((duty) => [duty.id, duty.title, duty.plainEnglish, duty.regulation]));
          break;
        case 'faq':
          text.push(...faqs.flatMap((faq) => [faq.question, faq.answer]));
          break;
        case 'cta':
          text.push(freeTool.cta);
          break;
      }
    }
  }
  return text;
}

export function guideWordCount(): number {
  return guideText().join(' ').split(/\s+/).filter(Boolean).length;
}
