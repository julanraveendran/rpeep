import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { stubTurnstile } from './fixtures';

const routes = ['/', '/checker', '/pilot', '/pilot/thanks', '/rpeep-regulations-explained', '/privacy', '/terms', '/cookies', '/accessibility', '/unsubscribe?status=ok', '/does-not-exist'];

test.describe('security headers (PRD section 13)', () => {
  test('every page has the static security headers and a Content-Security-Policy with a nonce', async ({ request }) => {
    for (const route of routes) {
      const response = await request.get(route);
      const headers = response.headers();
      expect(headers['strict-transport-security'], route).toBe('max-age=63072000; includeSubDomains; preload');
      expect(headers['x-content-type-options'], route).toBe('nosniff');
      expect(headers['referrer-policy'], route).toBe('strict-origin-when-cross-origin');
      expect(headers['permissions-policy'], route).toBe('camera=(), microphone=(), geolocation=()');
      expect(headers['x-frame-options'], route).toBe('DENY');
      const csp = headers['content-security-policy'] ?? '';
      expect(csp, route).toContain("default-src 'self'");
      expect(csp, route).toContain("frame-ancestors 'none'");
      expect(csp, route).toMatch(/script-src [^;]*'nonce-[A-Za-z0-9+/=]+'/);
      expect(csp, route).not.toContain("'unsafe-inline'");
      expect(csp, route).not.toContain("'unsafe-eval'");
      expect(csp, route).toContain('https://challenges.cloudflare.com');
      expect(csp, route).toContain("img-src 'self' data:");
    }
  });

  test('the API has the static headers too', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['strict-transport-security']).toContain('max-age=63072000');
    expect(await response.json()).toMatchObject({ ok: true });
  });

  test('uses a different nonce on every request, and puts it on the inline scripts', async ({ request }) => {
    const nonces = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const response = await request.get('/');
      const nonce = /'nonce-([^']+)'/.exec(response.headers()['content-security-policy'] ?? '')?.[1];
      expect(nonce).toBeTruthy();
      nonces.add(nonce!);
      const html = await response.text();
      const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>/g)].map((m) => m[0]);
      expect(inline.length).toBeGreaterThan(0);
      for (const tag of inline) expect(tag, tag).toContain(`nonce="${nonce}"`);
    }
    expect(nonces.size).toBe(4);
  });

  test('no page triggers a Content-Security-Policy violation or a console error', async ({ page }) => {
    await stubTurnstile(page);
    await page.addInitScript(() => {
      const violations: string[] = [];
      (window as unknown as { __csp: string[] }).__csp = violations;
      document.addEventListener('securitypolicyviolation', (event) => violations.push(`${event.violatedDirective}: ${event.blockedURI}`));
    });
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(String(error)));

    for (const route of routes.filter((route) => route !== '/does-not-exist')) {
      await page.goto(route);
      await page.waitForLoadState('load');
      // Open the interactive parts: accordions, disclosures, the mobile menu.
      for (const summary of await page.locator('summary').all()) await summary.click().catch(() => {});
      expect(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp), route).toEqual([]);
    }
    expect(errors).toEqual([]);
  });

  test('robots.txt and sitemap.xml follow the PRD', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('User-Agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /api/');
    expect(robots).toContain('Disallow: /unsubscribe');
    expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
    const sitemap = await (await request.get('/sitemap.xml')).text();
    for (const path of ['/checker', '/rpeep-regulations-explained', '/pilot', '/privacy', '/terms', '/cookies', '/accessibility']) expect(sitemap).toContain(`${path}</loc>`);
    expect(sitemap).not.toContain('/unsubscribe');
    expect(sitemap).not.toContain('/api');
  });

  test('the client bundle contains no server secrets', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Runs once.');
    const output = execFileSync('npx', ['tsx', 'scripts/check-bundle.ts'], { encoding: 'utf8' });
    expect(output).toContain('none found');
  });
});

test.describe('error pages (F11)', () => {
  test('an unknown address shows the custom 404, with a 404 status and noindex', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Free checker' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('the dev component page does not exist in production', async ({ request }) => {
    expect((await request.get('/dev/components')).status()).toBe(404);
  });
});
