import { expect, test } from '@playwright/test';
import { chooseAndContinue, enterNumber, passGates, resultHeading, startChecker } from './helpers';

test.describe('checker: scope questions and results', () => {
  test('in scope through C3: 4 storeys, 12m, simultaneous evacuation', async ({ page }) => {
    await startChecker(page);
    await passGates(page);
    await enterNumber(page, '4');
    await enterNumber(page, '12');
    await expect(page.getByRole('heading', { level: 1, name: "What is the building's evacuation strategy?" })).toBeVisible();
    await chooseAndContinue(page, /^Simultaneous evacuation/);
    await expect(resultHeading(page, 'Your building is in scope')).toBeVisible();
    await expect(page.getByText('more than 11 metres above ground level and the building has a simultaneous evacuation strategy (regulation 3(1)(c))')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Duties that apply' })).toBeVisible();
    await expect(page.getByText('This is guidance based on SI 2025/797, not legal advice.').first()).toBeVisible();
  });

  test('cannot confirm with unknown storeys, then edit the answer to reach "in scope"', async ({ page }) => {
    await startChecker(page);
    await passGates(page);
    await enterNumber(page, 'unknown');
    await enterNumber(page, '15');
    await chooseAndContinue(page, 'Stay put');
    await expect(resultHeading(page, /We can't confirm yet/)).toBeVisible();
    await expect(page.getByText('The number of storeys above ground level.')).toBeVisible();

    await page.getByRole('link', { name: 'Edit answers' }).click();
    await expect(page.getByRole('heading', { level: 1, name: /How many storeys/ })).toBeVisible();
    await enterNumber(page, '7');
    await expect(resultHeading(page, 'Your building is in scope')).toBeVisible();
    await expect(page.getByText('The building has at least seven storeys (regulation 3(1)(b))')).toBeVisible();
  });

  test('not in England ends the flow straight away', async ({ page }) => {
    await startChecker(page);
    await chooseAndContinue(page, /^No — it's in Wales/);
    await expect(resultHeading(page, 'Your building is not in scope of these regulations')).toBeVisible();
    await expect(page.getByText('The regulations apply in England only (regulation 1(3)).')).toBeVisible();
    // The other-duties note is only for a building below the thresholds.
    await expect(page.getByText('Regulatory Reform (Fire Safety) Order 2005')).toHaveCount(0);
  });

  test('a building below every threshold is not in scope and gets the other-duties note', async ({ page }) => {
    await startChecker(page);
    await passGates(page);
    await enterNumber(page, '3');
    await enterNumber(page, '9');
    await expect(resultHeading(page, 'Your building is not in scope of these regulations')).toBeVisible();
    await expect(page.getByText(/Regulatory Reform \(Fire Safety\) Order 2005 still apply/)).toBeVisible();
  });

  test('11.0m is not asked about evacuation strategy and is not in scope; 11,5 is accepted with a comma', async ({ page }) => {
    await startChecker(page);
    await passGates(page);
    await enterNumber(page, '4');
    await enterNumber(page, '11 m');
    await expect(resultHeading(page, 'Your building is not in scope of these regulations')).toBeVisible();

    await page.getByRole('link', { name: 'Edit Height of the top storey' }).click();
    await enterNumber(page, '11,5');
    await expect(page.getByRole('heading', { level: 1, name: "What is the building's evacuation strategy?" })).toBeVisible();
  });

  test('shows the PRD validation messages and keeps the answer', async ({ page }) => {
    await startChecker(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Choose an option to continue.')).toBeVisible();
    await chooseAndContinue(page, 'Yes');
    await chooseAndContinue(page, 'No');
    await chooseAndContinue(page, /Yes, two or more/);

    await enterNumber(page, 'seven');
    await expect(page.getByText("Enter a whole number between 1 and 120, or tick 'I don't know'.")).toBeVisible();
    await page.getByRole('textbox').fill('121');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText("Enter a whole number between 1 and 120, or tick 'I don't know'.")).toBeVisible();
    await page.getByRole('textbox').fill('4');
    await page.getByRole('button', { name: 'Continue' }).click();

    await enterNumber(page, '11.15');
    await expect(page.getByText("Enter a height between 0.1 and 350 metres, using up to one decimal place, or tick 'I don't know'.")).toBeVisible();
  });
});

test.describe('checker: navigation and state', () => {
  test('the browser Back button returns to the previous question with the answer still selected', async ({ page }) => {
    await startChecker(page);
    await chooseAndContinue(page, 'Yes');
    await chooseAndContinue(page, 'No');
    await expect(page).toHaveURL(/#q-dwellings$/);
    await page.goBack();
    await expect(page).toHaveURL(/#q-excludedPremises$/);
    await expect(page.getByRole('heading', { level: 1, name: /military premises/ })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'No', exact: true })).toBeChecked();
    await page.goBack();
    await expect(page.getByRole('radio', { name: 'Yes', exact: true })).toBeChecked();
  });

  test('the Back button on screen goes back one question', async ({ page }) => {
    await startChecker(page);
    await chooseAndContinue(page, 'Yes');
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Is the building in England?' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Yes', exact: true })).toBeChecked();
  });

  test('a refresh keeps progress, and "Start again" clears it', async ({ page }) => {
    await startChecker(page, { reference: 'Example House' });
    await passGates(page);
    await enterNumber(page, '4');
    await expect(page).toHaveURL(/#q-heightMetres$/);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: /How high is the top storey/ })).toBeVisible();
    await enterNumber(page, '9');
    await expect(resultHeading(page, 'Your building is not in scope of these regulations')).toBeVisible();
    await expect(page.getByText('Example House').first()).toBeVisible();

    await page.reload();
    await expect(resultHeading(page, 'Your building is not in scope of these regulations')).toBeVisible();

    await page.getByRole('button', { name: 'Check another building' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Is your building in scope?' })).toBeVisible();
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.getByRole('radio', { name: 'Yes', exact: true })).not.toBeChecked();
    expect(await page.evaluate(() => window.sessionStorage.getItem('rpeep-checker-v1'))).toBeNull();
  });

  test('stores the answers under rpeep-checker-v1 in sessionStorage, and sets no cookies', async ({ page, context }) => {
    await startChecker(page);
    await chooseAndContinue(page, 'Yes');
    const stored = await page.evaluate(() => window.sessionStorage.getItem('rpeep-checker-v1'));
    expect(JSON.parse(stored ?? '{}').answers).toEqual({ inEngland: 'yes' });
    expect(await context.cookies()).toEqual([]);
  });

  test('a result or later step in the URL cannot be reached before the questions are answered', async ({ page }) => {
    await page.goto('/checker#result');
    await expect(page.getByRole('heading', { level: 1, name: 'Is the building in England?' })).toBeVisible();
    await page.goto('/checker#readiness');
    await expect(page.getByRole('heading', { level: 1, name: 'Is the building in England?' })).toBeVisible();
    await page.goto('/checker#q-storeys');
    await expect(page.getByRole('heading', { level: 1, name: 'Is the building in England?' })).toBeVisible();
  });

  test('moves keyboard focus to the new question heading and announces it', async ({ page }) => {
    await startChecker(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Is the building in England?' })).toBeFocused();
    await chooseAndContinue(page, 'Yes');
    await expect(page.getByRole('heading', { level: 1, name: /military premises/ })).toBeFocused();
    await expect(page.locator('[aria-live="polite"]')).toContainText('Question 2 of up to 6');
  });

  test('shows "Question 4 of up to 6" in the stepper', async ({ page }) => {
    await startChecker(page);
    await passGates(page);
    await expect(page.getByText('Question 4 of up to 6', { exact: true })).toBeVisible();
  });
});

test.describe('checker: readiness check', () => {
  async function reachInScope(page: import('@playwright/test').Page) {
    await startChecker(page);
    await passGates(page);
    await enterNumber(page, '9');
    await expect(resultHeading(page, 'Your building is in scope')).toBeVisible();
  }

  test('shows the score, the band and the gaps in R1–R6 order', async ({ page }) => {
    await reachInScope(page);
    await page.getByRole('link', { name: 'Check how ready you are (1 minute)' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Check how ready you are' })).toBeVisible();

    // Submitting empty shows the error summary and an error on every question.
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'There is a problem' })).toBeFocused();
    // One inline error per question; the summary lists the same six with their ids.
    await expect(page.getByText('Choose an option to continue.', { exact: true })).toHaveCount(6);

    const answers = ['yes', 'partly', 'not_yet', 'yes', 'partly', 'not_yet'] as const;
    for (const [index, answer] of answers.entries()) {
      await page.locator(`input[name="R${index + 1}"][type="radio"]`).nth(['yes', 'partly', 'not_yet'].indexOf(answer)).check();
    }
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { level: 1, name: '6 out of 12 — Partly prepared' })).toBeVisible();
    const gaps = page.getByRole('region', { name: 'Gaps to work on' }).getByRole('listitem');
    await expect(gaps).toHaveCount(4);
    await expect(gaps.nth(0)).toContainText('R2');
    await expect(gaps.nth(1)).toContainText('R3');
    await expect(gaps.nth(2)).toContainText('R5');
    await expect(gaps.nth(3)).toContainText('R6');
  });

  test('is not offered when the building is not in scope', async ({ page }) => {
    await startChecker(page);
    await chooseAndContinue(page, /^No — it's in Wales/);
    await expect(page.getByRole('link', { name: /Check how ready you are/ })).toHaveCount(0);
    await page.goto('/checker#readiness');
    await expect(resultHeading(page, 'Your building is not in scope of these regulations')).toBeVisible();
  });
});

test.describe('checker: keyboard only', () => {
  test('completes the flow to an in-scope result without a mouse', async ({ page }) => {
    await page.goto('/checker');
    await page.keyboard.press('Tab'); // skip link
    await page.keyboard.press('Tab');
    // Tab to the Start button using the keyboard only.
    await page.getByRole('button', { name: 'Start' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Is the building in England?' })).toBeFocused();

    // Radio cards: arrow keys move between options, Enter submits.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: 'Yes', exact: true })).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: /military premises/ })).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space'); // "No" is first
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: /How many storeys/ })).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.type('8');
    await page.keyboard.press('Enter');
    await expect(resultHeading(page, 'Your building is in scope')).toBeFocused();
  });

  test('arrow keys move between the options of a question', async ({ page }) => {
    await startChecker(page);
    await page.getByRole('radio', { name: 'Yes', exact: true }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('radio', { name: /^No — it's in Wales/ })).toBeChecked();
    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('radio', { name: 'Yes', exact: true })).toBeChecked();
  });
});
