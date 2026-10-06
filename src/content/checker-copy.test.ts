import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkerIntro, describeAnswer, disclaimer, NOT_KNOWN, resultCopy, scopeQuestions } from './questions';
import { resultHeadlines } from './regulations';

const prd = readFileSync(new URL('../../docs/PRD.md', import.meta.url), 'utf8');
const quoted = (text: string) => `"${text}"`;

describe('checker copy matches docs/PRD.md word for word (section 8A)', () => {
  it('intro', () => {
    expect(prd).toContain(quoted(checkerIntro.title));
    expect(prd).toContain(quoted(checkerIntro.text));
    expect(prd).toContain(quoted(checkerIntro.referenceLabel));
    expect(prd).toContain(`Helper: ${quoted(checkerIntro.referenceHelper)}`);
    expect(prd).toContain(`Max ${checkerIntro.referenceMaxLength} characters`);
    expect(prd).toContain(`Button: ${quoted(checkerIntro.start)}`);
  });

  it.each(Object.values(scopeQuestions))('$id: question, options and help text', (question) => {
    expect(prd).toContain(quoted(question.question));
    if (question.kind === 'radio') {
      for (const option of question.options) expect(prd, option.label).toContain(quoted(option.label));
    } else {
      expect(prd).toContain(`unit ${quoted(question.unit)}`);
    }
    for (const help of Array.isArray(question.help) ? question.help : [question.help]) expect(prd, help).toContain(quoted(help));
  });

  it('lists the options of each radio question in the PRD order', () => {
    expect(scopeQuestions.excludedPremises.kind === 'radio' && scopeQuestions.excludedPremises.options.map((o) => o.label)).toEqual(['No', 'Yes']);
    expect(scopeQuestions.evacuationStrategy.kind === 'radio' && scopeQuestions.evacuationStrategy.options).toHaveLength(5);
  });

  it('result actions and the disclaimer (section 8B)', () => {
    for (const label of Object.values(resultCopy.actions)) expect(prd, label).toContain(quoted(label));
    expect(prd).toContain(disclaimer);
    expect(prd).toContain(`${resultCopy.pilot.text} ${resultCopy.pilot.cta}`);
    for (const headline of Object.values(resultHeadlines)) expect(prd).toContain(headline);
  });
});

describe('describeAnswer', () => {
  it('shows option labels, numbers with units, and "Not known"', () => {
    expect(describeAnswer('inEngland', { inEngland: 'yes' })).toBe('Yes');
    expect(describeAnswer('dwellings', { dwellings: 'fewer_than_two' })).toBe('No, fewer than two');
    expect(describeAnswer('storeys', { storeys: 9 })).toBe('9');
    expect(describeAnswer('heightMetres', { heightMetres: 11.5 })).toBe('11.5 m');
    expect(describeAnswer('storeys', { storeys: null })).toBe(NOT_KNOWN);
    expect(describeAnswer('heightMetres', { heightMetres: null })).toBe('Not known');
    expect(describeAnswer('evacuationStrategy', { evacuationStrategy: 'unsure' })).toBe("I'm not sure");
  });

  it('returns null for a question that has not been answered', () => {
    expect(describeAnswer('storeys', {})).toBeNull();
  });
});
