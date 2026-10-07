# CLAUDE.md

Rules for Claude Code in this repo. The full spec is `docs/PRD.md` (the "PRD"). This file summarises PRD sections 2, 4, 13 and 15.

## Always

- Follow `docs/PRD.md` exactly. If something is unclear, ask the founder instead of guessing.
- Never invent features, statistics, testimonials, customer logos, user numbers or copy. Use only copy from the PRD.
- Ask before adding any dependency that is not named in PRD section 4. Pin exact versions in `package.json` (no `^` or `~`).
- Do not change the scope engine logic or the regulation copy without showing the diff and the PRD section it matches.
- Run `npm run typecheck && npm run lint && npm test` and show the output before saying a task is done. Never start the next phase with failing tests.
- Build phase by phase (PRD section 16). Do not build ahead of the approved phase.

## Scope (PRD section 2)

Phase 1 is a marketing site, a free RPEEP Scope Checker and lead capture. The full RPEEP app is Phase 2 and is out of scope.

Do NOT build: user accounts, login or dashboards; the RPEEP management app; payments; FRA PDF upload or AI extraction (only a "coming soon" checkbox); any collection of residents' personal or health data (the tool asks about the building only); rules for Wales, Scotland or Northern Ireland; an admin panel; a blog, CMS or multiple languages.

Hard rules:

- Do not mention any employer of the founder anywhere in code, copy or metadata.
- Every regulatory statement in the UI must match PRD section 7 word-for-word in meaning, with its regulation number.
- Tone: plain English, short sentences, active voice. Banned words: "revolutionary", "game-changing", "seamless", "cutting-edge", "guarantee compliance". Say "helps you evidence", never "makes you compliant".

## Architecture (PRD section 4)

- One Next.js App Router app on Vercel (functions in `lhr1`), one Supabase database in London, one pure TypeScript scope engine shared by browser and server. TypeScript `strict`.
- `src/lib/scope/engine.ts` is a pure function: no React, no network, no system-clock dates. `evaluateScope` and `getNextQuestion` follow PRD section 7B exactly.
- The browser runs the engine for instant results. The server runs it again on every submission and ignores any result sent by the browser. The stored result and the PDF come from the server run.
- All brand text, legal company details, links and regulation citations live in `src/content/`, never hard-coded in components. `[BRAND]`, `[DOMAIN]` and company details are placeholders replaced via `src/content/site.ts` only.
- Secrets (Supabase service role key, Resend key, Turnstile secret, Upstash token, unsubscribe signing secret) are read only in server code. Nothing secret uses the `NEXT_PUBLIC_` prefix.
- The database is written only from API routes using the service role key. Row Level Security is ON with no public policies.
- Zod schemas in `src/lib/schemas.ts` are shared by client and server.

## Legal, privacy and security (PRD section 13)

- Collect business contact details and building facts only. Never collect resident or health data, and say so in the privacy notice.
- The "guidance only, not legal advice" disclaimer appears on the checker intro, every result, the PDF and the email.
- Never store raw IP addresses (salted SHA-256 hash only). Check `email_suppressions` before any non-transactional email.
- Escape all user input in emails and the PDF. Never render user input as HTML.
- Set the security headers in PRD section 13. Request body limit 32KB on API routes. Turnstile and rate limiting on both form endpoints.
- Scrub personal data from Sentry events in `beforeSend`.
- Leave `TODO(founder)` where the founder must confirm something (provider regions and transfer terms, company details, Appendix D wording).

## Testing (PRD section 15)

- "No bugs" means every test passes in CI, every manual check is ticked, and the founder has signed off every regulatory sentence.
- Engine tests T1–T21 and `getNextQuestion` tests N1–N13 are written before the engine code. Boundary cases: 18.0m is in scope; 11.0m with simultaneous evacuation is not; 11.1m is; 6 storeys does not meet C2, 7 does.
- Also required: schema tests, readiness tests, a `fast-check` property test for the engine, API tests with mocked Supabase, Resend and Turnstile, Playwright e2e (desktop Chrome and mobile Safari viewports) and `@axe-core/playwright` scans with zero violations.

## Commands

`npm run dev` · `build` · `typecheck` · `lint` · `test` (Vitest) · `e2e` (Playwright) · `check:bundle` (no server secrets in the client bundle) · `check:launch` (no placeholders left) · `smoke -- <url> [--launch]` (read-only checks of a running site) · `sample:pdfs`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
