import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * PRD section 5: "re-check every text/background pair with a contrast checker and
 * adjust any pair below 4.5:1 (normal text) or 3:1 (large text, icons, focus rings)".
 * Tokens are read from globals.css, so this fails if a colour changes to a failing value.
 */

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const rootBlock = /:root\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
const tokens = Object.fromEntries(
  [...rootBlock.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((match) => [match[1], match[2]]),
) as Record<string, string>;
tokens.white = '#ffffff';

function channel(value: number): number {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

const text = (foreground: string, background: string) => ({ foreground, background, min: 4.5 });
const graphic = (foreground: string, background: string) => ({ foreground, background, min: 3 });

const pairs = [
  // Body and headings
  text('ink', 'white'),
  text('ink', 'surface'),
  text('navy-900', 'white'),
  text('navy-900', 'surface'),
  text('muted', 'white'),
  text('muted', 'surface'),
  // Links
  text('navy-700', 'white'),
  text('navy-700', 'surface'),
  text('navy-700', 'info-soft'),
  // Buttons
  text('white', 'accent'),
  text('white', 'navy-900'),
  // Result badges (white text)
  text('white', 'success'),
  text('white', 'warning'),
  text('white', 'neutral'),
  // Errors and alerts
  text('error', 'white'),
  text('error', 'error-soft'),
  text('warning', 'warning-soft'),
  text('ink', 'info-soft'),
  text('ink', 'warning-soft'),
  text('ink', 'error-soft'),
  text('success', 'white'),
  // Text on the navy sections
  text('on-navy', 'navy-900'),
  text('on-navy-muted', 'navy-900'),
  // Non-text: control edges, icons and focus rings (WCAG 1.4.11, 2.4.13)
  graphic('input-border', 'white'),
  graphic('input-border', 'surface'),
  graphic('navy-700', 'white'),
  graphic('navy-700', 'surface'),
  graphic('navy-700', 'info-soft'),
  graphic('warning', 'warning-soft'),
  graphic('error', 'error-soft'),
  graphic('focus-on-navy', 'navy-900'),
  graphic('navy-900', 'surface'),
];

describe('colour contrast (WCAG 2.2 AA)', () => {
  it('reads every token it needs from globals.css', () => {
    const needed = new Set(pairs.flatMap((pair) => [pair.foreground, pair.background]));
    for (const name of needed) expect(tokens[name], `--${name} is missing from :root`).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it.each(pairs)('$foreground on $background is at least $min:1', ({ foreground, background, min }) => {
    const ratio = contrast(tokens[foreground] as string, tokens[background] as string);
    expect(ratio).toBeGreaterThanOrEqual(min);
  });

  it('matches the ratios stated in PRD section 5 on white (to one decimal place, within 0.1)', () => {
    const stated: Record<string, number> = {
      'navy-900': 14.6,
      'navy-700': 10.2,
      ink: 14.7,
      muted: 7.6,
      accent: 5.2,
      success: 5.0,
      warning: 5.0,
      neutral: 7.6,
      error: 6.5,
    };
    for (const [name, ratio] of Object.entries(stated)) {
      expect(Math.abs(contrast(tokens[name] as string, tokens.white as string) - ratio), name).toBeLessThanOrEqual(0.15);
    }
  });
});
