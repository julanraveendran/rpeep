# RPEEP Scope Checker

A one-page, trust-first marketing site with a free **RPEEP Scope Checker** and a **pilot sign-up**. The full spec is
[`docs/PRD.md`](docs/PRD.md); the rules for working in this repo are in [`CLAUDE.md`](CLAUDE.md).

This is Phase 1 only (PRD section 2): no accounts, no payments, no resident data.

## Run it

```bash
npm install
cp .env.example .env.local     # fill in every value (see below)
npm run dev                    # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run typecheck` | TypeScript (`strict`) |
| `npm run lint` | ESLint |
| `npm test` | Vitest: scope engine, schemas, API handlers, emails, PDF, copy checks |
| `npm run e2e` | Playwright: builds, starts the site and runs the end-to-end and axe tests |
| `npm run check:bundle` | After a build, fails if a server secret is in the client bundle |
| `npm run sample:pdfs` | Writes a sample report PDF for each result type to `/tmp/rpeep-sample-pdfs` |

The server refuses to start if a required environment variable is missing (`src/lib/env.ts`). For CI and tests only,
`SKIP_ENV_VALIDATION=1` skips that check.

## Where things are

- `src/lib/scope/engine.ts`: the scope engine, a pure function used by the browser and again by the server.
- `src/content/`: all brand text, company details, regulation copy, questions and page copy. Replace `[BRAND]`, `[DOMAIN]` and the company details in `src/content/site.ts` only.
- `src/lib/api/`: the report, pilot and unsubscribe handlers. External services are passed in, so tests use fakes.
- `supabase/migrations/`: the database. `0001` is the PRD SQL, byte for byte.

## Before launch (you, not the code)

Search the code for `TODO(founder)`. In short, from PRD section 17:

- Choose the brand and domain; fill in `src/content/site.ts` (brand, domain, company or trading details, founder first name, ICO number if it applies).
- Check every regulatory sentence against [SI 2025/797](https://www.legislation.gov.uk/uksi/2025/797/made), and confirm the height help text against Appendix D of Approved Document B.
- Confirm each provider's region and transfer terms in the privacy notice, audit the cookie page in browser dev tools, and have the privacy notice and terms reviewed.
- Create the Supabase project (London), run the migrations, enable `pg_cron`, and set up Resend, Turnstile, Upstash, Plausible and Sentry.
- Run the manual checks in PRD section 15D (email clients, PDF viewers, browsers, Lighthouse on the live site).

## Dependencies

`npm audit --omit=dev --audit-level=high` is clean. A full `npm audit` reports one advisory for `braces` through the
lint tooling (`eslint-config-next`); it has no patched version and never ships to users.
