import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { chooseAndContinue, enterNumber, passGates, resultHeading, startChecker } from './helpers';
import { mockPilotApi, mockReportApi, stubTurnstile } from './fixtures';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
  expect(summary, `axe violations on ${label}`).toEqual([]);
}

async function openEverything(page: Page) {
  for (const summary of await page.locator('summary').all()) await summary.click();
}

test.beforeEach(async ({ page }) => {
  await stubTurnstile(page);
  await mockReportApi(page);
  await mockPilotApi(page);
});

test.describe('axe: zero violations on every route (PRD section 15C, test 10)', () => {
  for (const route of ['/', '/checker', '/pilot', '/pilot/thanks', '/rpeep-regulations-explained', '/privacy', '/terms', '/cookies', '/accessibility', '/unsubscribe?status=ok', '/unsubscribe?status=invalid', '/this-page-does-not-exist']) {
    test(route, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectNoViolations(page, route);
      await openEverything(page);
      await expectNoViolations(page, `${route} with every disclosure open`);
    });
  }

  test('the mobile menu, open', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The menu button is only shown on small screens.');
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible();
    await expectNoViolations(page, 'mobile menu');
  });

  test('every checker screen: questions, errors, the three results, readiness and the report form', async ({ page }) => {
    await page.goto('/checker');
    await expectNoViolations(page, 'checker intro');
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Choose an option to continue.')).toBeVisible();
    await expectNoViolations(page, 'radio question with an error');
    await chooseAndContinue(page, 'Yes');
    await expectNoViolations(page, 'second question');
    await chooseAndContinue(page, 'No');
    await chooseAndContinue(page, /Yes, two or more/);
    await expect(page.getByRole('heading', { level: 1, name: /How many storeys/ })).toBeVisible();
    await expectNoViolations(page, 'storeys question');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText(/Enter a whole number/)).toBeVisible();
    await expectNoViolations(page, 'number question with an error');
    await page.getByRole('checkbox', { name: "I don't know" }).check();
    await expectNoViolations(page, "number question with I don't know ticked");
    await page.getByRole('button', { name: 'Continue' }).click();
    await enterNumber(page, '15');
    await expectNoViolations(page, 'strategy question');
    await chooseAndContinue(page, 'Stay put');
    await expect(resultHeading(page, /We can't confirm yet/)).toBeVisible();
    await expectNoViolations(page, 'cannot confirm result');
    await openEverything(page);

    await page.getByRole('link', { name: 'Edit answers' }).click();
    await enterNumber(page, '9');
    await expect(resultHeading(page, 'Your building is in scope')).toBeVisible();
    await openEverything(page);
    await expectNoViolations(page, 'in scope result with every Legal detail open');

    await page.getByRole('link', { name: 'Check how ready you are (1 minute)' }).click();
    await expectNoViolations(page, 'readiness questions');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'There is a problem' })).toBeVisible();
    await expectNoViolations(page, 'readiness with errors');
    for (let i = 1; i <= 6; i++) await page.locator(`input[name="R${i}"]`).nth(1).check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { level: 1, name: '6 out of 12 — Partly prepared' })).toBeVisible();
    await expectNoViolations(page, 'readiness result with the report form');
    await page.getByRole('button', { name: 'Get my free report' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'There is a problem' })).toBeVisible();
    await expectNoViolations(page, 'report form with errors');
    await page.getByLabel('First name').fill('Sam');
    await page.getByLabel('Work email').fill('sam@example.org');
    await page.getByLabel('Organisation', { exact: true }).fill('Example Homes');
    await page.getByLabel('Role').selectOption('head_compliance');
    await page.getByLabel('Organisation type').selectOption('managing_agent');
    await page.getByLabel('Buildings that may be in scope').selectOption('1');
    await page.getByRole('button', { name: 'Get my free report' }).click();
    await expect(page.getByRole('heading', { name: 'Your report is ready' })).toBeVisible();
    await expectNoViolations(page, 'report success');
  });

  test('the not-in-scope result and the pilot form with errors', async ({ page }) => {
    await startChecker(page);
    await chooseAndContinue(page, /^No — it's in Wales/);
    await expect(resultHeading(page, 'Your building is not in scope of these regulations')).toBeVisible();
    await expectNoViolations(page, 'not in scope result');

    await page.goto('/pilot');
    await page.getByRole('button', { name: 'Apply for the pilot' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'There is a problem' })).toBeVisible();
    await expectNoViolations(page, 'pilot form with errors');
    await page.getByRole('checkbox', { name: 'Our existing compliance software' }).check();
    await page.getByLabel('Role').selectOption('other');
    await expect(page.getByLabel('Which one?')).toBeVisible();
    await expect(page.getByLabel('Describe your role')).toBeVisible();
    await expectNoViolations(page, 'pilot form with the revealed fields');
  });
});

test.describe('layout and motion (PRD section 14E)', () => {
  const routes = ['/', '/checker', '/pilot', '/rpeep-regulations-explained', '/privacy', '/terms', '/cookies', '/accessibility', '/pilot/thanks', '/unsubscribe?status=ok'];

  test('no horizontal scrolling at 320px wide (which is also 400% zoom on a 1280px screen)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const route of routes) {
      await page.goto(route);
      await openEverything(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} overflows by ${overflow}px at 320px`).toBeLessThanOrEqual(0);
    }
  });

  test('no horizontal scrolling at 320px in the checker result and the report form', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await startChecker(page, { reference: 'A fairly long building reference to test wrapping' });
    await passGates(page);
    await enterNumber(page, '9');
    await openEverything(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await page.getByRole('link', { name: 'Skip to my free report' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test('respects prefers-reduced-motion: no smooth scrolling, no animation', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
    await context.close();

    const normal = await browser.newContext({ reducedMotion: 'no-preference' });
    const other = await normal.newPage();
    await other.goto('/');
    expect(await other.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth');
    await normal.close();
  });

  test('the skip link is the first focusable element and moves focus to the main content', async ({ page }) => {
    await page.goto('/privacy');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });

  test('every interactive element has a visible focus indicator', async ({ page }) => {
    await page.goto('/pilot');
    const failures: string[] = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const result = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const style = getComputedStyle(el);
        const outline = parseFloat(style.outlineWidth) > 0 && style.outlineStyle !== 'none';
        const label = `${el.tagName.toLowerCase()} ${(el.getAttribute('aria-label') ?? el.textContent ?? el.getAttribute('name') ?? '').trim().slice(0, 30)}`;
        return { outline, label, hasShadow: style.boxShadow !== 'none' };
      });
      if (result && !result.outline && !result.hasShadow) failures.push(result.label);
    }
    expect(failures).toEqual([]);
  });

  test('buttons and controls are at least 44px tall (primary buttons) and 24px (all targets)', async ({ page }) => {
    await page.goto('/');
    const small = await page.evaluate(() => {
      const bad: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>('button, a[href], summary, input:not([type=hidden])')) {
        const box = el.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue;
        const inline = getComputedStyle(el).display === 'inline' && el.tagName === 'A' && el.closest('p, li');
        if (inline) continue; // links inside a sentence are exempt from the target size rule
        if (box.height < 24 || box.width < 24) bad.push(`${el.tagName} ${(el.textContent ?? '').trim().slice(0, 25)} ${Math.round(box.width)}x${Math.round(box.height)}`);
      }
      return bad;
    });
    expect(small).toEqual([]);
    for (const button of await page.locator('a.bg-accent, button.bg-accent').all()) {
      if (!(await button.isVisible())) continue;
      const box = (await button.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
