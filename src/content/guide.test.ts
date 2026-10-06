import { describe, expect, it } from 'vitest';
import { guideIntro, guideSections, guideText, guideTitle, guideWordCount } from './guide';

describe('guide page content (PRD section 14B)', () => {
  it('is between 1,200 and 1,800 words', () => {
    const words = guideWordCount();
    expect(words).toBeGreaterThanOrEqual(1200);
    expect(words).toBeLessThanOrEqual(1800);
  });

  it('has the H1 and the nine sections in the PRD order', () => {
    expect(guideTitle).toBe('RPEEP regulations explained');
    expect(guideSections.map((section) => section.heading)).toEqual([
      'What the regulations are and when they started',
      'Which buildings are covered',
      'Who is a relevant resident',
      'The nine duties',
      'Sharing information with the fire service',
      'Building emergency evacuation plans',
      'Reviews',
      'Common questions',
      'Check your building',
    ]);
  });

  it('has a unique id for each section, for the table of contents', () => {
    const ids = guideSections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it('cites regulation numbers in every section except the closing call to action', () => {
    for (const section of guideSections.slice(0, -1)) {
      const text = JSON.stringify(section);
      // The rule, duty and FAQ blocks are filled in from regulations.ts and carry their own regulation numbers.
      const hasCitation = /regulations? \d/.test(text) || section.blocks.some((block) => ['rules', 'duties', 'faq', 'measure'].includes(block.type));
      expect(hasCitation, section.heading).toBe(true);
    }
  });

  it('states the exact boundary cases', () => {
    const text = guideText().join(' ');
    expect(text).toContain('18.0 metres above ground level is in scope');
    expect(text).toContain('11.0 metres above ground level with a simultaneous evacuation strategy is not in scope');
    expect(text).toContain('At 11.1 metres with a simultaneous evacuation strategy, the building is in scope');
    expect(text).toContain('Six storeys does not meet the storey test, and seven does');
  });

  it('only says the Fire Safety Order applies to a building below the thresholds', () => {
    const mentions = guideText().filter((text) => text.includes('Regulatory Reform (Fire Safety) Order 2005'));
    expect(mentions).toHaveLength(1);
    expect(mentions[0]).toContain('falls below every threshold');
  });

  it('is plain English: no banned words, and it is guidance, not legal advice', () => {
    const text = guideText().join(' ').toLowerCase();
    for (const word of ['revolutionary', 'game-changing', 'seamless', 'cutting-edge', 'guarantee compliance', 'makes you compliant']) expect(text).not.toContain(word);
    expect(guideIntro).toContain('guidance, not legal advice');
  });
});
