import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { MissingCode, NoteCode, ReasonCode, ScopeStatus } from '@/lib/scope/engine';
import { duties, dutiesSource, measurementRules, missingCopy, noteCopy, reasonCopy, resultHeadlines, scopeRules } from './regulations';
import { site } from './site';

const reasonCodes: ReasonCode[] = [
  'NOT_ENGLAND',
  'EXCLUDED_PREMISES',
  'FEWER_THAN_TWO_DWELLINGS',
  'BELOW_THRESHOLDS',
  'C1_HEIGHT_18',
  'C2_STOREYS_7',
  'C3_HEIGHT_11_SIMULTANEOUS',
];
const missingCodes: MissingCode[] = ['HEIGHT', 'STOREYS', 'STRATEGY'];
const noteCodes: NoteCode[] = ['TEMPORARY_STRATEGY', 'UNLIKELY_SEVEN_STOREYS', 'OTHER_DUTIES'];
const statuses: ScopeStatus[] = ['in_scope', 'not_in_scope', 'cannot_confirm'];

describe('regulation copy (PRD section 7C)', () => {
  it('has copy for every code the engine can return, and nothing extra', () => {
    expect(Object.keys(reasonCopy).sort()).toEqual([...reasonCodes].sort());
    expect(Object.keys(missingCopy).sort()).toEqual([...missingCodes].sort());
    expect(Object.keys(noteCopy).sort()).toEqual([...noteCodes].sort());
    expect(Object.keys(resultHeadlines).sort()).toEqual([...statuses].sort());
  });

  it('cites a regulation number in every reason', () => {
    for (const code of reasonCodes) expect(reasonCopy[code], code).toMatch(/\(regulation \d+(\(\d+\))?(\([a-z]\))?\)/);
  });

  it('cites the right regulation for each scope rule', () => {
    expect(reasonCopy.NOT_ENGLAND).toContain('regulation 1(3)');
    expect(reasonCopy.EXCLUDED_PREMISES).toContain('regulation 1(4)');
    expect(reasonCopy.FEWER_THAN_TWO_DWELLINGS).toContain('regulation 3(1)');
    expect(reasonCopy.C1_HEIGHT_18).toContain('regulation 3(1)(a)');
    expect(reasonCopy.C2_STOREYS_7).toContain('regulation 3(1)(b)');
    expect(reasonCopy.C3_HEIGHT_11_SIMULTANEOUS).toContain('regulation 3(1)(c)');
    expect(reasonCopy.BELOW_THRESHOLDS).toContain('regulation 3(1)');
  });

  it('keeps the criteria thresholds in the wording: "at least 18", "at least seven", "more than 11"', () => {
    expect(reasonCopy.C1_HEIGHT_18).toContain('at least 18 metres');
    expect(reasonCopy.C2_STOREYS_7).toContain('at least seven storeys');
    expect(reasonCopy.C3_HEIGHT_11_SIMULTANEOUS).toContain('more than 11 metres');
  });

  it('uses the exact headlines', () => {
    expect(resultHeadlines).toEqual({
      in_scope: 'Your building is in scope',
      not_in_scope: 'Your building is not in scope of these regulations',
      cannot_confirm: "We can't confirm yet — we need a little more information",
    });
  });

  it('only the other-duties note mentions the Fire Safety Order', () => {
    expect(noteCopy.OTHER_DUTIES).toContain('Regulatory Reform (Fire Safety) Order 2005');
    expect(Object.entries(noteCopy).filter(([, text]) => text.includes('Fire Safety) Order'))).toHaveLength(1);
  });
});

describe('scope and measurement rules (PRD section 7A)', () => {
  it('lists R1–R3 and C1–C3 with their regulation numbers', () => {
    expect(scopeRules.map((rule) => [rule.id, rule.regulation])).toEqual([
      ['R1', '1(3)'],
      ['R2', '1(4), 2'],
      ['R3', '3(1)'],
      ['C1', '3(1)(a)'],
      ['C2', '3(1)(b)'],
      ['C3', '3(1)(c)'],
    ]);
  });

  it('lists the measurement rules with their regulation numbers', () => {
    expect(measurementRules.map((rule) => rule.regulation)).toEqual(['3(2)(a)', '3(2)(b)(i)', '3(2)(b)(ii)', '3(2)(b)(iii)', '3(3)']);
  });
});

describe('duties (PRD section 7D)', () => {
  it('has D1 to D9 in order, each with plain English and a regulation number', () => {
    expect(duties.map((duty) => duty.id)).toEqual(['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9']);
    for (const duty of duties) {
      expect(duty.title.length).toBeGreaterThan(0);
      expect(duty.plainEnglish.length).toBeGreaterThan(0);
      expect(duty.regulation).toMatch(/^\d+(, \d+)?$/);
    }
  });

  it('cites the regulation the PRD table gives for each duty', () => {
    expect(Object.fromEntries(duties.map((duty) => [duty.id, duty.regulation]))).toEqual({
      D1: '4, 5',
      D2: '6',
      D3: '7',
      D4: '8',
      D5: '9',
      D6: '10',
      D7: '11',
      D8: '13',
      D9: '12',
    });
  });

  it('names the source', () => {
    expect(dutiesSource).toBe('SI 2025/797 as made');
  });
});

describe('tone of voice (PRD section 5)', () => {
  const copy = [
    ...Object.values(reasonCopy),
    ...Object.values(missingCopy),
    ...Object.values(noteCopy),
    ...Object.values(resultHeadlines),
    ...duties.flatMap((duty) => [duty.title, duty.plainEnglish]),
    ...measurementRules.map((rule) => rule.text),
    ...scopeRules.map((rule) => rule.condition),
    site.description,
    site.disclaimer,
  ].join('\n');

  it.each(['revolutionary', 'game-changing', 'seamless', 'cutting-edge', 'guarantee compliance', 'makes you compliant'])(
    'does not use "%s"',
    (word) => {
      expect(copy.toLowerCase()).not.toContain(word);
    },
  );
});

describe('copy matches docs/PRD.md word for word', () => {
  const prd = readFileSync(new URL('../../docs/PRD.md', import.meta.url), 'utf8');

  /** Rows of the first Markdown table after `heading`, as arrays of cells with backticks and escapes removed. */
  function tableAfter(heading: string): string[][] {
    const start = prd.indexOf(heading);
    expect(start, `"${heading}" not found in docs/PRD.md`).toBeGreaterThan(-1);
    const lines = prd.slice(start).split('\n');
    const rows: string[][] = [];
    let inTable = false;
    for (const line of lines.slice(1)) {
      if (line.startsWith('|')) {
        inTable = true;
        const cells = line
          .slice(1, line.lastIndexOf('|'))
          .split(' | ')
          .map((cell) => cell.trim().replace(/^\|/, '').trim().replace(/\\\|/g, '|').replace(/`/g, ''));
        rows.push(cells);
      } else if (inTable) {
        break;
      }
    }
    return rows.slice(2); // drop the header row and the --- separator
  }

  it('7C: every reason, missing item and note', () => {
    const rows = tableAfter('### C. Exact result copy');
    const prdCopy = Object.fromEntries(rows.map(([code, text]) => [code!.replace(/ \((missing|note)\)$/, ''), text]));
    const ours = { ...reasonCopy, ...missingCopy, ...noteCopy };
    expect(Object.keys(prdCopy).sort()).toEqual(Object.keys(ours).sort());
    for (const [code, text] of Object.entries(ours)) expect(text, code).toBe(prdCopy[code]);
  });

  it('7C: result headlines', () => {
    const line = prd.split('\n').find((l) => l.startsWith('Result headlines:')) ?? '';
    for (const headline of Object.values(resultHeadlines)) expect(line).toContain(`"${headline}"`);
  });

  it('7D: every duty title, plain English and regulation', () => {
    const rows = tableAfter('### D. Duties shown for in-scope buildings');
    expect(rows).toHaveLength(duties.length);
    rows.forEach(([id, title, plainEnglish, regulation], index) => {
      expect(duties[index]).toEqual({ id, title, plainEnglish, regulation });
    });
  });
});
