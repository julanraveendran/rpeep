# Deploy guide: from this repo to a live site

This guide takes you from the code in this repo to a live site on your own domain. It covers PRD section 16, phase 12:
GitHub Actions CI (PRD 15D), then Vercel in region `lhr1`, the environment variables, and your domain.

Throughout, `[DOMAIN]` means your real domain (for example `example.co.uk`) and `[BRAND]` means your real brand name.
Replace them as you go. Nothing in this guide needs code changes except the content file in step 2.

DRAFT-MARKER: sections below are filled in once the facts are checked.

## How deploys work

- Every push to any branch runs CI (`.github/workflows/ci.yml`): typecheck, lint, Vitest, Playwright with the axe
  accessibility scans, and a smoke test of a production build.
- A push to `main` that passes all of those can deploy to production. A push to any other branch never deploys.
- Deploys are off until you set the repository variable `DEPLOY_ENABLED` to `true` (step 8). Until then CI still
  runs, and the deploy job is skipped.
- The deploy job runs `npm run check:launch` first. It fails while any `[BRAND]`, `[DOMAIN]` or other placeholder is
  left in the content. That is deliberate: it stops a half-finished site going live.
- Vercel's own Git integration is switched off for `main` in `vercel.json` (`git.deploymentEnabled.main: false`).
  This is so the only way to production is through CI. You do not need to connect the GitHub repo inside Vercel.
- After the deploy, CI runs `npm run smoke -- https://[DOMAIN] --launch` against the live site. It only reads pages.
  It also checks that a fake bot-check token is refused.

## 1. Accounts you need

GitHub, Vercel, Supabase, Resend, Cloudflare (Turnstile), Upstash, Plausible, Sentry, and a registrar for the domain.
(PRD section 17, "Before Phase 0".)
