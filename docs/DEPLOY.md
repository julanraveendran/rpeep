# Deploy guide: from this repo to a live site

This guide takes you from the code in this repo to a live site on your own domain. It is PRD section 16, phase 12:
GitHub Actions CI (PRD 15D), then Vercel in region `lhr1`, the environment variables, and your domain.

Read it once from top to bottom, then work through the steps in order. Each step ends with a box to tick.

In this guide, `[DOMAIN]` means your real domain (for example `example.co.uk`) and `[BRAND]` means your real brand
name. Where a step says "write down", keep the value in a password manager. You will paste it somewhere later.

The names of buttons and menus were checked against each provider's published documentation on 7 October 2026. Screens
change. If a button has a different name, follow the provider's own help page for the same task. Anything marked
**TODO(founder)** is a decision or a check that only you can make.

## What you will have at the end

- The site live on `https://[DOMAIN]`, running in London (`lhr1`).
- Every push to GitHub checked by CI: typecheck, lint, unit tests, end-to-end and accessibility tests, and a smoke test
  of a production build.
- A push to `main` that passes everything deploys to production by itself. Nothing else can.
- A smoke test of the live site after every deploy.

## How deploys work

1. You push to any branch. CI runs (`.github/workflows/ci.yml`). Nothing deploys.
2. You merge to `main`. CI runs again. If everything passes **and** you have switched deploys on (step 10), it runs
   three more jobs in order:
   - **Launch checks.** `npm run check:launch` fails while any `[BRAND]`, `[DOMAIN]`, company detail or "to be
     confirmed" is left in `src/content/`. It also checks that your live address matches the domain in `site.ts`.
   - **Deploy.** It checks that this commit is still the newest on `main`, then uploads the source to Vercel and
     deploys it to production. Vercel builds the site on its own servers, using the settings you stored in Vercel.
   - **Smoke test of the live site.** `npm run smoke -- https://[DOMAIN] --launch` reads the pages and checks the
     headers, the sitemap, the analytics script and the HTTP to HTTPS redirect.
3. Vercel's own "deploy on every push" feature is switched off for every branch in `vercel.json`
   (`git.deploymentEnabled: false`). The only way to production is through CI.

Why the deploy job is built this way:

- Only one job holds the Vercel token, and it runs none of this project's code. No `npm install` runs in it.
- Your production settings (database key, email key and so on) live in Vercel. They never go to GitHub, and they are
  never on a CI runner.
- Every job that does run project code has no secrets.

## Before you start

You need:

- [ ] A **domain** you own, and a **company mailbox** on it (Google Workspace or Microsoft 365), for example
      `hello@[DOMAIN]`. (PRD section 17, "Before Phase 8".)
- [ ] Accounts: GitHub, Vercel, Supabase, Resend, Cloudflare (for Turnstile), Upstash, Plausible, Sentry.
- [ ] A computer with Node 22, Git and this repo cloned, for the one-off commands below.
- [ ] About half a day, plus waiting for DNS (usually minutes, sometimes hours).

Costs and plans (**TODO(founder)**: check each provider's current pricing page):

- **Vercel.** The free Hobby plan is for non-commercial personal use only. Vercel's fair-use rules count a site that
  advertises a product or service, and collects leads for it, as commercial use. Plan on the **Pro** plan. Pro also
  gives you a team, which lets you limit the access token to this one project.
- **Plausible.** Funnels and custom properties are Business-plan features. The 30-day free trial includes them. After
  the trial, you need that plan to keep the PRD's funnel (step 6), or you can live without it.
- **GitHub.** CI minutes are free for a public repo. A private repo on the Free plan gets 2,000 minutes a month, which
  covers roughly 80 to 130 pushes. See the note on private repos in step 10.
- Supabase, Resend, Upstash and Sentry all have free plans that cover this site's launch needs.

## Step 1. Fill in the content

Everything the visitor sees comes from `src/content/`. You change it in two files.

1. Open `src/content/site.ts` and replace each value marked `TODO(founder)`:
   - `brandName` and `domain` (the domain has no `https://` and no slash: `example.co.uk`)
   - `founder.firstName`
   - `company.legalForm`, then the matching company or sole-trader details
   - `company.icoRegistrationNumber`, once you have paid the ICO fee, if it applies to you
2. Open `src/content/legal.ts`. Wherever the privacy notice still says `[To be confirmed before launch]`, confirm the
   provider's region and transfer terms and write the real wording. Section "Provider data handling" at the end of this
   guide lists each provider's legal pages.
3. Check every regulatory sentence against [SI 2025/797](https://www.legislation.gov.uk/uksi/2025/797/made), and the
   height help text against Appendix D of Approved Document B. Have the privacy notice and terms reviewed
   (PRD section 17).
4. Run the checks on your computer:

   ```bash
   npm ci
   SITE_URL=https://[DOMAIN] npm run check:launch
   npm run typecheck && npm run lint && npm test
   ```

   On Windows PowerShell, set the address first: `$env:SITE_URL = "https://[DOMAIN]"`, then `npm run check:launch`.

   `check:launch` must print "Launch check passed". It also lists every `TODO(founder)` still in the code. A green
   result does not mean you have signed those off. That is your job.
5. Commit and push to a branch, not to `main`. Wait for CI to go green.

The tests read the brand, domain and contact details from `src/content/site.ts`, so they pass with your real values.

- [ ] `check:launch` passes and CI is green on your branch.

## Step 2. Supabase (database, London)

1. Create a project. When you choose the region, pick **West Europe (London)** (`eu-west-2`). Do not pick the general
   "Europe" region: it can place the project in Zurich instead. Choose a strong database password and write it down.
2. Enable the `pg_cron` extension **before** you run the migrations: Dashboard, **Integrations**, **Cron**, enable it.
   (The retention job in `0002_retention.sql` needs it. It deletes reports and pilot applications after 24 months.)
3. Run the four migrations, in order, from `supabase/migrations/`:
   `0001_init.sql`, `0002_retention.sql`, `0003_pilot_role_other.sql`, `0004_service_role_grants.sql`.
   The simplest way is to paste each file into **SQL Editor** and run it. Pick one method and keep to it: the editor
   does not record migration history, so do not mix it with the Supabase command line later.
   `0004` gives the service role explicit access to the three tables. Without it, a project that does not grant access
   by default would refuse every save with "permission denied".
4. Copy the values:
   - **Project URL**, like `https://abcdefgh.supabase.co`, from the **Connect** dialog. This is `SUPABASE_URL`.
   - The **secret key**, starting `sb_secret_`, from **Settings**, **API Keys**. Put it in `SUPABASE_SERVICE_ROLE_KEY`.
     The variable name still says "service role", and the secret key does that job. Never use the publishable key,
     and never put either key in a variable starting `NEXT_PUBLIC_`.
   - If the project still shows a "legacy" `service_role` key and the secret key does not work in step 12, use the
     legacy key instead.

- [ ] Three tables exist (`reports`, `pilot_applications`, `email_suppressions`) with Row Level Security on.
- [ ] You have written down `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Step 3. Resend (email)

1. **Domains**, **Add Domain**, enter `[DOMAIN]`. For the sending region choose **Ireland (eu-west-1)**, the nearest to
   the UK. Be aware that Resend stores account data (email logs and metadata) in the US whichever region you choose.
   Note that for the privacy notice (**TODO(founder)**).
2. Open the domain's records and add **every** record Resend shows at your DNS host. Copy them exactly. Their names and
   types differ for each domain, so do not type them from memory. By default they sit on a `send` subdomain.
3. Click **Verify DNS Records**. This can take up to 72 hours, but is usually quick.
4. Add a DMARC record yourself, because Resend does not create one. A TXT record at `_dmarc.[DOMAIN]` with the value
   `v=DMARC1; p=none; rua=mailto:hello@[DOMAIN];`. Move to `p=quarantine`, then `p=reject`, once reports look clean.
5. **API Keys**, create one. If Resend lets you limit it to sending, and to this domain, do so. Write it down as
   `RESEND_API_KEY`.
6. Decide the addresses:
   - `EMAIL_FROM`: `[BRAND] <hello@[DOMAIN]>`, written with your real brand and domain, **without square brackets**.
     The server refuses to start if it still has `[` or `]`.
   - `EMAIL_REPLY_TO`: the mailbox that gets replies.
   - `FOUNDER_EMAIL`: where the new-report and new-pilot notifications go.

- [ ] The domain shows **Verified** in Resend.
- [ ] You have written down `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` and `FOUNDER_EMAIL`.

## Step 4. Cloudflare Turnstile (bot check)

1. Cloudflare dashboard, **Turnstile**, **Add widget**.
2. Widget mode: **Managed**. (The form shows the widget only when a visitor needs to interact.)
3. Hostnames: add `[DOMAIN]`. That covers `www.[DOMAIN]` and every other subdomain too. Use a bare domain, with no
   `https://`, port or wildcard.
4. Copy the **site key** (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`) and the **secret key** (`TURNSTILE_SECRET_KEY`).

Notes:

- **Never put Cloudflare's test keys in Vercel Production.** The test site key `1x00000000000000000000AA` and the test
  secret `1x0000000000000000000000000000000AA` always pass, so they would turn the bot check off. The smoke test
  catches this: if the live site accepts a made-up token, it stops with exit code 3. It will also have saved one junk
  report row for `smoke-test@example.invalid`, which you should delete.
- For work on your own computer, use the test keys in `.env.local`. Cloudflare says dummy keys work on any domain,
  including `localhost`. PRD section 17 says to add `localhost` to the widget. Cloudflare recommends against that for a
  production widget. **TODO(founder)**: your call. The test keys are the safer choice.
- Do not add `vercel.app` to the hostnames. That would let every Vercel user's site use your widget.
- Turnstile runs on Cloudflare's network and may process data outside the UK. Read Cloudflare's Turnstile privacy
  addendum before you finish the privacy notice.

- [ ] You have written down `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`, and they are the real keys.

## Step 5. Upstash (rate limiting)

1. Console, **Redis**, **Create Database**. Pick the primary region **London, UK (eu-west-2)** and no read regions.
   If London is not offered on your plan, pick the nearest EU region and note it for the privacy notice
   (**TODO(founder)**).
2. On the database's **Details** tab, copy the **REST URL** (`UPSTASH_REDIS_REST_URL`) and the normal **REST Token**
   (`UPSTASH_REDIS_REST_TOKEN`). Do not use the read-only token: rate limiting has to write.

If Upstash is down or unreachable, rate limiting lets requests through rather than blocking everyone. The bot check
still applies.

- [ ] You have written down `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

## Step 6. Plausible (analytics)

1. Add a site named exactly `[DOMAIN]` (the bare domain, the same as `site.domain`).
2. The site loads Plausible's standard script, `https://plausible.io/js/script.js`, with `data-domain` set from
   `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`. Plausible introduced a newer per-site snippet in October 2025 and says the older one
   keeps working. Keep the current one unless you decide to move. If you move, the layout and the smoke check both
   change.
3. Plausible does not show custom events until you create a **goal** for each. **Site settings**, **Goals**,
   **Add goal**, **Custom event**. Type each name exactly, in lower case. You need nine:
   `cta_clicked`, `checker_started`, `question_answered`, `checker_completed`, `readiness_completed`,
   `report_requested`, `report_downloaded`, `pilot_started`, `pilot_submitted`.
4. Custom properties also stay hidden until registered. **Site settings**, **Custom Properties**, add eight:
   `location`, `step`, `status`, `score`, `orgType`, `buildingsBand`, `priceBand`, `willingToPay`.
5. Create the funnel from PRD section 14C: `checker_started`, then `checker_completed`, then `report_requested`, then
   `pilot_submitted`. Goals are not back-filled. Counting starts when each goal is created.
6. Events from `localhost`, or from a host that is not the site's registered domain, are dropped. That is expected.

Plausible hosts everything in the EU.

- [ ] Nine goals and eight properties exist, and the funnel is saved.
- [ ] The Plausible site name, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` and your domain are the same.

## Step 7. Sentry (errors)

1. Create the **organisation** first, and choose **Data Storage Location: European Union** (Frankfurt). You cannot
   change this later. The only way to switch is a new organisation.
2. Create a **Next.js** project. Copy its **DSN** from **Settings**, **Client Keys (DSN)**.
3. Put the same DSN in two variables: `SENTRY_DSN` (server errors) and `NEXT_PUBLIC_SENTRY_DSN` (browser errors). A DSN
   only lets someone send events, so it is safe to expose. The site's content security policy allows exactly the host
   in the DSN, and no other.
4. The free Developer plan allows 5,000 errors a month. After that, new events are dropped, with no charge.

Sentry scrubs email addresses and names before sending (`beforeSend`). Errors are reported to Sentry only if the DSN is
set, so you can leave both blank and the site still works.

- [ ] You have written down the DSN.

## Step 8. Vercel project, region and settings

### 8a. Make two random secrets

On your computer:

```bash
openssl rand -hex 32   # run it twice: one for UNSUBSCRIBE_SECRET, one for IP_HASH_SALT
```

Each must be at least 43 characters. This command gives 64. Never reuse one for both.

### 8b. Create the project without connecting Git

If you use "Import Git Repository" in the dashboard, Vercel starts its own deploy of your repo. Avoid it. Use the command
line instead:

```bash
npx vercel@62.7.0 login
npx vercel@62.7.0 link
```

Answer the questions: pick your team, **No** to "link to an existing project", give the project a name, keep the
detected settings (Next.js, `./`), and answer **No** to any question about connecting a Git repository. The exact
questions can differ between versions of the tool. This creates
`.vercel/project.json` (it is git-ignored). It holds two IDs you need in step 10: `orgId` and `projectId`.

### 8c. Project settings

In the Vercel dashboard, open the project, **Settings**:

- **Functions**, **Function Region**: **London, United Kingdom (lhr1)**. `vercel.json` also pins it.
- **General**, **Node.js Version**: **22.x**. `package.json` says `"node": "22.x"`, which takes priority over this
  setting. CI tests on Node 22, so production runs the same version.
- **Git**: make sure no repository is connected. If one is, click **Disconnect**.
- **Deployment Protection**: leave **Standard Protection** on. It protects the long `*.vercel.app` addresses and leaves
  your production domain public. The live smoke test targets your domain, so it still works.

### 8d. Environment variables

**Settings**, **Environment Variables**. Add each one below. For every one:

- Untick **Preview** and **Development**. Keep only **Production**. You do not use previews.
- Tick **Sensitive** (some screens call it "Secret") for every variable that does not start with `NEXT_PUBLIC_`. Vercel
  then hides the value from everyone, including you.
- The four `NEXT_PUBLIC_` variables cannot be sensitive, and do not need to be. They go into the browser anyway.

| Variable | Value | From |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://[DOMAIN]` (the address visitors use, no trailing slash) | step 9 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | real site key | step 4 |
| `TURNSTILE_SECRET_KEY` | real secret key | step 4 |
| `SUPABASE_URL` | `https://<ref>.supabase.co` | step 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | the secret key | step 2 |
| `RESEND_API_KEY` | `re_...` | step 3 |
| `EMAIL_FROM` | `[BRAND] <hello@[DOMAIN]>` with real values, no square brackets | step 3 |
| `EMAIL_REPLY_TO` | your mailbox | step 3 |
| `FOUNDER_EMAIL` | where notifications go | step 3 |
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | step 5 |
| `UPSTASH_REDIS_REST_TOKEN` | the token | step 5 |
| `UNSUBSCRIBE_SECRET` | 64 random hex characters | 8a |
| `IP_HASH_SALT` | 64 other random hex characters | 8a |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | `[DOMAIN]`, bare | step 6 |
| `SENTRY_DSN` | the DSN (optional) | step 7 |
| `NEXT_PUBLIC_SENTRY_DSN` | the same DSN (optional) | step 7 |

Rules that matter:

- The four `NEXT_PUBLIC_` values are built into the site when Vercel builds it. Set them **before** the first deploy.
  If you change one later, it only applies to a new deployment: run the workflow again (step 11), so the change goes
  through the launch checks and the live smoke test.
- Never set `SKIP_ENV_VALIDATION` in Vercel. The site checks its settings when it starts, and refuses to start if one
  is missing or malformed. That is what you want.
- Never use Cloudflare's test keys here (step 4).
- Keep `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN` identical.

- [ ] The project exists, is not connected to Git, and its region shows `lhr1`.
- [ ] The 13 required variables, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, and the 2 Sentry ones (if you use Sentry) are set for
      Production only.

## Step 9. Connect your domain

1. In the project, **Settings**, **Domains**, add `[DOMAIN]`. Vercel offers to add `www.[DOMAIN]` too. Accept.
2. Vercel's Domains card shows the exact DNS records for your project. Copy them from that card, not from a guide:
   - the apex (`@`): an **A** record
   - `www`: a **CNAME** record
3. Add them at your DNS host. Three traps:
   - Do not put a CNAME on the apex.
   - If your DNS is on Cloudflare, set these records to **DNS only** (the grey cloud). The orange proxy stops Vercel
     from issuing the certificate.
   - If you have a CAA record, it must allow `letsencrypt.org`.
4. Make the **apex** the primary address: click **Edit** on `www.[DOMAIN]` and set it to redirect to `[DOMAIN]` (a 307
   or 308 redirect). The site, `SITE_URL`, `NEXT_PUBLIC_SITE_URL` and the Plausible domain all use the apex.
5. Wait until both domains show **Valid Configuration**. Vercel then issues the certificate by itself and redirects
   HTTP to HTTPS.
6. Set Turnstile and Resend up for this same domain (they already are, if you did steps 3 and 4).

Do not switch deploys on (step 10) until the domain shows **Valid Configuration**. The live smoke test needs it.

About the security header `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`:

- It tells browsers to use HTTPS for `[DOMAIN]` **and every subdomain** for two years. Check that anything you run on a
  subdomain (a mail webpage, a staging site) works over HTTPS.
- `preload` only signals willingness. It does nothing until you submit the domain to hstspreload.org. **Do not submit it
  until you are sure.** Removing a domain from the list takes months. Use their check form first, which does not submit.
- Vercel adds a weaker default header on custom domains. After the first deploy, check which one you get:
  `curl -sI https://[DOMAIN] | grep -i strict-transport`. It should show the full value above. Check `www` too.
  If you ever want to submit to the preload list, the redirect from `www` must carry the header too.

- [ ] Both domains show Valid Configuration, and `https://[DOMAIN]` is the primary.

## Step 10. GitHub: main branch, secrets, variables

### 10a. Create `main`

There is no `main` branch yet. Production deploys only come from `main`.

```bash
git fetch origin
git push origin <the commit you want to launch>:refs/heads/main
```

Then **Settings**, **Branches**, and set the default branch to `main`. This first push starts a CI run on `main`. That
run does not deploy, because deploys are still off. Wait for it to go green.

### 10b. Environment and secrets

Create the Vercel token: Vercel, **Account Settings**, **Tokens**. Give it a name like `rpeep-ci`. Choose the narrowest
**Scope** available (this project only, or your team), and an expiry (for example 90 days). Put a reminder in your
calendar to renew it. Copy the token once. You cannot see it again.

In GitHub: **Settings**, **Environments**, **New environment**, name it exactly `production`. In it:

- **Deployment branches and tags**: **Selected branches**, add `main`. Now no other branch can read the token.
- **Environment secrets**: add
  - `VERCEL_TOKEN`: the token
  - `VERCEL_ORG_ID`: `orgId` from `.vercel/project.json`
  - `VERCEL_PROJECT_ID`: `projectId` from `.vercel/project.json`
- **Required reviewers** (optional, recommended): add yourself. Every deploy then waits for your click.

Put these three as **environment** secrets, not repository secrets. Repository secrets can be read by a workflow on any
branch, including one that someone edits. The environment limits them to `main`.

If your repo is **private** on the GitHub **Free** plan, environments, their secrets and their branch rules are
**ignored**. You then have three choices: make the repo public, move to a paid GitHub plan, or accept repository
secrets, which are weaker. **TODO(founder)**: decide.

### 10c. Protect `main`

**Settings**, **Branches** (or **Rules**), add a rule for `main`:

- Require a pull request before merging.
- Require status checks: **Typecheck, lint and unit tests**, **End-to-end and accessibility tests**, and
  **Smoke test of a production build**. Use these exact names. Do not require the launch, deploy or live-smoke jobs:
  GitHub counts a skipped job as passed.
- Block force pushes and deletion of `main`.

### 10d. Variables

**Settings**, **Secrets and variables**, **Actions**, **Variables** tab, **New repository variable**:

- `SITE_URL` = `https://[DOMAIN]`. Start with `https://`, no path, no trailing words.
- `DEPLOY_ENABLED` = `true`. Set this **last**, once everything above is done and the domain is valid.

Both must be **repository** variables, not environment variables. GitHub reads `DEPLOY_ENABLED` before it chooses an
environment, so an environment variable would not be seen, and deploys would silently never run.

- [ ] `main` exists, is the default branch, and CI is green on it.
- [ ] The `production` environment has the three secrets and the `main`-only rule.
- [ ] `SITE_URL` is set. (`DEPLOY_ENABLED` is not set yet.)

## Step 11. First deploy

1. Check the list: step 1 done, steps 2 to 8 values entered in Vercel, step 9 domain valid, step 10 secrets in place.
2. Set `DEPLOY_ENABLED` to `true`.
3. GitHub, **Actions**, **CI**, **Run workflow**, branch `main`. (A normal push to `main` does the same. The button
   saves you an empty commit.)
4. Watch the run:
   - **Launch checks** must pass. If not, it lists what is left.
   - **Deploy** takes a few minutes, because Vercel builds the site. The log ends with the deployment address. If you
     required a reviewer, click **Approve** first.
   - **Smoke test of the live site** should pass. It tries up to four times, 30 seconds apart.
5. If anything fails, read "If something goes wrong" below.

Later deploys need nothing from you: merge to `main`. Run the workflow by hand (step 3 above) after you change a
Vercel variable.

## Step 12. Prove it works

The smoke test reads pages. It cannot show that your keys are right, because a wrong key gives the same answers as a
right one for everything it does. So do this once by hand, in a normal browser, on `https://[DOMAIN]`. This is the last
item in PRD section 15D.

1. Open `/checker`, run it for a building that is in scope, and request the report with your own email address. The
   Turnstile widget must load and pass.
2. Check the four results of that one submission:
   - a **row** appears in Supabase, in `reports`
   - the **report email** arrives, with the PDF attached
   - the **founder notification** arrives at `FOUNDER_EMAIL`
   - the **unsubscribe link** in the report email works
3. Fill in `/pilot` and check the same four things for `pilot_applications`.
4. Do it on both `https://[DOMAIN]` and `https://www.[DOMAIN]` (the second should redirect to the first).
5. If the PDF downloads but no email arrives, the Resend settings need attention (domain not verified, wrong key, or
   `EMAIL_FROM` not on the verified domain). The site still gives the visitor the PDF in that case.
6. Delete the test rows in Supabase if you do not want to keep them.

Then the rest of the manual checklist from PRD section 15D:

- [ ] Every regulatory sentence on the site, PDF and emails checked by you against SI 2025/797.
- [ ] Report email renders correctly in Outlook desktop, Outlook web, Gmail web and iPhone Mail.
- [ ] PDF opens correctly in Microsoft Edge, Adobe Acrobat and iPhone Files.
- [ ] Site tested in Chrome, Edge, Firefox and Safari (macOS and iOS).
- [ ] Lighthouse 95+ in all four categories on `/`, `/checker`, `/pilot` (mobile).
- [ ] 320px width and 400% zoom show no horizontal scrolling.
- [ ] Footer company details are real and correct.
- [ ] No employer name appears anywhere (search the codebase and the built site).
- [ ] Cookie audit done and `/cookies` matches reality (open dev tools, **Application**, and list every cookie and
      storage item).
- [ ] Test submission appears in Supabase; founder notification arrives; unsubscribe works.

And from PRD section 17, "Before launch":

- [ ] Send yourself reports for all three result types and check them in Outlook and Gmail.
- [ ] Pay the ICO fee if it applies, and add the number to the privacy notice.
- [ ] Soft-launch to 2 or 3 trusted people and fix what they find.
- [ ] Remove any contacts from your outreach list that you know through your employer.

Also check these once:

- [ ] `curl -sI https://[DOMAIN]` shows the security headers (see step 9 for HSTS).
- [ ] In Plausible, your own visit appears and the `checker_started` event shows after you use the checker.
- [ ] In Vercel, the project's **Logs** show no errors.
- [ ] Run `npm audit --omit=dev --audit-level=high` and fix anything high or critical (CI also runs it on every push).

## If something goes wrong

**Go back to the last good version.** Vercel dashboard, **Deployments**, find the last good production deployment,
open its menu and choose **Instant Rollback**. Vercel may then stop moving production to new deployments until you
promote one, so read the banner it shows. Then fix the problem and deploy again. (If you have no earlier deployment,
there is nothing to go back to.)

| What you see | What it means | What to do |
| --- | --- | --- |
| Launch checks fail, "placeholder(s) left" | A `[BRAND]`, `[DOMAIN]` or "to be confirmed" is left | Fix it in `src/content/`, see step 1 |
| Launch checks fail on `SITE_URL` | The variable is empty, not `https://`, has a path, or is a different site from `site.ts` | Fix the `SITE_URL` repository variable |
| The Deploy job fails straight away with a Vercel error | Token expired or wrong, or the IDs are wrong | Make a new token, check the three secrets are in the `production` environment |
| The Deploy job says "main has moved on" | A newer commit is on `main`, so this older one was skipped on purpose | Nothing. The newer run deploys |
| Build fails on Vercel | A code or settings problem | Open the build log in the Vercel dashboard |
| Every page returns a 500 | The site refused to start: a required variable is missing or malformed | Vercel, **Logs**. The message names the variable. Fix it, then run the workflow again |
| Smoke test: "returned 401" | Deployment Protection is on for the address you gave | `SITE_URL` must be your public domain, not a `*.vercel.app` address |
| Smoke test: "returned 308" for a page | `SITE_URL` is the address that redirects (for example `www`) | Set `SITE_URL` to the primary address |
| Smoke test: Plausible domain is wrong | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` does not match | Fix it in Vercel, then run the workflow again (it is built in) |
| Smoke test: "sitemap URL" or "canonical" is wrong | `NEXT_PUBLIC_SITE_URL` is wrong | Same fix |
| Smoke test exits with code 3 | The live site accepted a fake bot-check token: a Cloudflare test key is set | Put the real secret key in Vercel, deploy again, delete the junk row in Supabase |
| Smoke test: HTTP does not redirect to HTTPS | The domain is not fully set up | Check step 9 |
| The form says "We couldn't verify you're human" on the live site | Wrong Turnstile secret, widget not allowing your domain, or mismatched site and secret keys | Check step 4 |
| The report form works but no email arrives | Resend domain not verified, wrong key, or `EMAIL_FROM` is on another domain | Check step 3. Resend's dashboard shows each send |
| Saving fails with "permission denied" | Migration `0004` has not run, or the wrong key is in `SUPABASE_SERVICE_ROLE_KEY` | Run `0004`, check step 2 |

## After launch

Weekly (PRD section 17):

- [ ] Review the Plausible funnel and the Supabase rows against the targets in PRD section 1.
- [ ] Reply to every pilot application within 3 working days.
- [ ] Re-check GOV.UK guidance and legislation.gov.uk. If anything changes, update `src/content/regulations.ts`, bump
      `engineVersion`, and re-run all tests.

When the calendar says so:

- [ ] **Renew the Vercel token** before it expires (step 10b). Update the `VERCEL_TOKEN` environment secret.
- [ ] **Update the pinned tools** now and then. `VERCEL_CLI_VERSION` in `ci.yml` is pinned, and the deploy job's checkout
      action is pinned to one commit. Dependabot proposes the second. If you change the first, run a deploy afterwards and
      check the log.
- [ ] GitHub's `ubuntu-latest` image is moving to a new Ubuntu from late October 2026. CI is pinned to `ubuntu-24.04`
      so that does not surprise you. Update the pin deliberately.

## Reference

### GitHub

| Where | Name | Value |
| --- | --- | --- |
| Environment `production`, secrets | `VERCEL_TOKEN` | token from step 10b |
| Environment `production`, secrets | `VERCEL_ORG_ID` | `orgId` in `.vercel/project.json` |
| Environment `production`, secrets | `VERCEL_PROJECT_ID` | `projectId` in `.vercel/project.json` |
| Repository variables | `SITE_URL` | `https://[DOMAIN]` |
| Repository variables | `DEPLOY_ENABLED` | `true` to switch deploys on |

### What each CI job does

| Job | Runs on | Secrets | What it does |
| --- | --- | --- | --- |
| Typecheck, lint and unit tests | every push | none | `npm run typecheck`, `npm run lint`, `npm test` |
| End-to-end and accessibility tests | every push | none | Playwright on desktop Chrome and an iPhone viewport, with axe scans |
| Smoke test of a production build | every push | none (fake values) | builds, scans the browser files for secrets, starts the site with the full environment check on, and runs `npm run smoke` |
| Dependency audit | every push | none | `npm audit --omit=dev --audit-level=high`. Does not block deploys |
| Launch checks | `main`, deploys on | none | `npm run check:launch` |
| Deploy to Vercel | `main`, deploys on | Vercel token | checks this is the newest commit on `main`, then `vercel deploy --prod` |
| Smoke test of the live site | after a deploy | none | `npm run smoke -- $SITE_URL --launch`, retried up to four times |

### Commands

| Command | What it does |
| --- | --- |
| `npm run check:launch` | Fails while a placeholder is left. With `SITE_URL=https://[DOMAIN]` it checks the address too |
| `npm run smoke -- <url>` | Read-only checks of a running site |
| `npm run smoke -- <url> --launch` | The same, plus: no placeholders in the pages, the Plausible script for this domain, HTTP redirects to HTTPS |
| `npm run check:bundle` | After a build, fails if a server secret is in the browser files |

### Provider data handling (for the privacy notice)

All of these were found through each provider's published pages and not read in full. **TODO(founder)**: read each
agreement yourself before you state a transfer mechanism in the privacy notice. The privacy notice must say where each
provider may process data and that safeguards apply to any transfer outside the UK (PRD section 13).

| Provider | Role | Where data may be processed | Legal pages |
| --- | --- | --- | --- |
| Vercel | Hosting | Functions run in London (`lhr1`). Requests also go through Vercel's global network. Vercel says it may process data in the US and other places | vercel.com/legal/dpa, security.vercel.com |
| Supabase | Database | London (`eu-west-2`) for the database. Backups, logs and Supabase's own service providers can sit elsewhere | supabase.com/legal/customer-resources/data-processing-addendum |
| Resend | Email | Sending region Ireland, but account data and logs are stored in the US | resend.com/legal/dpa, resend.com/legal/subprocessors |
| Cloudflare | Turnstile bot check | Mainly the US and EEA, accessed from anywhere | cloudflare.com/cloudflare-customer-dpa, cloudflare.com/turnstile-privacy-policy |
| Upstash | Rate limiting | The region you pick (London if offered). Upstash says it may process data globally | upstash.com/trust/dpa.pdf |
| Plausible | Analytics | EU only, on servers in Germany, Slovenia and Finland. No cookies, no IP storage | plausible.io/dpa, plausible.io/data-policy |
| Sentry | Error logs | EU (Frankfurt) if you chose it at set-up. Account data may be in the US | sentry.io/legal/dpa |
