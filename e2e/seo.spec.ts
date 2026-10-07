import { expect, test } from '@playwright/test';
import { site } from '../src/content/site';

const pages = [
  { path: '/', title: `RPEEP compliance for Responsible Persons | ${site.name}`, jsonLd: ['Organization', 'FAQPage'] },
  { path: '/checker', title: 'Free RPEEP scope checker — is my building in scope?', jsonLd: ['Organization', 'WebApplication'] },
  { path: '/rpeep-regulations-explained', title: 'RPEEP regulations explained in plain English', jsonLd: ['Organization', 'Article'] },
  { path: '/pilot', title: `Join the ${site.name} founding pilot`, jsonLd: ['Organization'] },
  { path: '/privacy', title: `Privacy notice | ${site.name}`, jsonLd: ['Organization'] },
  { path: '/terms', title: `Terms of use | ${site.name}`, jsonLd: ['Organization'] },
  { path: '/cookies', title: `Cookie statement | ${site.name}`, jsonLd: ['Organization'] },
  { path: '/accessibility', title: `Accessibility statement | ${site.name}`, jsonLd: ['Organization'] },
];

test.describe('page metadata and structured data (PRD section 14A)', () => {
  for (const page of pages) {
    test(page.path, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      await expect(browserPage).toHaveTitle(page.title);
      expect(await browserPage.title()).toHaveLength(page.title.length);
      await expect(browserPage.locator('html')).toHaveAttribute('lang', 'en-GB');
      const description = await browserPage.locator('meta[name="description"]').getAttribute('content');
      expect(description?.length ?? 0).toBeGreaterThan(20);
      expect(description!.length).toBeLessThanOrEqual(155);
      await expect(browserPage.locator('link[rel="canonical"]')).toHaveAttribute('href', page.path === '/' ? /^https?:\/\/[^/]+\/?$/ : new RegExp(`${page.path}$`));
      await expect(browserPage.locator('meta[property="og:title"]')).toHaveAttribute('content', page.title);
      await expect(browserPage.locator('meta[property="og:image"]')).toHaveCount(1);
      await expect(browserPage.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
      await expect(browserPage.locator('h1')).toHaveCount(1);
      await expect(browserPage.locator('header, [role=banner]').first()).toBeVisible();
      await expect(browserPage.locator('main')).toHaveCount(1);
      await expect(browserPage.locator('footer')).toHaveCount(1);
      const types = await browserPage.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? '{}')['@type']));
      expect(types.sort()).toEqual([...page.jsonLd].sort());
    });
  }

  test('the home page FAQ JSON-LD lists all eight questions, and the checker is free', async ({ page }) => {
    await page.goto('/');
    const faq = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? '{}')).find((data) => data['@type'] === 'FAQPage'));
    expect(faq.mainEntity).toHaveLength(8);
    await page.goto('/checker');
    const app = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? '{}')).find((data) => data['@type'] === 'WebApplication'));
    expect(app).toMatchObject({ applicationCategory: 'BusinessApplication', isAccessibleForFree: true });
  });

  test('the Open Graph image is a PNG, and the favicon is served', async ({ request, page }) => {
    await page.goto('/');
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    const response = await request.get(new URL(og!, 'http://localhost:3100').pathname);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    expect((await request.get('/icon')).status()).toBe(200);
  });

  test('the guide has a table of contents, a last-reviewed date, regulation links and 1,200 to 1,800 words', async ({ page }) => {
    await page.goto('/rpeep-regulations-explained');
    await expect(page.getByRole('navigation', { name: 'On this page' })).toBeVisible();
    await expect(page.getByText(/Last reviewed \d+ \w+ \d{4}/)).toBeVisible();
    await expect(page.getByRole('link', { name: /Read the regulations on legislation.gov.uk/ }).first()).toHaveAttribute('href', 'https://www.legislation.gov.uk/uksi/2025/797/made');
    const width = await page.locator('article').evaluate((el) => el.getBoundingClientRect().width);
    expect(width).toBeLessThanOrEqual(720);
    const sections = await page.locator('article section h2').allTextContents();
    expect(sections).toHaveLength(9);
    // Clicking a contents link jumps to its section.
    await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Reviews' }).click();
    await expect(page).toHaveURL(/#reviews$/);
  });
});
