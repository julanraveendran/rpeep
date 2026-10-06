/**
 * FAQ: PRD section 6, item 10. Answers come from PRD section 7 (see `regulations.ts`) and cite
 * regulation numbers. Used by the home page accordion, its FAQPage JSON-LD and the guide page.
 */

import { dutyById, scopeSummary } from '@/content/regulations';

export type Faq = { question: string; answer: string };

/** Put the citation inside the sentence: "... asks (regulation 9(3)–(4))." */
const cite = (sentence: string, citation: string) => `${sentence.replace(/\.$/, '')} (${citation}).`;

const relevantResident = dutyById('D1').plainEnglish.replace(/^Use reasonable endeavours to identify residents /, '');

export const faqs: readonly Faq[] = [
  {
    question: 'Which buildings are covered?',
    answer: cite(scopeSummary, 'regulations 1(3), 1(4), 2 and 3(1)'),
  },
  {
    question: 'Does this apply in Wales, Scotland or Northern Ireland?',
    answer: 'The regulations apply in England only (regulation 1(3)).',
  },
  {
    question: 'Who is the Responsible Person?',
    answer:
      'Usually the building owner, landlord or managing agent — the person defined as the responsible person under the Fire Safety Order.',
  },
  {
    question: 'Who counts as a "relevant resident"?',
    answer: cite(`A relevant resident is a resident ${relevantResident}`, 'regulation 4'),
  },
  {
    question: 'Do residents have to take part?',
    answer:
      'The Responsible Person must offer an assessment; residents can decline. Information goes to the fire service only with explicit consent (regulation 10(2)).',
  },
  {
    question: 'How often must plans be reviewed?',
    answer: cite(dutyById('D5').plainEnglish, 'regulation 9(3)–(4)'),
  },
  {
    question: 'What is a building emergency evacuation plan?',
    answer: cite(dutyById('D8').plainEnglish, 'regulation 13'),
  },
  {
    question: 'Is the checker legal advice?',
    answer: 'No. It is guidance based on the regulations. Always confirm with a competent fire safety professional.',
  },
];
