import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureUtm, EMPTY_UTM, parseUtm, readUtm, UTM_STORAGE_KEY } from './utm';

let store: Record<string, string>;
beforeEach(() => {
  store = {};
  vi.stubGlobal('window', {
    sessionStorage: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => void (store[key] = value),
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('UTM capture (PRD section 9A)', () => {
  it('reads utm_source, utm_medium and utm_campaign from the query string', () => {
    expect(parseUtm('?utm_source=linkedin&utm_medium=social&utm_campaign=launch&other=1')).toEqual({ source: 'linkedin', medium: 'social', campaign: 'launch' });
    expect(parseUtm('?utm_source=report_email')).toEqual({ source: 'report_email', medium: null, campaign: null });
  });

  it('returns null when there are none, and trims and limits values', () => {
    expect(parseUtm('')).toBeNull();
    expect(parseUtm('?foo=bar&utm_source=')).toBeNull();
    expect(parseUtm(`?utm_source=${'a'.repeat(300)}`)?.source).toHaveLength(200);
  });

  it('stores the values in sessionStorage under rpeep-utm-v1 and reads them back', () => {
    captureUtm('?utm_source=linkedin&utm_campaign=launch');
    expect(JSON.parse(store[UTM_STORAGE_KEY]!)).toEqual({ source: 'linkedin', medium: null, campaign: 'launch' });
    expect(readUtm()).toEqual({ source: 'linkedin', medium: null, campaign: 'launch' });
  });

  it('keeps earlier values when a later page has no UTM values', () => {
    captureUtm('?utm_source=linkedin');
    captureUtm('?page=2');
    expect(readUtm().source).toBe('linkedin');
  });

  it('returns empty values for nothing stored, junk, or blocked storage', () => {
    expect(readUtm()).toEqual(EMPTY_UTM);
    store[UTM_STORAGE_KEY] = 'not json';
    expect(readUtm()).toEqual(EMPTY_UTM);
    store[UTM_STORAGE_KEY] = JSON.stringify({ source: 42, medium: { x: 1 } });
    expect(readUtm()).toEqual(EMPTY_UTM);
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
      },
    });
    expect(readUtm()).toEqual(EMPTY_UTM);
    expect(() => captureUtm('?utm_source=x')).not.toThrow();
  });
});
