import { describe, expect, it } from 'vitest';
import { faqs } from './faq';
import { data, freeTool, hero, how, law, lawCards, lawWideCard, pilot, whyBuilding, whyHard } from './home';
import { dutyById, regulationLabel } from './regulations';
import { company, founder } from './site';

const bannedWords = ['revolutionary', 'game-changing', 'seamless', 'cutting-edge', 'guarantee compliance', 'makes you compliant'];
const everything = JSON.stringify({ hero, law, whyHard, how, freeTool, pilot, whyBuilding, data, faqs, lawCards, lawWideCard });

describe('landing page copy (PRD section 6)', () => {
  it('has the exact hero copy', () => {
    expect(hero.eyebrow).toBe('For Responsible Persons in England');
    expect(hero.title).toBe('Residential PEEPs, handled properly.');
    expect(hero.primaryCta).toBe('Check if your building is in scope (2 min)');
    expect(hero.secondaryCta).toBe('Join the pilot');
    expect(hero.trustLine).toBe('Free · No account needed · Data hosted in the UK · Built by a fire safety professional');
    expect(hero.subheading).toBe(
      'Since 6 April 2026, Responsible Persons for many residential buildings must identify residents who may need help to evacuate, offer person-centred fire risk assessments and share key information with the fire service. [BRAND] will help you do it, and evidence that you did.',
    );
  });

  it('has six duty cards with the PRD regulation badges, plus the building plan card', () => {
    expect(lawCards.map((card) => [card.title, card.badge])).toEqual([
      ['Identify residents', 'Reg 5'],
      ['Offer a person-centred fire risk assessment', 'Reg 6'],
      ['Put reasonable measures in place', 'Reg 7'],
      ['Agree and record an emergency evacuation statement', 'Reg 8'],
      ['Review every 12 months', 'Reg 9'],
      ['Share information with the fire service, with consent', 'Reg 10'],
    ]);
    expect([lawWideCard.title, lawWideCard.badge]).toEqual(['Building emergency evacuation plan', 'Reg 13']);
  });

  it('takes each card text from the matching duty in PRD section 7D', () => {
    expect([...lawCards, lawWideCard].map((card) => dutyById(card.dutyId).regulation)).toEqual(['4, 5', '6', '7', '8', '9', '10', '13']);
  });

  it('has the three "why it is hard" items, seven steps, three pilot benefits and four data bullets', () => {
    expect(whyHard.items).toHaveLength(3);
    expect(how.steps.map((step) => step.title)).toEqual([
      'Set up your building',
      'Find residents',
      'Record consent',
      'Carry out the person-centred assessment',
      'Agree the emergency evacuation statement',
      'Share with the fire service',
      'Automatic review reminders',
    ]);
    expect(how.label).toBe('In development — pilot opening soon');
    expect(pilot.benefits).toEqual(['Free setup for your first buildings', 'Founding price held for 12 months', 'Shape the product with your feedback']);
    expect(data.bullets).toHaveLength(4);
  });

  it('does not state a price on the pilot section', () => {
    expect(JSON.stringify(pilot)).not.toMatch(/£|\bprice of\b|\d+\s?(pounds|GBP)/i);
  });

  it('has exactly eight FAQ questions, in the PRD order, each citing a regulation or giving the PRD wording', () => {
    expect(faqs.map((faq) => faq.question)).toEqual([
      'Which buildings are covered?',
      'Does this apply in Wales, Scotland or Northern Ireland?',
      'Who is the Responsible Person?',
      'Who counts as a "relevant resident"?',
      'Do residents have to take part?',
      'How often must plans be reviewed?',
      'What is a building emergency evacuation plan?',
      'Is the checker legal advice?',
    ]);
    const cited = faqs.filter((faq) => /\(regulations? [\d(), and]+/.test(faq.answer));
    expect(cited.map((faq) => faq.question)).toEqual([
      'Which buildings are covered?',
      'Does this apply in Wales, Scotland or Northern Ireland?',
      'Who counts as a "relevant resident"?',
      'Do residents have to take part?',
      'How often must plans be reviewed?',
      'What is a building emergency evacuation plan?',
    ]);
  });

  it('uses the verbatim FAQ answers the PRD gives', () => {
    const answer = (question: string) => faqs.find((faq) => faq.question === question)?.answer;
    expect(answer('Who is the Responsible Person?')).toBe(
      'Usually the building owner, landlord or managing agent — the person defined as the responsible person under the Fire Safety Order.',
    );
    expect(answer('Do residents have to take part?')).toBe(
      'The Responsible Person must offer an assessment; residents can decline. Information goes to the fire service only with explicit consent (regulation 10(2)).',
    );
    expect(answer('Is the checker legal advice?')).toBe('No. It is guidance based on the regulations. Always confirm with a competent fire safety professional.');
    expect(answer('Does this apply in Wales, Scotland or Northern Ireland?')).toContain('The regulations apply in England only');
  });

  it('puts the citation inside the sentence, with a single full stop', () => {
    for (const faq of faqs) expect(faq.answer, faq.question).not.toMatch(/\.\s\(regulation|\.\)\./);
  });

  it('does not use the banned words', () => {
    for (const word of bannedWords) expect(everything.toLowerCase()).not.toContain(word);
  });

  it('does not name an employer or add statistics, testimonials or user numbers', () => {
    expect(whyBuilding.text).not.toMatch(/testimonial|\d+%|\d+ (users|customers|landlords)/i);
    expect(whyBuilding.signature).toBe(`${founder.firstName}, Founder`);
    expect(company.legalEntityName.length).toBeGreaterThan(0);
  });

  it('mentions the law came into force on 6 April 2026', () => {
    expect(law.intro).toBe(
      'The Fire Safety (Residential Evacuation Plans) (England) Regulations 2025 came into force on 6 April 2026.',
    );
  });
});

describe('regulationLabel', () => {
  it('words the regulation column for legal-detail panels', () => {
    expect(regulationLabel('6')).toBe('regulation 6');
    expect(regulationLabel('4, 5')).toBe('regulations 4 and 5');
    expect(regulationLabel('1, 2, 3')).toBe('regulations 1, 2 and 3');
  });
});
