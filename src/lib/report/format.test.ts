import { describe, expect, it } from 'vitest';
import { formatLondonDateTime, formatUkDate, londonIsoDate, reportFileName, slugify } from './format';

describe('dates (Europe/London)', () => {
  it('formats a UK date: "6 October 2026"', () => {
    expect(formatUkDate(new Date('2026-10-06T14:30:00Z'))).toBe('6 October 2026');
  });

  it('uses London time, not UTC: 23:30 UTC in summer is already the next day', () => {
    expect(londonIsoDate(new Date('2026-07-01T23:30:00Z'))).toBe('2026-07-02');
    expect(formatUkDate(new Date('2026-07-01T23:30:00Z'))).toBe('2 July 2026');
    expect(londonIsoDate(new Date('2026-12-01T23:30:00Z'))).toBe('2026-12-01'); // winter: GMT = UTC
  });

  it('formats the founder timestamp in London time', () => {
    expect(formatLondonDateTime(new Date('2026-10-06T14:30:00Z'))).toBe('6 October 2026, 15:30');
    expect(formatLondonDateTime(new Date('2026-01-06T14:30:00Z'))).toBe('6 January 2026, 14:30');
  });
});

describe('file name (PRD section 9B)', () => {
  it('is RPEEP-scope-report-{slug}-{YYYY-MM-DD}.pdf', () => {
    expect(reportFileName('Example House', new Date('2026-10-06T10:00:00Z'))).toBe('RPEEP-scope-report-example-house-2026-10-06.pdf');
  });

  it('uses "building" when there is no reference', () => {
    expect(reportFileName(null, new Date('2026-10-06T10:00:00Z'))).toBe('RPEEP-scope-report-building-2026-10-06.pdf');
    expect(reportFileName('', new Date('2026-10-06T10:00:00Z'))).toBe('RPEEP-scope-report-building-2026-10-06.pdf');
    expect(reportFileName('!!!', new Date('2026-10-06T10:00:00Z'))).toBe('RPEEP-scope-report-building-2026-10-06.pdf');
  });

  it('keeps only safe characters, so user input can never change the path or header', () => {
    for (const hostile of ['../../etc/passwd', 'a"; filename="b', 'x\r\nSet-Cookie: a=b', 'é Ünïcode & <b>', 'a'.repeat(200)]) {
      const name = reportFileName(hostile, new Date('2026-10-06T10:00:00Z'));
      expect(name).toMatch(/^RPEEP-scope-report-[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.pdf$/);
    }
    expect(slugify('Ünïcode & <b>')).toBe('unicode-b');
    expect(slugify('a'.repeat(200))).toHaveLength(40);
    expect(slugify('Tower--Block  A')).toBe('tower-block-a');
  });
});
