import { expect, type Page } from '@playwright/test';

/** Choose a radio card by its label and press Continue. */
export async function chooseAndContinue(page: Page, label: string | RegExp) {
  await page.getByRole('radio', { name: label }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

/** Type into the number field of the current question, or tick "I don't know", then Continue. */
export async function enterNumber(page: Page, value: string | 'unknown') {
  if (value === 'unknown') await page.getByRole('checkbox', { name: "I don't know" }).check();
  else {
    // Editing an answer that was "I don't know": untick it first, which enables the field again.
    await page.getByRole('checkbox', { name: "I don't know" }).uncheck();
    await page.getByRole('textbox').fill(value);
  }
  await page.getByRole('button', { name: 'Continue' }).click();
}

export async function startChecker(page: Page, options: { reference?: string } = {}) {
  await page.goto('/checker');
  await expect(page.getByRole('heading', { level: 1, name: 'Is your building in scope?' })).toBeVisible();
  if (options.reference) await page.getByLabel(/Building name or reference/).fill(options.reference);
  await page.getByRole('button', { name: 'Start' }).click();
}

/** The three gate questions, answered so the building passes them. */
export async function passGates(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Is the building in England?' })).toBeVisible();
  await chooseAndContinue(page, 'Yes');
  await expect(page.getByRole('heading', { level: 1, name: /military premises/ })).toBeVisible();
  await chooseAndContinue(page, 'No');
  await expect(page.getByRole('heading', { level: 1, name: /two or more homes/ })).toBeVisible();
  await chooseAndContinue(page, /Yes, two or more/);
}

export const resultHeading = (page: Page, name: string | RegExp) => page.getByRole('heading', { level: 1, name });
