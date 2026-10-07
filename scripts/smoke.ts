/**
 * Smoke test for a running site: `npm run smoke -- <url> [--launch]`.
 *
 * Read-only: it requests pages and sends deliberately invalid requests to the API, so it saves nothing and emails nobody.
 * The one exception is the bot-check test, which sends a made-up Turnstile token. A correctly configured site answers
 * 403. If it answers 200, the site accepted a fake token (a Cloudflare test secret is probably set), and that request
 * has saved one report row for smoke-test@example.invalid.
 *
 * It runs in CI against a local production build, and after each production deploy against the live domain.
 * `--launch` adds the checks that only make sense on the real site: no placeholder text left in the pages, no
 * localhost addresses, and the analytics script present.
 */

export {};

const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith('--'));
const launch = args.includes('--launch');

if (!target) {
  console.error('Usage: npm run smoke -- <url> [--launch]\n  e.g. npm run smoke -- https://example.co.uk --launch');
  process.exit(2);
}

const siteOrigin = new URL(target).origin;
const failures: string[] = [];

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(new URL(path, siteOrigin), { redirect: 'manual', signal: AbortSignal.timeout(20_000), ...init });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function check(name: string, run: () => Promise<void>): Promise<void> {
  try {
    await run();
    console.log(`  ok    ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(name);
    console.log(`  FAIL  ${name}\n          ${message}`);
  }
}

const pages = ['/', '/checker', '/pilot', '/pilot/thanks', '/rpeep-regulations-explained', '/privacy', '/terms', '/cookies', '/accessibility', '/unsubscribe?status=ok'];
const html = new Map<string, string>();

async function pageHtml(path: string): Promise<string> {
  const cached = html.get(path);
  if (cached !== undefined) return cached;
  const response = await request(path);
  assert(response.status === 200, `${path} returned ${response.status}, expected 200`);
  const body = await response.text();
  html.set(path, body);
  return body;
}

function decodeEntities(text: string): string {
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
}

function stringsIn(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === 'object') return Object.values(value).flatMap(stringsIn);
  return [];
}

/**
 * The text of a page that a visitor or a crawler reads: the words on the page, the content of the meta tags, and the
 * strings in the structured data. Left out: scripts, styles and attributes such as class names, where square brackets
 * are normal.
 */
function readableText(body: string): string {
  const structuredData = [...body.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((match) => {
    try {
      return stringsIn(JSON.parse(match[1]!));
    } catch {
      return [match[1]!];
    }
  });
  const meta = [...body.matchAll(/<meta[^>]*\scontent="([^"]*)"/g)].map((match) => decodeEntities(match[1]!));
  const words = decodeEntities(
    body
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' '),
  );
  return [words, ...meta, ...structuredData].join('\n');
}

const PLACEHOLDER = /\[[^\]\n<>]+\](?!\()/g;

console.log(`Smoke test: ${siteOrigin}${launch ? ' (launch checks on)' : ''}\n`);

await check('GET /api/health returns { ok: true } and a version', async () => {
  const response = await request('/api/health');
  assert(response.status === 200, `returned ${response.status}`);
  const body = (await response.json()) as { ok?: unknown; version?: unknown };
  assert(body.ok === true && typeof body.version === 'string', `unexpected body ${JSON.stringify(body)}`);
});

for (const path of pages) {
  await check(`GET ${path} returns an HTML page with one H1 and lang="en-GB"`, async () => {
    const body = await pageHtml(path);
    assert(/<html[^>]*lang="en-GB"/.test(body), 'missing lang="en-GB"');
    assert((body.match(/<h1[\s>]/g) ?? []).length === 1, `expected one <h1>, found ${(body.match(/<h1[\s>]/g) ?? []).length}`);
  });
}

await check('security headers on the home page match PRD section 13', async () => {
  const response = await request('/');
  const expected: Record<string, string> = {
    'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'x-frame-options': 'DENY',
  };
  for (const [name, value] of Object.entries(expected)) assert(response.headers.get(name) === value, `${name} is "${response.headers.get(name)}", expected "${value}"`);
});

await check('Content-Security-Policy has a fresh nonce, no unsafe-inline or unsafe-eval, and the inline scripts carry the nonce', async () => {
  const nonces: string[] = [];
  for (let i = 0; i < 2; i++) {
    const response = await request('/');
    const csp = response.headers.get('content-security-policy') ?? '';
    assert(csp.includes("default-src 'self'") && csp.includes("frame-ancestors 'none'"), `unexpected policy: ${csp.slice(0, 120)}`);
    assert(!csp.includes("'unsafe-inline'") && !csp.includes("'unsafe-eval'"), 'the policy allows unsafe-inline or unsafe-eval');
    assert(csp.includes('https://challenges.cloudflare.com'), 'Turnstile is not allowed by the policy');
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
    assert(nonce, 'no nonce in the policy');
    nonces.push(nonce);
    const body = await response.text();
    const inline = [...body.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>/g)].map((match) => match[0]);
    assert(inline.length > 0 && inline.every((tag) => tag.includes(`nonce="${nonce}"`)), 'an inline script has no nonce');
  }
  assert(nonces[0] !== nonces[1], 'the nonce is the same on two requests');
});

await check('unknown pages and the developer showcase return 404', async () => {
  for (const path of ['/this-page-does-not-exist-smoke-test', '/dev/components']) {
    const response = await request(path);
    assert(response.status === 404, `${path} returned ${response.status}, expected 404`);
  }
});

await check('robots.txt allows all, blocks /api/ and /unsubscribe, and its sitemap is on this site', async () => {
  const response = await request('/robots.txt');
  assert(response.status === 200, `returned ${response.status}`);
  const text = await response.text();
  assert(/Allow: \//.test(text) && /Disallow: \/api\//.test(text) && /Disallow: \/unsubscribe/.test(text), 'unexpected rules');
  const sitemap = /Sitemap: (\S+)/.exec(text)?.[1];
  assert(sitemap && new URL(sitemap).origin === siteOrigin, `the sitemap URL is ${sitemap}: NEXT_PUBLIC_SITE_URL is probably wrong`);
});

await check('sitemap.xml lists the public pages on this site, and not /unsubscribe or the API', async () => {
  const response = await request('/sitemap.xml');
  assert(response.status === 200, `returned ${response.status}`);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
  assert(urls.length >= 8, `only ${urls.length} URLs`);
  assert(urls.every((url) => new URL(url).origin === siteOrigin), 'a sitemap URL is on another origin: NEXT_PUBLIC_SITE_URL is probably wrong');
  for (const path of ['/checker', '/rpeep-regulations-explained', '/pilot', '/privacy']) assert(urls.some((url) => new URL(url).pathname === path), `${path} is missing`);
  assert(!urls.some((url) => /\/(unsubscribe|api)/.test(url)), 'the sitemap lists /unsubscribe or the API');
});

await check('canonical, Open Graph and Twitter tags point at this site, and the Open Graph image is a PNG', async () => {
  const body = await pageHtml('/');
  const tag = (pattern: RegExp) => pattern.exec(body)?.[1];
  const canonical = tag(/<link rel="canonical" href="([^"]+)"/);
  const image = tag(/<meta property="og:image" content="([^"]+)"/);
  assert(canonical && new URL(canonical).origin === siteOrigin, `canonical is ${canonical}: NEXT_PUBLIC_SITE_URL is probably wrong`);
  assert(image && new URL(image).origin === siteOrigin, `og:image is ${image}`);
  assert(tag(/<meta name="twitter:card" content="([^"]+)"/) === 'summary_large_image', 'no summary_large_image Twitter card');
  const response = await fetch(new URL(new URL(image).pathname, siteOrigin), { signal: AbortSignal.timeout(20_000) });
  assert(response.status === 200 && (response.headers.get('content-type') ?? '').includes('image/png'), `the Open Graph image returned ${response.status} ${response.headers.get('content-type')}`);
});

const jsonPost = (path: string, body: string) => request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body });

await check('POST /api/report rejects a body that is not JSON (400) or is over 32KB (413)', async () => {
  const notJson = await jsonPost('/api/report', 'not json');
  assert(notJson.status === 400, `not JSON returned ${notJson.status}`);
  const big = await jsonPost('/api/report', JSON.stringify({ x: 'a'.repeat(40_000) }));
  assert(big.status === 413, `a 40KB body returned ${big.status}`);
});

await check('POST /api/report and /api/pilot return 400 with field errors for an empty request (so the services are configured)', async () => {
  for (const path of ['/api/report', '/api/pilot']) {
    const response = await jsonPost(path, '{}');
    const body = (await response.json()) as { ok?: unknown; error?: unknown; fields?: Record<string, string> };
    assert(
      response.status === 400 && body.error === 'validation' && body.fields && Object.keys(body.fields).length > 0,
      `${path} returned ${response.status} ${JSON.stringify(body).slice(0, 120)}. A 500 usually means an environment variable is missing or wrong.`,
    );
  }
});

await check('GET on the form endpoints returns 405', async () => {
  for (const path of ['/api/report', '/api/pilot']) assert((await request(path)).status === 405, `${path} did not return 405`);
});

await check('Turnstile rejects a made-up token (403 bot_check), so the secret key is set and Cloudflare can be reached', async () => {
  const response = await jsonPost(
    '/api/report',
    JSON.stringify({
      answers: { inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more', storeys: 9 },
      contact: {
        firstName: 'Smoke',
        email: 'smoke-test@example.invalid',
        organisation: 'Smoke test',
        role: 'other',
        roleOther: 'Automated smoke test',
        orgType: 'other',
        buildingsBand: '1',
        marketingConsent: false,
      },
      turnstileToken: 'smoke-test-token-that-cloudflare-will-not-accept',
    }),
  );
  const body = (await response.json()) as { error?: string; reportId?: string };
  assert(
    response.status !== 200,
    `the site accepted a fake Turnstile token and saved report ${body.reportId} for smoke-test@example.invalid. A Cloudflare TEST secret key is probably set as TURNSTILE_SECRET_KEY. Delete that row.`,
  );
  assert(response.status === 403 && body.error === 'bot_check', `returned ${response.status} ${JSON.stringify(body).slice(0, 120)}, expected 403 bot_check`);
});

await check('the unsubscribe link rejects a bad token: GET redirects to the "not valid" page, POST returns 400', async () => {
  const get = await request('/api/unsubscribe?token=smoke.test');
  assert(get.status === 303, `GET returned ${get.status}, expected 303`);
  const location = get.headers.get('location') ?? '';
  assert(new URL(location, siteOrigin).pathname === '/unsubscribe' && location.includes('status=invalid'), `redirected to ${location}`);
  const post = await request('/api/unsubscribe?token=smoke.test', { method: 'POST' });
  assert(post.status === 400, `POST returned ${post.status}, expected 400`);
});

if (launch) {
  console.log('\nLaunch checks');
  const launchPages = ['/', '/checker', '/pilot', '/rpeep-regulations-explained', '/privacy', '/terms', '/cookies', '/accessibility'];

  for (const path of launchPages) {
    await check(`${path} has no placeholder text and no localhost address`, async () => {
      const text = readableText(await pageHtml(path));
      const found = [...new Set(text.match(PLACEHOLDER) ?? [])];
      assert(found.length === 0, `placeholders left: ${found.join(', ')}`);
      assert(!/localhost|127\.0\.0\.1/.test(text), 'a localhost address is in the page');
    });
  }

  await check('the home page loads the Plausible analytics script for this domain', async () => {
    const body = await pageHtml('/');
    const domain = /<script[^>]*data-domain="([^"]+)"[^>]*src="https:\/\/plausible\.io\/js\/script\.js"|<script[^>]*src="https:\/\/plausible\.io\/js\/script\.js"[^>]*data-domain="([^"]+)"/.exec(body);
    assert(domain, 'no Plausible script: NEXT_PUBLIC_PLAUSIBLE_DOMAIN is probably not set (it must be set before the build)');
    assert((domain[1] ?? domain[2]) === new URL(siteOrigin).hostname, `Plausible data-domain is ${domain[1] ?? domain[2]}, expected ${new URL(siteOrigin).hostname}`);
  });

  await check('the site is served over HTTPS', async () => {
    assert(new URL(siteOrigin).protocol === 'https:', `${siteOrigin} is not https`);
  });
}

console.log('');
if (failures.length > 0) {
  console.error(`${failures.length} check(s) failed:\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log('All checks passed.');
