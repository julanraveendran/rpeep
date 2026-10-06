import { expect, test, type Page } from '@playwright/test';
import { mockReportApi, stubTurnstile } from './fixtures';
import { resultHeading } from './helpers';

type Match = { tag?: string; text?: string | RegExp; name?: string; id?: string; type?: string };
type SerialisedMatch = Omit<Match, 'text'> & { text?: string | { source: string; flags: string } };

/** Press Tab until the focused element matches, using only the keyboard. */
async function tabTo(page: Page, match: Match, max = 120) {
  const serialised: SerialisedMatch = { ...match, text: match.text instanceof RegExp ? { source: match.text.source, flags: match.text.flags } : match.text };
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const hit = await page.evaluate((m: SerialisedMatch) => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      if (m.tag && el.tagName.toLowerCase() !== m.tag) return false;
      if (m.id && el.id !== m.id) return false;
      if (m.name && el.getAttribute('name') !== m.name) return false;
      if (m.type && el.getAttribute('type') !== m.type) return false;
      if (m.text !== undefined) {
        const candidates = [(el.textContent ?? '').trim(), (el as HTMLInputElement).labels?.[0]?.textContent?.trim() ?? ''];
        const wanted = m.text;
        const ok = (value: string) => (typeof wanted === 'string' ? value === wanted : new RegExp(wanted.source, wanted.flags).test(value));
        if (!candidates.some(ok)) return false;
      }
      return true;
    }, serialised);
    if (hit) return;
  }
  throw new Error(`Could not tab to ${JSON.stringify(match)}`);
}

test('PRD test 9: the whole flow, from the first question to a downloaded report, without a mouse', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard-only is a desktop flow.');
  await stubTurnstile(page);
  await mockReportApi(page);
  await page.goto('/checker');

  // Intro → Start
  await tabTo(page, { tag: 'button', text: 'Start' });
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Is the building in England?' })).toBeFocused();

  // Three radio questions: Space chooses, Enter continues.
  for (const heading of [/in England/, /military premises/, /two or more homes/]) {
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');
  }

  // Number question: type, Enter.
  await expect(page.getByRole('heading', { level: 1, name: /How many storeys/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.type('9');
  await page.keyboard.press('Enter');
  await expect(resultHeading(page, 'Your building is in scope')).toBeFocused();

  // Result → readiness link, using Enter on a link.
  await tabTo(page, { tag: 'a', text: 'Check how ready you are (1 minute)' });
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Check how ready you are' })).toBeFocused();

  // Six questions: Tab into each group, ArrowDown to "Partly", then on to the next.
  for (let i = 1; i <= 6; i++) {
    await tabTo(page, { tag: 'input', name: `R${i}`, type: 'radio' });
    await page.keyboard.press('Space'); // Yes
    await page.keyboard.press('ArrowDown'); // Partly
    await expect(page.locator(`input[name="R${i}"]`).nth(1)).toBeChecked();
  }
  await tabTo(page, { tag: 'button', text: 'Continue' });
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: '6 out of 12 — Partly prepared' })).toBeFocused();

  // Report form: text fields by typing, selects by typeahead.
  await tabTo(page, { tag: 'input', id: 'field-firstName' });
  await page.keyboard.type('Sam');
  await page.keyboard.press('Tab');
  await page.keyboard.type('sam@example.org');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Example Homes');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Head of Compliance');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Housing');
  await page.keyboard.press('Tab');
  await page.keyboard.type('6');
  await expect(page.locator('#field-role')).toHaveValue('head_compliance');
  await expect(page.locator('#field-orgType')).toHaveValue('housing_association');
  await expect(page.locator('#field-buildingsBand')).toHaveValue('6-20');

  await tabTo(page, { tag: 'button', text: 'Get my free report' });
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Your report is ready' })).toBeFocused();

  // Download with the keyboard.
  await tabTo(page, { tag: 'button', text: 'Download PDF' });
  const [download] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Enter')]);
  expect(download.suggestedFilename()).toMatch(/^RPEEP-scope-report-.*\.pdf$/);
});

test('the mobile menu traps focus, closes on Escape and returns focus to its button', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The menu button is only shown on small screens.');
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Menu' });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: 'How it works' })).toBeFocused();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => {
      const active = document.activeElement;
      return Boolean(active?.closest('#mobile-menu') || active?.getAttribute('aria-controls') === 'mobile-menu');
    });
    expect(inside, `focus escaped the menu after ${i + 1} Tab presses`).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();
  await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0);
});
