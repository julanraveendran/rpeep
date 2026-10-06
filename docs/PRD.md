# RPEEP Scope Checker & Landing Page — PRD

Oct 6, 2026 · @Julan

## 1. Overview, goals and success metrics

Build a one-page, trust-first marketing site with a free **RPEEP Scope Checker** and a **pilot sign-up**, to test demand for an RPEEP management app without sales calls.

**Product name:** `[BRAND]` (placeholder — replace everywhere via one config file). **Domain:** `[DOMAIN]`.

**What the visitor gets:**

- A clear answer in under 2 minutes: is my building in scope of the Fire Safety (Residential Evacuation Plans) (England) Regulations 2025, and what must I do?
- A personalised PDF result report, emailed to them.
- A way to join the paid pilot of the full RPEEP app.

**What we get:** qualified leads (role, organisation, number of in-scope buildings, current method, biggest pain) without any calls.

**Success metrics (first 4 weeks after launch):**

| Metric | Target |
| --- | --- |
| Visitors who start the checker | 30% or more |
| Starters who finish the checker | 60% or more |
| Emails captured (result report requests) | 20 or more |
| Pilot sign-ups | 5 or more |
| Pilot sign-ups ticking "willing to pay" | 2 or more |
| Bugs found in the checker after launch | 0 logic errors |

**Decision rule:** hit the last two targets → build the full RPEEP app (Phase 2). Miss them → change message or idea, not more features.

## 2. Scope: what is in and out of this build

This build is Phase 1 only: a marketing site, a free tool and lead capture. The full RPEEP management app is Phase 2 and is built only if the success metrics in section 1 are met.

**In scope (must be built and working):**

| # | Feature | Route |
| --- | --- | --- |
| F1 | Landing page (home) | `/` |
| F2 | RPEEP Scope Checker, Part A: is the building in scope? | `/checker` |
| F3 | Readiness Check, Part B: how prepared are you? (optional, after Part A) | `/checker` |
| F4 | Results screen with reasons, duties and gaps | `/checker` (result step) |
| F5 | Email-gated PDF report: instant download plus emailed copy | `/api/report` |
| F6 | Pilot sign-up form with survey questions | `/pilot` |
| F7 | Plain-English regulations guide (SEO content page) | `/rpeep-regulations-explained` |
| F8 | Legal pages: privacy notice, terms of use, cookie statement, accessibility statement | `/privacy`, `/terms`, `/cookies`, `/accessibility` |
| F9 | Unsubscribe page (one click, signed link) | `/unsubscribe` |
| F10 | Founder notification email on every new report request and pilot sign-up | server only |
| F11 | Custom 404 and error pages | `not-found`, `error` |
| F12 | Analytics events, sitemap, robots, Open Graph images, structured data | site-wide |

**Out of scope (do NOT build now):**

- User accounts, login or dashboards.
- The RPEEP management app itself (resident forms, PCFRA forms, plans, reminders).
- Payments or subscriptions.
- FRA PDF upload and AI extraction. Show only a "coming soon" interest checkbox on the pilot form.
- Any collection of residents' personal or health information. The free tool asks about the **building only**.
- Rules for Wales, Scotland or Northern Ireland. The tool covers England only and says so.
- An admin panel. Use the Supabase dashboard and CSV export instead.
- A blog, CMS or multiple languages.

**Hard rules for Claude Code:**

- Do not invent features, statistics, testimonials, customer logos or user numbers.
- Do not mention any employer of the founder anywhere in code, copy or metadata.
- Every regulatory statement in the UI must match section 7 word-for-word in meaning, with its regulation number.

## 3. Target users and what they need to trust the site

The audience is senior, risk-averse compliance professionals. The site must feel accurate, calm and institutional, never salesy.

| Persona | Example titles | What they want from the site | What makes them leave |
| --- | --- | --- | --- |
| Decision-maker | Head / Director of Building Safety, Head of Compliance and Building Safety, Technical Director, Head of Fire Safety, Head of Estates | Proof the team understands the law; a credible way to evidence compliance | Hype, vague claims, no regulation references |
| Hands-on specialist | Fire Safety Advisor, Fire Safety Remediation Coordinator, Lead Building Remediation, Fire Safety and Emergency Planning Manager | A fast, correct answer and a checklist they can use today | Wrong or oversimplified rules |
| Property manager | Property Manager, Associate Property Manager, Block Manager | Plain-English duties and what to do next | Jargon, long forms |
| Operations | Operations Manager, Senior / Rollout Operations Manager, Hospitality Operations Manager (build-to-rent, serviced apartments) | Whether this applies to their buildings at all | Having to read legislation to find out |

**Trust requirements (all mandatory):**

- Every rule shown cites its regulation number and links to the official text on legislation.gov.uk.
- Plain English first, legal detail in expandable "Legal detail" panels.
- Real contact details in the footer: company name, company number and registered office (or trading name and address if a sole trader), and a monitored email address.
- A clear "guidance only, not legal advice" statement on the checker, results and PDF.
- A visible data statement: what is stored, where (UK), and for how long.
- No stock photos of fires, no fear-based copy, no countdown timers, no pop-ups.
- No fake logos, testimonials, ratings or user counts. Use "Pilot opening" language honestly.
- Works on locked-down corporate laptops: Microsoft Edge and Chrome, no browser extensions needed, no third-party cookies.
- Accessible to WCAG 2.2 AA. Social landlords and councils check this.
- Fast on mobile. Many property managers will open the email on a phone between site visits.

## 4. Tech stack, architecture and project structure

Use one Next.js app on Vercel, one Supabase database in London, and one pure TypeScript scope engine shared by the browser and the server.

**Stack (use the latest stable version of each and pin exact versions in `package.json`):**

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (App Router) + React + TypeScript in `strict` mode | One codebase for pages and API routes |
| Styling | Tailwind CSS + shadcn/ui components + lucide-react icons | Professional look fast, accessible primitives |
| Forms | React Hook Form + Zod (schemas shared by client and server) | One set of validation rules |
| Database | Supabase Postgres, region London (eu-west-2) | UK data hosting, free tier, CSV export |
| Email | Resend, sending from `hello@[DOMAIN]` with verified domain | Reliable transactional email, attachments |
| PDF | `@react-pdf/renderer`, generated server-side | Branded A4 report, no browser print quirks |
| Bot protection | Cloudflare Turnstile | Invisible CAPTCHA, no puzzles |
| Rate limiting | Upstash Redis + `@upstash/ratelimit` | Stops abuse of the email and PDF endpoints |
| Analytics | Plausible (cookieless) with custom events | No cookie banner needed for analytics |
| Errors | Sentry (free tier) | See failures before users report them |
| Tests | Vitest (unit) + Playwright (end-to-end) + `@axe-core/playwright` (accessibility) | Proves "no bugs" instead of hoping |
| Hosting | Vercel, serverless functions pinned to region `lhr1` (London) | Simple deploys, preview links |

**Architecture rules:**

1. The scope engine (`src/lib/scope/engine.ts`) is a **pure function** with no React, no network and no dates from the system clock. It takes answers and returns a result object.
2. The browser runs the engine to show the result instantly.
3. The server runs the same engine again on every submission and **ignores any result sent by the browser**. The stored result and the PDF always come from the server run.
4. All brand text, legal company details, links and regulation citations live in config files (`src/content/`), never hard-coded in components.
5. Secrets (Supabase service role key, Resend key, Turnstile secret, Upstash token, unsubscribe signing secret) are only read in server code. Nothing secret uses the `NEXT_PUBLIC_` prefix.
6. The database is only written from API routes using the service role key. Row Level Security is ON with no public policies.

**Request flow for the report:**

1. User completes the checker. The browser shows the result summary.
2. User fills the short report form and passes Turnstile.
3. Browser sends `POST /api/report` with answers and contact details.
4. Server validates with Zod, verifies Turnstile, checks the rate limit, re-runs the engine.
5. Server saves the row in `reports`, builds the PDF, emails it via Resend, and emails the founder a notification.
6. Server returns the PDF as base64. The browser offers an instant "Download PDF" button, so the user still gets the report if the email is delayed.

**Project structure:**

```
/
├─ CLAUDE.md                     # rules for Claude Code (copy of sections 2, 4, 13, 15)
├─ docs/PRD.md                   # this document, exported as Markdown
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              # fonts, metadata, header, footer, Plausible
│  │  ├─ page.tsx                # landing page (F1)
│  │  ├─ checker/page.tsx        # checker (F2–F4)
│  │  ├─ pilot/page.tsx          # pilot form (F6)
│  │  ├─ pilot/thanks/page.tsx
│  │  ├─ rpeep-regulations-explained/page.tsx  # guide (F7)
│  │  ├─ privacy/ terms/ cookies/ accessibility/  # legal (F8)
│  │  ├─ unsubscribe/page.tsx    # F9
│  │  ├─ api/report/route.ts     # F5
│  │  ├─ api/pilot/route.ts      # F6
│  │  ├─ api/unsubscribe/route.ts
│  │  ├─ api/health/route.ts
│  │  ├─ opengraph-image.tsx, sitemap.ts, robots.ts
│  │  ├─ not-found.tsx, error.tsx
│  ├─ components/
│  │  ├─ ui/                     # shadcn primitives
│  │  ├─ site/                   # Header, Footer, Section, CTA
│  │  ├─ checker/                # Stepper, QuestionCard, RadioCardGroup, NumberField, ResultBadge, DutyList, ReadinessGaps, ReportForm
│  │  └─ pilot/PilotForm.tsx
│  ├─ content/
│  │  ├─ site.ts                 # brand, company details, contact, links
│  │  ├─ regulations.ts          # citations, URLs, duty text (section 7)
│  │  ├─ questions.ts            # question text, options, help text (section 8)
│  │  └─ faq.ts
│  ├─ lib/
│  │  ├─ scope/engine.ts         # pure scope logic
│  │  ├─ scope/engine.test.ts    # truth-table tests (section 15)
│  │  ├─ readiness/score.ts (+ .test.ts)
│  │  ├─ schemas.ts              # Zod schemas
│  │  ├─ supabase.ts             # server-only client
│  │  ├─ email/ (templates + send.ts)
│  │  ├─ pdf/Report.tsx
│  │  ├─ turnstile.ts, ratelimit.ts, tokens.ts (unsubscribe HMAC), analytics.ts
├─ supabase/migrations/0001_init.sql
├─ e2e/*.spec.ts                 # Playwright
└─ .env.example
```

## 5. Brand and design system

The look is "regulator-grade calm": navy and white, generous spacing, one restrained accent colour, and no fire imagery.

**Colour tokens (define as CSS variables in `globals.css` and map them in the Tailwind config):**

| Token | Hex | Use | Contrast on white |
| --- | --- | --- | --- |
| `--navy-900` | #0F2A44 | Header, headings, primary buttons | 14.6:1 |
| `--navy-700` | #1E4268 | Hover states, links | 10.2:1 |
| `--ink` | #1F2937 | Body text | 14.7:1 |
| `--muted` | #4B5563 | Secondary text | 7.6:1 |
| `--accent` | #C2410C | Primary call-to-action button only | 5.2:1 |
| `--surface` | #F7F8FA | Alternating section backgrounds | n/a |
| `--border` | #E5E7EB | Card and input borders | n/a |
| `--success` | #15803D | "In scope" badge | 5.0:1 |
| `--warning` | #B45309 | "Can't confirm yet" badge | 5.0:1 |
| `--neutral` | #475569 | "Not in scope" badge | 7.6:1 |
| `--error` | #B91C1C | Form errors | 6.5:1 |

Claude Code must re-check every text/background pair with a contrast checker and adjust any pair below 4.5:1 (normal text) or 3:1 (large text, icons, focus rings).

**Typography:**

- Font: Inter via `next/font/google`, with fallback stack `system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`.
- Sizes (rem): H1 2.5 desktop / 2.0 mobile, weight 700; H2 1.875 / 1.5, weight 700; H3 1.25, weight 600; body 1.0625 (17px), line height 1.6; small 0.875.
- Maximum line length 70 characters for body text.
- Use tabular figures for numbers in results and the PDF.

**Layout:**

- 8px spacing grid. Section padding 96px desktop, 64px mobile.
- Content max width 1120px; reading pages (guide, legal) max width 720px.
- Border radius 8px for cards and inputs, 6px for buttons.
- Shadows: one subtle level only (`0 1px 2px rgba(15,42,68,.06), 0 4px 12px rgba(15,42,68,.06)`).
- Breakpoints: 640, 768, 1024, 1280px. Design mobile-first.
- Light theme only. Do not add dark mode in Phase 1.

**Components to build (all keyboard accessible, with visible 3px focus ring in `--navy-700`):**

- `Button`: primary (accent background, white text), secondary (navy outline), ghost. Minimum target size 44 x 44px. Loading state with spinner and `aria-busy`.
- `Card`: white, border, radius 8px, padding 24px.
- `ResultBadge`: icon plus text, never colour alone. In scope = check-circle icon; Not in scope = minus-circle icon; Can't confirm yet = help-circle icon.
- `Stepper`: progress bar with the text "Question 3 of 6" for screen readers and sighted users.
- `RadioCardGroup`: large clickable option cards built on native radio inputs, arrow-key navigation.
- `NumberField`: numeric input with a unit suffix ("m" or "storeys"), plus an "I don't know" checkbox that disables the input.
- `HelpDisclosure`: "What does this mean?" using native `<details>`/`<summary>`.
- `LegalDetail`: collapsible panel with the regulation text summary and a link to legislation.gov.uk.
- `Alert`: info, warning and error variants with `role="status"` or `role="alert"`.
- `Accordion` for the FAQ.
- `Header`: wordmark left; nav links "How it works", "Free checker", "Pilot", "FAQ"; primary button "Check your building". On mobile, a hamburger menu that traps focus while open.
- `Footer`: see section 6.

**Imagery:**

- No stock photography. Use simple line illustrations drawn in SVG in code: a building outline with floor lines and a measurement arrow (for the height question), and a simple 7-step journey illustration.
- A "concept preview" mock-up of the future app dashboard, clearly labelled "Concept preview — in development".
- Favicon and logo: a simple wordmark of `[BRAND]` in Inter Bold, navy, plus a square monogram for the favicon.

**Tone of voice:** plain English, short sentences, active voice. Banned words: "revolutionary", "game-changing", "seamless", "cutting-edge", "guarantee compliance". Say "helps you evidence", never "makes you compliant".

## 6. Landing page spec, section by section with copy

The home page has 11 sections in this exact order. Copy below is final draft; keep it in `src/content/` so it can be edited without touching components.

1. **Header** (sticky, white, bottom border on scroll)
   - Wordmark `[BRAND]` linking to `/`.
   - Nav: How it works (`#how`), Free checker (`/checker`), Pilot (`/pilot`), FAQ (`#faq`).
   - Primary button: "Check your building" → `/checker`.
2. **Hero** (navy background, white text, building line illustration on the right on desktop, hidden on mobile)
   - Eyebrow: "For Responsible Persons in England"
   - H1: "Residential PEEPs, handled properly."
   - Subheading: "Since 6 April 2026, Responsible Persons for many residential buildings must identify residents who may need help to evacuate, offer person-centred fire risk assessments and share key information with the fire service. \[BRAND\] will help you do it, and evidence that you did."
   - Primary button: "Check if your building is in scope (2 min)" → `/checker`. Fires event `cta_clicked {location: "hero"}`.
   - Secondary button: "Join the pilot" → `/pilot`.
   - Trust line under buttons: "Free · No account needed · Data hosted in the UK · Built by a fire safety professional".
3. **What the law now requires** (`#law`, surface background)
   - H2: "What the Residential Evacuation Plans Regulations require"
   - Intro: "The Fire Safety (Residential Evacuation Plans) (England) Regulations 2025 came into force on 6 April 2026." Link "Read the regulations" → legislation.gov.uk.
   - Six cards, each with the plain-English duty from section 7 table B, its regulation number as a small badge, and a "Legal detail" panel: Identify residents (reg 5) · Offer a person-centred fire risk assessment (reg 6) · Put reasonable measures in place (reg 7) · Agree and record an emergency evacuation statement (reg 8) · Review every 12 months (reg 9) · Share information with the fire service, with consent (reg 10). Below the grid, one wide card: Building emergency evacuation plan (reg 13).
4. **Why it's hard today** (white background)
   - H2: "Why this is hard to manage today"
   - Three items with icons:
     - "Finding residents who need help. Residents rarely tell landlords, and you must use reasonable endeavours to identify them."
     - "Consent at every step. Information can only go to the fire service with a resident's explicit consent."
     - "Deadlines that never stop. Assessments, statements and building plans all need reviewing at least every 12 months."
5. **How \[BRAND\] will help** (`#how`, surface background)
   - H2: "How \[BRAND\] will work"
   - Label: "In development — pilot opening soon".
   - Seven numbered steps in a horizontal stepper on desktop, vertical on mobile: 1 Set up your building · 2 Find residents (letters, posters, QR code) · 3 Record consent · 4 Carry out the person-centred assessment · 5 Agree the emergency evacuation statement · 6 Share with the fire service · 7 Automatic review reminders.
   - Beside it: the "Concept preview — in development" dashboard mock-up (static SVG/HTML, no fake numbers presented as real customers; use clearly fictional building names such as "Example House").
6. **Free tool** (white background, bordered card centred)
   - H2: "Is your building in scope?"
   - Text: "Answer up to six questions about your building. Get an instant answer, the duties that apply, and a free PDF report."
   - Button: "Start the free checker" → `/checker`.
   - Small print: "England only. Guidance, not legal advice."
7. **Pilot** (navy background)
   - H2: "Join the founding pilot"
   - Three benefits: "Free setup for your first buildings" · "Founding price held for 12 months" · "Shape the product with your feedback". Do not state a price.
   - Button: "Apply for the pilot" → `/pilot`.
8. **Why we're building this** (white)
   - H2: "Why we're building this"
   - Text (founder to edit): "The Grenfell Tower Inquiry recommended personal emergency evacuation plans for residents who need help to escape. These regulations are the result. I work in fire safety, writing fire strategy reports for residential and mixed-use buildings, and I'm building \[BRAND\] to make the process simple, consistent and properly recorded."
   - Signature line: "\[First name\], Founder". No employer name. Optional LinkedIn link only if the founder chooses.
9. **Your data** (surface)
   - H2: "How we handle data"
   - Bullets: "The free checker asks about the building, not about residents." · "Report requests are stored in a UK data centre and deleted after 24 months." · "We never sell or share your details." · "Unsubscribe in one click." Link → `/privacy`.
10. **FAQ** (`#faq`, white, accordion, eight questions; answers come from section 7 and must cite regulation numbers):
    - Which buildings are covered? → regulation 3 summary.
    - Does this apply in Wales, Scotland or Northern Ireland? → "The regulations apply in England only."
    - Who is the Responsible Person? → "Usually the building owner, landlord or managing agent — the person defined as the responsible person under the Fire Safety Order."
    - Who counts as a "relevant resident"? → regulation 4 summary.
    - Do residents have to take part? → "The Responsible Person must offer an assessment; residents can decline. Information goes to the fire service only with explicit consent (regulation 10(2))."
    - How often must plans be reviewed? → regulation 9(3)–(4) summary.
    - What is a building emergency evacuation plan? → regulation 13 summary.
    - Is the checker legal advice? → "No. It is guidance based on the regulations. Always confirm with a competent fire safety professional."
11. **Footer** (navy)
    - Column 1: wordmark, one-line description, contact email `hello@[DOMAIN]`.
    - Column 2: Free checker, Regulations explained, Pilot.
    - Column 3: Privacy, Terms, Cookies, Accessibility.
    - Bottom row: "© \[YEAR\] \[LEGAL ENTITY NAME\]. Registered in England and Wales, company number \[NUMBER\]. Registered office: \[ADDRESS\]." (Sole trader version: "\[TRADING NAME\] is a trading name of \[FULL NAME\], \[ADDRESS\].")
    - Disclaimer: "\[BRAND\] provides guidance, not legal advice."

**Page-level requirements:** all CTAs fire `cta_clicked` with a `location` property; anchor links scroll smoothly unless the user prefers reduced motion; the page must score 95+ in all four Lighthouse categories on mobile.

## 7. Free tool: regulatory scope logic and decision rules

A building is in scope when it is in England, has two or more sets of domestic premises, is not excluded, and is at least 18m high, or has at least 7 storeys, or is over 11m with a simultaneous evacuation strategy. Every rule below is taken from the [Fire Safety (Residential Evacuation Plans) (England) Regulations 2025](https://www.legislation.gov.uk/uksi/2025/797/made), SI 2025/797, in force since 6 April 2026.

&#91;embedded content: scope decision flow · 3 gates, 3 tests, 1 unknown check\]

The three gates can only rule a building out; any one of the three tests rules it in; an unknown answer that could still change the result gives "Cannot confirm yet".

### A. Scope rules (the engine must implement exactly these)

| Rule | Condition | Regulation |
| --- | --- | --- |
| R1 | Building is in England (the regulations apply in England only) | 1(3) |
| R2 | Not domestic premises within the Palace of Westminster, and not military premises (barracks, or a building occupied solely for the armed forces or a visiting force) | 1(4), 2 |
| R3 | Contains two or more sets of domestic premises | 3(1) |
| C1 | Top storey is at least 18 metres above ground level | 3(1)(a) |
| C2 | Has at least seven storeys | 3(1)(b) |
| C3 | Top storey is more than 11 metres above ground level AND the building has a simultaneous evacuation strategy | 3(1)(c) |

In scope = R1 AND R2 AND R3 AND (C1 OR C2 OR C3).

**Measurement rules to show as help text:**

- Height is measured to the height of the top storey in accordance with Appendix D to Approved Document B (reg 3(2)(a)). Help text: "Use the height of the top storey stated in your fire risk assessment or fire strategy. It is not the height to the roof." The founder must confirm the exact Appendix D wording before launch (section 17).
- Storeys below ground level are ignored (reg 3(2)(b)(i)).
- A mezzanine counts as a storey if its internal floor area is at least 50% of the largest storey that is not below ground (reg 3(2)(b)(ii)).
- A storey is below ground if any part of the finished surface of its ceiling is below the ground level immediately next to that part of the building (reg 3(2)(b)(iii)).
- Simultaneous evacuation strategy means the Responsible Person has decided that everyone should leave the building immediately in the event of a fire (reg 3(3)). Phased evacuation and stay put are **not** simultaneous.

**Boundary cases (must be exact):** 18.0m is in scope ("at least"). 11.0m with simultaneous evacuation is **not** in scope under C3 ("more than"). 11.1m with simultaneous evacuation **is** in scope. 6 storeys does not meet C2; 7 does.

### B. Engine contract (`src/lib/scope/engine.ts`)

```ts
export type Answers = {
  inEngland: 'yes' | 'no';
  excludedPremises: 'yes' | 'no';          // military or Palace of Westminster
  dwellings: 'two_or_more' | 'fewer_than_two';
  storeys: number | null;                   // integer 1–120, null = "I don't know"
  heightMetres: number | null;              // 0.1–350, one decimal place, null = "I don't know"
  evacuationStrategy: 'stay_put' | 'simultaneous' | 'temporary_simultaneous' | 'phased_or_other' | 'unsure';
};

export type Criterion = 'C1_HEIGHT_18' | 'C2_STOREYS_7' | 'C3_HEIGHT_11_SIMULTANEOUS';
export type ScopeStatus = 'in_scope' | 'not_in_scope' | 'cannot_confirm';

export type ScopeResult = {
  status: ScopeStatus;
  reasons: ReasonCode[];      // why, in display order
  criteriaMet: Criterion[];   // empty unless in_scope
  missing: MissingCode[];     // empty unless cannot_confirm
  notes: NoteCode[];          // extra guidance lines
  engineVersion: '1.0.0';     // stored with every report
};

export function evaluateScope(a: Partial<Answers>): ScopeResult;
export function getNextQuestion(a: Partial<Answers>): QuestionId | null; // null = finished
```

**Algorithm (in this order):**

1. If `inEngland === 'no'` → `not_in_scope`, reason `NOT_ENGLAND`. Stop.
2. If `excludedPremises === 'yes'` → `not_in_scope`, reason `EXCLUDED_PREMISES`. Stop.
3. If `dwellings === 'fewer_than_two'` → `not_in_scope`, reason `FEWER_THAN_TWO_DWELLINGS`. Stop.
4. Work out the criteria:
   - `c1 = heightMetres !== null && heightMetres >= 18`
   - `c2 = storeys !== null && storeys >= 7`
   - `sim = evacuationStrategy === 'simultaneous' || evacuationStrategy === 'temporary_simultaneous'`
   - `c3 = heightMetres !== null && heightMetres > 11 && sim`
5. If any of `c1`, `c2`, `c3` is true → `in_scope`. `criteriaMet` lists every criterion that is true. Add note `TEMPORARY_STRATEGY` if `c3` is the **only** criterion met and the strategy is `temporary_simultaneous`. Stop.
6. Work out what could still make it in scope:
   - `couldC1 = heightMetres === null`
   - `couldC2 = storeys === null`
   - `couldC3 = (heightMetres === null || heightMetres > 11) && (sim || evacuationStrategy === 'unsure')`
7. If any of those is true → `cannot_confirm`. `missing` = `HEIGHT` if height is null; `STOREYS` if storeys is null; `STRATEGY` if strategy is `unsure` and (height is null or height > 11). If height is known and ≤ 11 and storeys is null, add note `UNLIKELY_SEVEN_STOREYS`. Stop.
8. Otherwise → `not_in_scope`, reason `BELOW_THRESHOLDS`.
9. Only a `BELOW_THRESHOLDS` result gets note `OTHER_DUTIES`. Do not add it for `NOT_ENGLAND`, `EXCLUDED_PREMISES` or `FEWER_THAN_TWO_DWELLINGS`, because the Fire Safety Order may not apply in the same way to those buildings.

**`getNextQuestion` order and skipping:** `inEngland` → `excludedPremises` → `dwellings` → `storeys` → `heightMetres` → `evacuationStrategy`. After each answer, if `evaluateScope` already returns `in_scope` or `not_in_scope` from rules 1–5, stop and return null. Ask `evacuationStrategy` only if height is null or height > 11 (and height < 18). Storeys comes before height because most people know the storey count.

**Undefined vs unknown:** `undefined` means "not asked yet"; `null` (or `'unsure'`) means "I don't know". In `evaluateScope`, treat `undefined` height or storeys the same as `null`. The UI must only show a final result after `getNextQuestion` returns `null`; before that, only rules 1–5 may end the flow early. A `not_in_scope` from rule 8 must never end the flow while a question that could change the result is still unasked.

### C. Exact result copy (store in `src/content/regulations.ts`)

| Code | Text shown to the user |
| --- | --- |
| `NOT_ENGLAND` | The regulations apply in England only (regulation 1(3)). Different rules apply in Wales, Scotland and Northern Ireland. |
| `EXCLUDED_PREMISES` | The regulations do not apply to military premises or to domestic premises within the Palace of Westminster (regulation 1(4)). |
| `FEWER_THAN_TWO_DWELLINGS` | The regulations only cover buildings with two or more sets of domestic premises, such as flats (regulation 3(1)). |
| `C1_HEIGHT_18` | The top storey is at least 18 metres above ground level (regulation 3(1)(a)). |
| `C2_STOREYS_7` | The building has at least seven storeys (regulation 3(1)(b)). |
| `C3_HEIGHT_11_SIMULTANEOUS` | The top storey is more than 11 metres above ground level and the building has a simultaneous evacuation strategy (regulation 3(1)(c)). |
| `BELOW_THRESHOLDS` | The building is under 18 metres, has fewer than seven storeys, and is not both over 11 metres and on a simultaneous evacuation strategy (regulation 3(1)). |
| `HEIGHT` (missing) | The height of the top storey above ground level. Check your fire risk assessment, fire strategy or building drawings. |
| `STOREYS` (missing) | The number of storeys above ground level. Check your fire risk assessment or building drawings. |
| `STRATEGY` (missing) | The evacuation strategy: stay put, simultaneous or phased. Check your fire risk assessment or fire action notices. |
| `TEMPORARY_STRATEGY` (note) | Your building is in scope because of its current simultaneous evacuation strategy. If the strategy changes, check the scope again. |
| `UNLIKELY_SEVEN_STOREYS` (note) | A building of 11 metres or less is unlikely to have seven storeys, but confirm the storey count to be sure. |
| `OTHER_DUTIES` (note) | Other duties under the Regulatory Reform (Fire Safety) Order 2005 still apply, including keeping a suitable and sufficient fire risk assessment. |

Result headlines: in scope = "Your building is in scope"; not in scope = "Your building is not in scope of these regulations"; cannot confirm = "We can't confirm yet — we need a little more information".

### D. Duties shown for in-scope buildings (results, landing page cards and PDF)

| # | Duty | Plain English | Regulation |
| --- | --- | --- | --- |
| D1 | Identify relevant residents | Use reasonable endeavours to identify residents whose ability to evacuate without help is compromised by a cognitive or physical impairment or condition, where the flat is their only or main home. | 4, 5 |
| D2 | Offer a person-centred fire risk assessment | Offer a PCFRA to each resident identified, and make sure one is carried out for anyone who asks. | 6 |
| D3 | Put reasonable measures in place | After discussing with the resident, implement mitigating measures that are reasonable and proportionate. Rules decide who pays. | 7 |
| D4 | Agree an emergency evacuation statement | Use reasonable endeavours to agree the evacuation approach. If agreed, record it in writing and give the resident a copy. | 8 |
| D5 | Review regularly | Review the PCFRA, measures and statement within 12 months, then at least every 12 months, and sooner if something changes or the resident reasonably asks. | 9 |
| D6 | Share information with the fire service | With the resident's explicit consent, give the local fire and rescue authority the flat number, floor number, basic information on the help needed, and whether there is a statement. Use the method the fire service chooses: electronic, or a hard copy in a secure information box (install one if needed). | 10 |
| D7 | Work with representatives | Where it applies, work with a resident's representative, such as a person with parental responsibility, a registered attorney or a Court of Protection deputy. | 11 |
| D8 | Building emergency evacuation plan | Prepare a building plan, give it to the fire service, place a copy in the secure information box if there is one, and review it within 12 months and then at least every 12 months. | 13 |
| D9 | Data protection | Handle all this information in line with data protection law. | 12 |

Source for every row: [SI 2025/797 as made](https://www.legislation.gov.uk/uksi/2025/797/made).

## 8. Free tool: question flow, screens and result states

The checker shows one question per screen, at most six scope questions, then an optional six-question readiness check for in-scope buildings.

### A. Screens and exact copy

1. **Intro**
   - H1: "Is your building in scope?"
   - Text: "Answer up to six questions about one building. It takes about 2 minutes. No account needed."
   - Optional field: "Building name or reference (optional, shown on your report)". Max 80 characters. Helper: "Do not enter a full address or any resident details."
   - Button: "Start". Fires `checker_started`.
2. **Q `inEngland`** — "Is the building in England?"
   - Options: "Yes" · "No — it's in Wales, Scotland or Northern Ireland".
   - Help: "The regulations apply in England only."
3. **Q `excludedPremises`** — "Is the building military premises, or within the Palace of Westminster?"
   - Options: "No" (listed first) · "Yes".
   - Help: "Military premises means military barracks, or a building used only for the armed forces or a visiting force."
4. **Q `dwellings`** — "Does the building contain two or more homes, such as flats or maisonettes?"
   - Options: "Yes, two or more" · "No, fewer than two".
   - Help: "Mixed-use buildings count if they contain two or more sets of domestic premises."
5. **Q `storeys`** — "How many storeys does the building have above ground level?"
   - `NumberField`, whole numbers only, unit "storeys", plus checkbox "I don't know".
   - Help (bullets): "Do not count basements or any storey whose ceiling is partly below the ground next to it." · "Count a mezzanine only if its floor area is at least half the area of the largest storey above ground."
   - Illustration: building outline with storeys numbered from ground up.
6. **Q `heightMetres`** — "How high is the top storey above ground level?"
   - `NumberField`, up to one decimal place, unit "m", plus checkbox "I don't know".
   - Help: "Use the height of the top storey stated in your fire risk assessment or fire strategy. This is not the height to the roof."
   - Illustration: building outline with a measurement arrow from ground to the top storey floor level.
7. **Q `evacuationStrategy`** (only when the engine needs it) — "What is the building's evacuation strategy?"
   - Options: "Stay put" · "Simultaneous evacuation — everyone leaves straight away" · "Temporary simultaneous evacuation — for example during remediation works" · "Phased or other" · "I'm not sure".
   - Help: "A simultaneous evacuation strategy means the Responsible Person has decided that everyone should leave the building immediately in the event of a fire."
8. **Result** (see B).
9. **Readiness check** (in scope only, optional; see C).
10. **Report form** (see section 9).

**Validation messages:**

- Storeys: "Enter a whole number between 1 and 120, or tick 'I don't know'."
- Height: "Enter a height between 0.1 and 350 metres, using up to one decimal place, or tick 'I don't know'."
- Any unanswered radio question: "Choose an option to continue."
- Accept both "." and "," as the decimal separator; strip spaces and a trailing "m".

**Navigation and state:**

- Every screen has "Back" (except intro) and "Continue". Enter key submits "Continue".
- Each step sets the URL hash (`#q-storeys`, `#result`, `#readiness`) so the browser back button moves to the previous step.
- Answers are kept in `sessionStorage` under key `rpeep-checker-v1` so a refresh does not lose progress. "Start again" clears it.
- Changing an earlier answer re-runs `getNextQuestion` and discards answers to questions that are no longer asked.
- Stepper text: "Question 4 of up to 6". Progress bar fills by questions answered divided by 6, reaching 100% on the result screen.
- On every step change, move keyboard focus to the new question heading and announce it via an `aria-live="polite"` region.
- Fire `question_answered {step: <id>}` on each Continue.

### B. Result screen

| Status | Badge | Headline | Body | Primary action | Secondary actions |
| --- | --- | --- | --- | --- | --- |
| `in_scope` | Success, check icon | "Your building is in scope" | Reasons (criteria met), then duties D1–D9 as cards with "Legal detail" panels | "Check how ready you are (1 minute)" | "Skip to my free report", "Edit answers", "Start again" |
| `cannot_confirm` | Warning, help icon | "We can't confirm yet — we need a little more information" | Missing items with where to find them, plus any notes | "Edit answers" | "Email me this result", "Start again" |
| `not_in_scope` | Neutral, minus icon | "Your building is not in scope of these regulations" | Reason, plus note `OTHER_DUTIES` | "Check another building" | "Email me this result", "Edit answers" |

Every result screen also shows: the building reference if given; a "Your answers" summary with an edit link per answer; the pilot card ("Want help managing RPEEPs? Join the pilot"); and the disclaimer "This is guidance based on SI 2025/797, not legal advice. Confirm with a competent fire safety professional." Fire `checker_completed {status}`.

### C. Readiness check (Part B)

Six questions, each with options "Yes" (2 points) · "Partly" (1) · "Not yet" (0). Total 0–12.

| ID | Question | Gap text shown if "Partly" or "Not yet" |
| --- | --- | --- |
| R1 | Have you used reasonable endeavours to identify residents who may need help to evacuate, for example letters, notices or visits? | Plan how you will identify residents: letters, notices in common areas and a simple way to self-refer. Keep a record of every attempt. (regulation 5) |
| R2 | Have you offered a person-centred fire risk assessment to every resident identified? | Offer an assessment to every resident identified, and record each offer, acceptance or refusal. (regulation 6) |
| R3 | Where an approach is agreed, is it recorded in a written emergency evacuation statement, with a copy given to the resident? | Record agreed approaches as written emergency evacuation statements and give each resident a copy. (regulation 8) |
| R4 | Do you record explicit consent before sharing information with the fire service, and do you know which method your fire service has chosen? | Check how your local fire and rescue service wants to receive information, and record explicit consent before sharing anything. (regulation 10) |
| R5 | Has a building emergency evacuation plan been prepared and given to the fire service? | Prepare the building emergency evacuation plan, send it to the fire service, and place a copy in the secure information box if there is one. (regulation 13) |
| R6 | Do you have a reliable way to track 12-month review dates for every assessment, statement and building plan? | Set up reminders for every review: within 12 months, then at least every 12 months. (regulations 9 and 13) |

Bands (`src/lib/readiness/score.ts`): 10–12 = "Well prepared"; 6–9 = "Partly prepared"; 0–5 = "Early stages". Show the score as "7 out of 12 — Partly prepared", then the gap list in R1–R6 order, then the report form. Fire `readiness_completed {score}`.

## 9. Lead capture, results email and PDF report

The user enters six short fields, gets the PDF instantly in the browser, and receives the same PDF by email.

### A. Report form (`ReportForm`)

| Field | Type | Rules | Options / helper |
| --- | --- | --- | --- |
| First name | text | required, 1–60 chars, trimmed |  |
| Work email | email | required, valid format, max 254 chars, lower-cased | Helper: "Use your work email." Do not block personal domains. |
| Organisation | text | required, 1–120 chars |  |
| Role | select | required | Head or Director of Building Safety · Building or Fire Safety Manager / Advisor · Head of Compliance · Property or Block Manager · Operations Manager · Fire risk assessor or consultant · Other (reveals a 60-char text field) |
| Organisation type | select | required | Housing association · Local authority or ALMO · Managing agent · Build-to-rent operator · Residents' management or RTM company · Freeholder or investor · Fire safety consultancy · Other |
| Buildings that may be in scope | select | required | 1 · 2–5 · 6–20 · 21–100 · More than 100 · Not sure |
| Updates opt-in | checkbox | optional, **unticked by default** | "Send me occasional updates about \[BRAND\] and the pilot. Unsubscribe any time." |
| Turnstile | widget | required, invisible mode |  |

- Button: "Get my free report". Disabled with spinner while submitting.
- Privacy line under the button: "We use your details to send this report and, if you tick the box, occasional updates. See our privacy notice."
- Hidden fields: UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`) captured from the landing URL and kept in `sessionStorage`.
- **Success state:** "Your report is ready" + "Download PDF" button (built from the base64 response) + "We've also emailed it to {email}. It can take a few minutes — check your junk folder." + pilot card. Fire `report_requested` on submit and `report_downloaded` on download.
- **Error states:** validation errors inline under each field and summarised at the top with links to each field; network or server error: "Something went wrong and your report wasn't sent. Please try again. If it keeps happening, email hello@\[DOMAIN\]." Answers must not be lost on error.

### B. Email to the user (Resend)

- From: `[BRAND] <hello@[DOMAIN]>`. Reply-To: founder's mailbox.
- Subject: "Your RPEEP scope report — {building reference or 'your building'}".
- HTML: single column, max width 600px, table-based layout so it renders in Outlook desktop, system fonts, no images required, dark text on white. Always send a plain-text version too.
- Body:
  - "Hi {first name},"
  - "Your RPEEP scope report for {reference} is attached."
  - "**Result:** {headline}" and the first reason line.
  - In scope only: "The report lists the duties that apply{, and the gaps from your readiness check}."
  - "Want help managing RPEEPs? We're opening a small founding pilot: {link to /pilot with utm\_source=report\_email}."
  - Signature: "{Founder first name}, Founder, \[BRAND\] · \[DOMAIN\]".
  - Footer: legal entity details, "You received this because you requested a report at \[DOMAIN\].", and an unsubscribe link (signed token, section 12).
- Attachment name: `RPEEP-scope-report-{reference-slug or 'building'}-{YYYY-MM-DD}.pdf`.

### C. Founder notification email

- To: `FOUNDER_EMAIL`. Subject: "New report: {organisation} — {status} — {buildings band}".
- Body: every form field, the scope status, criteria met, readiness score, UTM values, timestamp (Europe/London) and the report ID.
- If this email fails, log to Sentry but still return success to the user.

### D. PDF report (`src/lib/pdf/Report.tsx`)

- A4 portrait, 20mm margins, Inter embedded from font files in `/public/fonts` (Regular, SemiBold, Bold). Headings in navy, body in ink. Target file size under 300KB.
- Footer on every page: "\[BRAND\] · Guidance only, not legal advice · Engine v{engineVersion} · Page X of Y".
- Dates in UK format ("6 October 2026"), generated on the server in the Europe/London time zone.

**Page 1 — Summary (all results):** brand bar and title "RPEEP Scope Report"; building reference; date; "Prepared for {first name}, {organisation}"; result badge (shape + text); reasons; notes; "Your answers" table (question, answer, with "I don't know" shown as "Not known").

**Page 2 — depends on result:**

- In scope: "Duties that apply" table D1–D9 with plain English, regulation number and an empty tick box for the reader to use.
- Cannot confirm: "What we still need" with each missing item and where to find it, and "Run the checker again at \[DOMAIN\]/checker".
- Not in scope: the `OTHER_DUTIES` note and "If any answer changes, check again."

**Page 3 — Readiness (only if Part B was completed):** score and band, gap list R1–R6, then "Suggested next steps": confirm the scope with a competent fire safety professional; ask your local fire and rescue service which method it wants for resident information; start identifying residents and record every attempt.

**Final section — Sources and disclaimer:** link to SI 2025/797 on legislation.gov.uk; full disclaimer: "This report is guidance based on your answers and on the Fire Safety (Residential Evacuation Plans) (England) Regulations 2025. It is not legal advice. Responsibility for compliance remains with the Responsible Person. Confirm the scope and your duties with a competent fire safety professional."

## 10. Pilot sign-up form and survey questions

The pilot form doubles as the no-calls survey: it captures who they are, how they manage RPEEPs today, what hurts, and whether they would pay.

**Page `/pilot`:**

- H1: "Join the founding pilot"
- Intro: "We're working with a small group of Responsible Persons to build \[BRAND\]. Pilot members get free setup for their first buildings, a founding price held for 12 months, and a direct say in what we build."
- "What happens next" list: "We review every application within 3 working days." · "If it's a good fit, we email you a short written walkthrough and pilot terms." · "No calls needed unless you want one."
- If the user arrives from a completed checker, pre-fill name, email, organisation, role, organisation type and buildings band from `sessionStorage`.

**Fields (in this order):**

| # | Field | Type | Rules / options |
| --- | --- | --- | --- |
| P1 | First name | text | required, 1–60 |
| P2 | Last name | text | required, 1–60 |
| P3 | Work email | email | required |
| P4 | Organisation | text | required, 1–120 |
| P5 | Role | select | same options as the report form |
| P6 | Organisation type | select | same options as the report form |
| P7 | Buildings that may be in scope | select | same bands as the report form |
| P8 | How do you manage RPEEPs today? | multi-select checkboxes, at least one | Spreadsheets · Paper or Word templates · Our existing compliance software (reveals "Which one?" text, 80 chars) · A consultant or fire risk assessor handles it · We haven't started yet · Other |
| P9 | What is the hardest part of RPEEPs for you? | textarea | required, 10–800 chars, live character counter |
| P10 | Which features matter most? | rank up to 3 (checkboxes limited to 3) | Finding and contacting residents · Recording consent · PCFRA forms · Emergency evacuation statements · Sharing information with the fire service · Review reminders · Building emergency evacuation plan · Evidence pack for audits |
| P11 | Would you also want help tracking fire risk assessment actions? | radio | Yes, very · Maybe · No |
| P12 | What would you expect to pay per building per year for a tool that does this well? | radio | Under £100 · £100–£250 · £250–£500 · Over £500 · Not sure |
| P13 | Willing to pay | checkbox, optional | "I'd consider a paid pilot if it meets our needs." |
| P14 | When would you want to start? | radio | Now · Within 3 months · Within 6 months · Just exploring |
| P15 | Updates opt-in | checkbox, unticked | same wording as report form |
| — | Turnstile | widget | required |

- Button: "Apply for the pilot".
- On success redirect to `/pilot/thanks`: H1 "Thanks, {first name}", text "We'll review your application and reply within 3 working days from hello@\[DOMAIN\]." and a link back to the checker. Fire `pilot_submitted {orgType, buildingsBand, priceBand, willingToPay}`.
- Send the applicant a short confirmation email (subject "Your \[BRAND\] pilot application") and the founder a notification (subject "Pilot application: {organisation} — {buildings band} — {price band}").
- Fire `pilot_started` when the first field receives focus.

## 11. Database schema

Three tables in Supabase (London region): `reports`, `pilot_applications` and `email_suppressions`. All writes come from server API routes only.

Put this in `supabase/migrations/0001_init.sql`:

```sql
create extension if not exists pgcrypto;

create type scope_status as enum ('in_scope', 'not_in_scope', 'cannot_confirm');

create table public.reports (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  first_name         text not null check (char_length(first_name) between 1 and 60),
  email              text not null check (char_length(email) <= 254),
  organisation       text not null check (char_length(organisation) between 1 and 120),
  role               text not null,
  role_other         text check (char_length(role_other) <= 60),
  org_type           text not null,
  buildings_band     text not null,
  building_ref       text check (char_length(building_ref) <= 80),
  answers            jsonb not null,          -- Answers object, as validated
  status             scope_status not null,   -- from the SERVER engine run
  criteria_met       text[] not null default '{}',
  missing            text[] not null default '{}',
  engine_version     text not null,
  readiness_answers  jsonb,                   -- null if Part B skipped
  readiness_score    smallint check (readiness_score between 0 and 12),
  marketing_consent  boolean not null default false,
  consent_text_ver   text not null,           -- e.g. 'report-form-v1'
  utm_source         text,
  utm_medium         text,
  utm_campaign       text,
  ip_hash            text,                    -- sha256(ip + IP_HASH_SALT), never the raw IP
  email_sent_at      timestamptz,
  email_error        text
);
create index reports_created_at_idx on public.reports (created_at desc);
create index reports_email_idx on public.reports (email);

create table public.pilot_applications (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  first_name         text not null check (char_length(first_name) between 1 and 60),
  last_name          text not null check (char_length(last_name) between 1 and 60),
  email              text not null check (char_length(email) <= 254),
  organisation       text not null check (char_length(organisation) between 1 and 120),
  role               text not null,
  org_type           text not null,
  buildings_band     text not null,
  current_methods    text[] not null check (array_length(current_methods, 1) >= 1),
  current_software   text check (char_length(current_software) <= 80),
  hardest_part       text not null check (char_length(hardest_part) between 10 and 800),
  top_features       text[] not null default '{}' check (coalesce(array_length(top_features, 1), 0) <= 3),
  wants_fra_tracker  text not null,
  price_band         text not null,
  willing_to_pay     boolean not null default false,
  start_timing       text not null,
  marketing_consent  boolean not null default false,
  consent_text_ver   text not null,
  report_id          uuid references public.reports(id) on delete set null,
  utm_source         text,
  utm_medium         text,
  utm_campaign       text,
  ip_hash            text,
  status             text not null default 'new'  -- new | contacted | accepted | declined
);
create index pilot_created_at_idx on public.pilot_applications (created_at desc);

create table public.email_suppressions (
  email       text primary key,
  created_at  timestamptz not null default now(),
  reason      text not null default 'unsubscribe'
);

alter table public.reports            enable row level security;
alter table public.pilot_applications enable row level security;
alter table public.email_suppressions enable row level security;
-- Deliberately NO policies: only the service role (server) can read or write.
```

**Data rules:**

- Store the email lower-cased and trimmed.
- Never store raw IP addresses; store only the salted hash for abuse checks.
- Before sending any non-transactional email, check `email_suppressions`.
- Retention: delete `reports` and `pilot_applications` rows older than 24 months. Add a scheduled Supabase cron job (`pg_cron`) that runs monthly: `delete from public.reports where created_at < now() - interval '24 months';` and the same for `pilot_applications`. Suppressions are kept indefinitely so unsubscribes are honoured.

## 12. API routes, validation and error handling

Four route handlers, all running on the Node.js runtime in region `lhr1`, all validating input with the shared Zod schemas in `src/lib/schemas.ts`.

### `POST /api/report`

**Request body:**

```json
{
  "answers": { "inEngland": "yes", "excludedPremises": "no", "dwellings": "two_or_more", "storeys": 9 },
  "readiness": { "R1": "partly", "R2": "not_yet", "R3": "not_yet", "R4": "yes", "R5": "partly", "R6": "not_yet" },
  "buildingRef": "Example House",
  "contact": { "firstName": "Sam", "email": "sam@example.org", "organisation": "Example Homes", "role": "head_building_safety", "roleOther": null, "orgType": "housing_association", "buildingsBand": "6-20", "marketingConsent": false },
  "utm": { "source": null, "medium": null, "campaign": null },
  "turnstileToken": "..."
}
```

`readiness` values are `yes` | `partly` | `not_yet`. Keys for questions that were not asked are omitted (never sent as null), except `storeys` and `heightMetres`, where `null` means "I don't know". `readiness` is optional and only accepted when the server engine returns `in_scope`. Any `status` or `result` field sent by the client is ignored (strip unknown keys).

**Server steps, in order:**

1. Parse JSON; on failure return 400.
2. Validate with `reportRequestSchema`; on failure return 400 with field errors.
3. Verify the Turnstile token with Cloudflare's siteverify endpoint; on failure return 403.
4. Rate limit by hashed IP: 5 requests per 10 minutes, and 20 per 24 hours per email address; over the limit return 429.
5. Run `evaluateScope(answers)` and, if relevant, `scoreReadiness(readiness)` on the server.
6. Insert the row into `reports`.
7. Render the PDF to a buffer.
8. Send the user email with the PDF attached (Resend). On failure, store `email_error` and continue.
9. Send the founder notification (failure is logged, not returned).
10. Update `email_sent_at` if the email succeeded.
11. Return 200.

**Responses:**

| Status | Body | UI message |
| --- | --- | --- |
| 200 | `{ ok: true, reportId, status, emailSent: boolean, pdfBase64, fileName }` | Success state; if `emailSent` is false add "We couldn't email it, but you can download it now." |
| 400 | `{ ok: false, error: "validation", fields: { path: message } }` | Inline field errors |
| 403 | `{ ok: false, error: "bot_check" }` | "We couldn't verify you're human. Please refresh and try again." |
| 429 | `{ ok: false, error: "rate_limited" }` | "Too many requests. Please wait 10 minutes and try again." |
| 500 | `{ ok: false, error: "server" }` | Generic error from section 9A |

### `POST /api/pilot`

Same pattern: validate `pilotRequestSchema`, Turnstile, rate limit (3 per 10 minutes per IP), insert into `pilot_applications`, send confirmation and founder emails, return `{ ok: true }`. The client then routes to `/pilot/thanks`.

### `GET /api/unsubscribe?token=...` and page `/unsubscribe`

- Token = base64url(email) + "." + HMAC-SHA256(email, `UNSUBSCRIBE_SECRET`). Compare with a constant-time check.
- Valid token: upsert into `email_suppressions`, set `marketing_consent = false` on matching rows, show "You've been unsubscribed." Invalid: "This link isn't valid. Email hello@\[DOMAIN\] and we'll remove you."
- Also support the `List-Unsubscribe` and `List-Unsubscribe-Post` headers on marketing emails.

### `GET /api/health`

Returns `{ ok: true, version }`. No database call.

### Environment variables (`.env.example`)

```
NEXT_PUBLIC_SITE_URL=https://[DOMAIN]
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM="[BRAND] <hello@[DOMAIN]>"
EMAIL_REPLY_TO=
FOUNDER_EMAIL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UNSUBSCRIBE_SECRET=        # 32+ random bytes
IP_HASH_SALT=              # 32+ random bytes
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=[DOMAIN]
SENTRY_DSN=
```

The app must fail fast at build or start time with a clear message if any required server variable is missing (validate env with Zod in `src/lib/env.ts`).

## 13. Legal, privacy and security requirements

The site collects only business contact details and building facts, never resident or health data, and must say exactly that in its privacy notice.

**Privacy notice (`/privacy`) must include, in plain English:**

- Who the controller is: legal entity name, address, contact email.
- What we collect: report form fields, pilot form fields, building answers, hashed IP, UTM values, cookieless analytics.
- Why and on what lawful basis: sending the requested report (legitimate interests / steps taken at your request); reviewing pilot applications (legitimate interests); occasional updates (consent, via the unticked box); security and abuse prevention (legitimate interests).
- Who processes it: Vercel (hosting), Supabase (database, London), Resend (email), Cloudflare (Turnstile bot check), Upstash (rate limiting), Plausible (analytics), Sentry (error logs). State where each may process data and that safeguards are in place for any transfer outside the UK. Claude Code must leave a `TODO(founder)` to confirm each provider's region and transfer terms.
- Retention: 24 months, unsubscribes kept indefinitely.
- Rights: access, correction, deletion, objection, withdrawing consent, complaining to the Information Commissioner's Office (ico.org.uk).
- Version and "last updated" date.

**Other legal pages:**

- `/terms`: guidance-only disclaimer, no reliance, the Responsible Person remains responsible, liability limited to the extent the law allows, governing law England and Wales. Founder to have it reviewed.
- `/cookies`: list every cookie or storage item the live site actually sets (audit in browser dev tools before launch). Expected: none for analytics; `sessionStorage` key `rpeep-checker-v1` (strictly necessary for the checker); anything Turnstile sets. If only strictly necessary items exist, no consent banner is shown.
- `/accessibility`: WCAG 2.2 AA target, known issues (none at launch), contact email for problems.
- Footer company details as in section 6.

**Content rules:**

- No resident names, conditions, flat numbers or any health information may be entered anywhere in Phase 1. The building reference helper text says so.
- The disclaimer appears on the checker intro, every result, the PDF and the email.

**Security headers (set in `next.config` or middleware):**

| Header | Value |
| --- | --- |
| Content-Security-Policy | `default-src 'self'`; allow scripts and frames from `challenges.cloudflare.com` (Turnstile) and the Plausible script host; `img-src 'self' data:`; `connect-src 'self'` plus Plausible and Sentry endpoints; `frame-ancestors 'none'`; use nonces for any inline scripts |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |
| X-Frame-Options | `DENY` |

**Other security rules:**

- All secrets server-only; `.env*` files git-ignored; `.env.example` has no real values.
- Escape all user input in emails and the PDF. Never render user input as HTML.
- Run `npm audit` and fix high or critical issues before launch.
- Turnstile and rate limiting on both form endpoints.
- Request body size limit of 32KB on API routes.
- Supabase service role key never reaches the browser bundle. Add a test that searches the built client bundle for the key name and fails if found.
- Log errors to Sentry without personal data (scrub email and names in `beforeSend`).

## 14. SEO, analytics, performance and accessibility

Every page gets a unique title and description, the checker is tracked step by step, and every page must pass Lighthouse 95+ and axe with zero violations.

### A. Page metadata

| Route | Title (max 60 chars) | Meta description (max 155 chars) |
| --- | --- | --- |
| `/` | RPEEP compliance for Responsible Persons \| \[BRAND\] | Manage Residential PEEPs under the 2025 regulations. Check if your building is in scope in 2 minutes with our free tool. |
| `/checker` | Free RPEEP scope checker — is my building in scope? | Answer up to six questions to see if your building is covered by the Residential Evacuation Plans Regulations. Free PDF report. |
| `/rpeep-regulations-explained` | RPEEP regulations explained in plain English | What the Fire Safety (Residential Evacuation Plans) (England) Regulations 2025 require, which buildings are covered, and key duties. |
| `/pilot` | Join the \[BRAND\] founding pilot | Apply to help shape a tool for managing RPEEPs, consent, fire service information and reviews. |

Also: canonical URLs, Open Graph and Twitter cards (generated `opengraph-image.tsx`: navy background, white title, wordmark), `sitemap.ts`, `robots.ts` (allow all, disallow `/api/` and `/unsubscribe`), `lang="en-GB"`.

**Structured data (JSON-LD):** `Organization` on every page; `FAQPage` on the home page FAQ; `WebApplication` (free, category "BusinessApplication") on `/checker`; `Article` on the guide page.

### B. Guide page `/rpeep-regulations-explained` (F7)

H1 "RPEEP regulations explained". Sections with H2s: What the regulations are and when they started · Which buildings are covered (rules R1–R3, C1–C3 and measurement rules) · Who is a relevant resident · The nine duties (table D) · Sharing information with the fire service · Building emergency evacuation plans · Reviews · Common questions (reuse FAQ) · Check your building (CTA to `/checker`). Every section cites regulation numbers and links to legislation.gov.uk. 1,200–1,800 words. Table of contents with anchor links at the top. Reading width 720px. "Last reviewed" date at the top, set in `src/content/site.ts`.

### C. Analytics events (Plausible custom events)

| Event | Properties | Fired when |
| --- | --- | --- |
| `cta_clicked` | `location` | Any CTA button clicked |
| `checker_started` | none | Start pressed on intro |
| `question_answered` | `step` | Continue pressed on a question |
| `checker_completed` | `status` | Result screen shown |
| `readiness_completed` | `score` | Readiness result shown |
| `report_requested` | `status` | Report form submitted successfully |
| `report_downloaded` | none | PDF download clicked |
| `pilot_started` | none | First pilot field focused |
| `pilot_submitted` | `orgType`, `buildingsBand`, `priceBand`, `willingToPay` | Pilot form succeeded |

Set up a Plausible funnel: `checker_started` → `checker_completed` → `report_requested` → `pilot_submitted`. Never send names, emails or organisation names to analytics. Wrap all tracking in one helper (`src/lib/analytics.ts`) that does nothing if Plausible is blocked.

### D. Performance budget

- Lighthouse mobile: Performance, Accessibility, Best Practices and SEO all 95 or higher on `/`, `/checker` and `/pilot`.
- Largest Contentful Paint under 2.5s, Cumulative Layout Shift under 0.1, Interaction to Next Paint under 200ms on a mid-range phone.
- First-load JavaScript under 150KB gzipped for `/`. Landing page sections are server components; only the checker, forms and mobile menu are client components.
- Load Turnstile only on pages with forms; load the PDF library only on the server.
- Fonts via `next/font` with `display: swap`.

### E. Accessibility (WCAG 2.2 AA)

- Semantic landmarks (`header`, `nav`, `main`, `footer`), one H1 per page, logical heading order.
- A "Skip to main content" link as the first focusable element.
- Every input has a visible label; errors linked with `aria-describedby`; error summary focused on submit failure.
- Radio cards use native radios in a `fieldset` with `legend`.
- Visible focus ring on every interactive element; nothing removed with `outline: none` unless replaced.
- Target size at least 24 x 24px (44 x 44px for primary buttons).
- Result status announced with `aria-live`; colour is never the only signal.
- Respect `prefers-reduced-motion`.
- Works at 400% zoom and 320px width without horizontal scrolling.
- Tested with keyboard only, NVDA or VoiceOver, and automated axe checks.

## 15. Testing plan and acceptance criteria

"No bugs" is defined as: every test below passes in CI, every manual check is ticked, and the founder has signed off every regulatory sentence.

### A. Engine unit tests (`engine.test.ts`) — all must pass

Unless stated: `inEngland: 'yes'`, `excludedPremises: 'no'`, `dwellings: 'two_or_more'`.

| # | Answers | Expected status | Expected criteria / missing / notes |
| --- | --- | --- | --- |
| T1 | inEngland `no` | not\_in\_scope | reason NOT\_ENGLAND, no notes |
| T2 | excludedPremises `yes` | not\_in\_scope | reason EXCLUDED\_PREMISES |
| T3 | dwellings `fewer_than_two` | not\_in\_scope | reason FEWER\_THAN\_TWO\_DWELLINGS |
| T4 | storeys 7 | in\_scope | criteria \[C2\] |
| T5 | storeys 6, height 18.0 | in\_scope | criteria \[C1\] |
| T6 | storeys 6, height 17.9, stay\_put | not\_in\_scope | reason BELOW\_THRESHOLDS, note OTHER\_DUTIES |
| T7 | storeys 4, height 11.0, simultaneous | not\_in\_scope | boundary: 11.0 is not "more than 11" |
| T8 | storeys 4, height 11.1, simultaneous | in\_scope | criteria \[C3\] |
| T9 | storeys 4, height 12, temporary\_simultaneous | in\_scope | criteria \[C3\], note TEMPORARY\_STRATEGY |
| T10 | storeys 4, height 12, phased\_or\_other | not\_in\_scope | BELOW\_THRESHOLDS |
| T11 | storeys 4, height 12, unsure | cannot\_confirm | missing \[STRATEGY\] |
| T12 | storeys 5, height null, stay\_put | cannot\_confirm | missing \[HEIGHT\] |
| T13 | storeys 5, height null, unsure | cannot\_confirm | missing \[HEIGHT, STRATEGY\] |
| T14 | storeys null, height 15, stay\_put | cannot\_confirm | missing \[STOREYS\] |
| T15 | storeys null, height 9 (strategy not asked) | cannot\_confirm | missing \[STOREYS\], note UNLIKELY\_SEVEN\_STOREYS |
| T16 | storeys null, height null, simultaneous | cannot\_confirm | missing \[HEIGHT, STOREYS\] |
| T17 | storeys 3, height 9 (strategy not asked) | not\_in\_scope | BELOW\_THRESHOLDS |
| T18 | storeys 8, height 25, simultaneous | in\_scope | criteria \[C1, C2, C3\], no TEMPORARY note |
| T19 | storeys 6, height 18, temporary\_simultaneous | in\_scope | criteria \[C1, C3\], no TEMPORARY note |
| T20 | inEngland `no`, storeys 10 | not\_in\_scope | NOT\_ENGLAND wins over everything |
| T21 | storeys 10, height null | in\_scope | storeys alone is enough |

**`getNextQuestion` tests:**

| # | Answers so far | Expected next |
| --- | --- | --- |
| N1 | {} | inEngland |
| N2 | inEngland yes | excludedPremises |
| N3 | + excludedPremises no | dwellings |
| N4 | + dwellings two\_or\_more | storeys |
| N5 | + storeys 7 | null (finished, in scope) |
| N6 | + storeys 6 | heightMetres |
| N7 | + storeys 6, height 20 | null |
| N8 | + storeys 6, height 9 | null (strategy skipped) |
| N9 | + storeys 6, height 15 | evacuationStrategy |
| N10 | + storeys 6, height null | evacuationStrategy |
| N11 | + storeys null, height 9 | null |
| N12 | inEngland no | null |
| N13 | dwellings fewer\_than\_two | null |

**Schema tests:** reject storeys 0, 121, 7.5, "seven"; reject height 0, 350.1, 11.15, -3; accept height "11,5" (normalised to 11.5) and "18 m" (normalised to 18). Reject a report request with a missing email, an email over 254 characters, or a role outside the list.

**Readiness tests:** all yes = 12 "Well prepared"; all partly = 6 "Partly prepared"; all not\_yet = 0 "Early stages"; totals 5 = Early, 6 = Partly, 9 = Partly, 10 = Well. Gap list contains exactly the non-yes items in R1–R6 order.

**Property test (recommended):** use `fast-check` to generate random valid answers and assert that `in_scope` is returned if and only if C1, C2 or C3 holds and R1–R3 pass.

### B. API tests (Vitest, mocked Supabase, Resend and Turnstile)

- Valid request returns 200 with a non-empty `pdfBase64` that starts with the PDF signature (`%PDF`).
- Client sends `status: 'in_scope'` with not-in-scope answers: stored and returned status is `not_in_scope`.
- Readiness sent for a not-in-scope building is ignored.
- Failed Turnstile returns 403 and stores nothing.
- Sixth request in 10 minutes from one IP returns 429.
- Resend failure still returns 200 with `emailSent: false` and stores `email_error`.
- Unsubscribe with a tampered token is rejected; a valid token adds a suppression row.

### C. End-to-end tests (Playwright, desktop Chrome and mobile Safari viewports)

1. Home → hero CTA → checker → storeys 9 → in scope → readiness (mixed answers) → report form → success → PDF downloads.
2. Checker → storeys 4, height 12, simultaneous → in scope via C3.
3. Checker → storeys "I don't know", height 15, stay put → cannot confirm → edit answers → storeys 7 → in scope.
4. Checker → Wales → not in scope immediately.
5. Browser back button returns to the previous question with the answer still selected.
6. Refresh mid-checker keeps progress; "Start again" clears it.
7. Report form: submit empty, see error summary and field errors, fix them, succeed.
8. Pilot form: from a finished checker, fields pre-fill; choosing 4 features is blocked at 3; submit; thanks page shows the first name.
9. Keyboard only: complete flow 1 without a mouse.
10. axe accessibility scan on every route has zero violations.

### D. Manual checks before launch

- [ ] Every regulatory sentence on the site, PDF and emails checked by the founder against SI 2025/797.
- [ ] Report email renders correctly in Outlook desktop, Outlook web, Gmail web and iPhone Mail.
- [ ] PDF opens correctly in Microsoft Edge, Adobe Acrobat and iPhone Files.
- [ ] Site tested in Chrome, Edge, Firefox and Safari (macOS and iOS).
- [ ] Lighthouse 95+ in all four categories on `/`, `/checker`, `/pilot` (mobile).
- [ ] 320px width and 400% zoom show no horizontal scrolling.
- [ ] Footer company details are real and correct.
- [ ] No employer name appears anywhere (search the codebase and built site).
- [ ] Cookie audit done and `/cookies` matches reality.
- [ ] Test submission appears in Supabase; founder notification arrives; unsubscribe works.

CI: GitHub Actions runs `typecheck`, `lint`, `vitest` and `playwright` on every push. Vercel production deploys only from `main` after CI passes.

## 16. Build plan: phased steps for Claude Code plan mode

Build in 13 small phases (0 to 12). In each phase, Claude Code plans first, you approve the plan, it builds, it runs the tests, and you commit.

**How to work each phase:**

1. Export this doc as Markdown and save it in the repo as `docs/PRD.md`.
2. Start Claude Code in the project folder and switch to plan mode (press Shift+Tab until plan mode shows).
3. Paste the phase prompt below. Read the plan it proposes. If it adds anything not in the PRD, tell it to remove it.
4. Approve the plan and let it build.
5. Ask it to run `npm run typecheck && npm run lint && npm test`. Paste any errors back exactly as shown.
6. Check the result yourself in the browser (`npm run dev`).
7. Commit with a clear message ("Phase 3: scope engine with tests"). Never start the next phase with failing tests.

**Phases:**

| Phase | Prompt to paste (plan mode) | Done when |
| --- | --- | --- |
| 0. Setup | "Read docs/PRD.md fully. Create CLAUDE.md that summarises the hard rules in sections 2, 4, 13 and 15, and says: always follow docs/PRD.md, never invent features or copy, ask before adding dependencies. Then scaffold a Next.js App Router + TypeScript strict + Tailwind + ESLint project matching the structure in section 4. Add shadcn/ui, Vitest, Playwright. Add npm scripts: dev, build, typecheck, lint, test, e2e." | `npm run dev` shows a blank page; all scripts run |
| 1. Config and env | "Implement src/content/site.ts with all \[BRAND\], \[DOMAIN\] and company placeholders from the PRD, and src/lib/env.ts validating every variable in section 12 with Zod. Create .env.example." | Missing env var gives a clear error |
| 2. Design system | "Implement section 5: colour tokens, typography, layout rules and every listed component, with a /dev/components page showing each one (exclude it from production)." | All components visible, keyboard focus visible |
| 3. Scope engine | "Implement section 7B exactly in src/lib/scope/engine.ts, plus all copy in 7C and 7D in src/content/regulations.ts. Write every test in section 15A first, then the code. Do not touch UI." | All T1–T21 and N1–N13 tests pass |
| 4. Readiness score | "Implement section 8C scoring in src/lib/readiness/score.ts with the readiness tests from 15A." | Readiness tests pass |
| 5. Schemas | "Implement src/lib/schemas.ts for the report request and pilot request (sections 9A, 10, 12), including number normalisation. Add the schema tests from 15A." | Schema tests pass |
| 6. Landing page | "Build the home page exactly as section 6, using content from src/content/. Build Header and Footer. No fake data." | Matches section 6; Lighthouse 95+ locally |
| 7. Checker UI | "Build /checker per section 8A–C using the engine from Phase 3. Implement URL hash steps, sessionStorage, focus management and analytics calls via src/lib/analytics.ts." | Manual run of all 3 result types works |
| 8. Database and API | "Create supabase/migrations/0001\_init.sql from section 11. Implement /api/report and /api/pilot per section 12 with Turnstile and Upstash rate limiting. Mock external services in tests. Add the API tests from 15B." | API tests pass; test row appears in Supabase |
| 9. PDF and emails | "Implement the PDF in section 9D with @react-pdf/renderer and the three emails in 9B, 9C and section 10. Add a script that writes sample PDFs for all three result types to /tmp for review." | Sample PDFs look right; test email arrives |
| 10. Forms, pilot, legal, guide | "Build ReportForm (9A), /pilot and /pilot/thanks (10), /unsubscribe (12), legal pages (13) and the guide page (14B). Add metadata, sitemap, robots, OG image and JSON-LD (14A)." | All routes render; no console errors |
| 11. Hardening | "Add security headers (13), the bundle secret-leak test, error and 404 pages, Sentry with PII scrubbing, and all Playwright tests in 15C including axe scans. Fix every failure." | All unit, API and e2e tests pass |
| 12. Deploy | "Set up GitHub Actions CI per 15D, then guide me step by step through deploying to Vercel with region lhr1, adding env vars and connecting \[DOMAIN\]." | Live site on \[DOMAIN\]; manual checklist 15D ticked |

**Rules to repeat to Claude Code whenever it drifts:**

- "Follow docs/PRD.md exactly. If something is unclear, ask me instead of guessing."
- "Do not change the scope engine logic or regulation copy without showing me the diff and the PRD section it matches."
- "Run the tests and show me the output before saying it's done."

You do not need GPT to rewrite these prompts. The PRD is the detailed spec; the prompts only point Claude Code at the right section.

## 17. Launch checklist and tasks you do yourself

Claude Code can write the code, but these accounts, decisions and checks need you.

**Before Phase 0:**

- [ ] Choose the brand name and check the domain and Companies House name are free.
- [ ] Decide: limited company or sole trader (affects footer details and invoices later).
- [ ] Read your employment contract for outside-business, IP and client-contact clauses; get advice if unclear.
- [ ] Create accounts: GitHub, Vercel, Supabase (create the project in London), Resend, Cloudflare (Turnstile), Upstash, Plausible, Sentry.

**Before Phase 8:**

- [ ] Buy the domain. Set up the company mailbox (Google Workspace or Microsoft 365).
- [ ] Add DNS records: Resend domain verification, SPF, DKIM and DMARC.
- [ ] Create Turnstile site and secret keys for `[DOMAIN]` and `localhost`.
- [ ] Generate `UNSUBSCRIBE_SECRET` and `IP_HASH_SALT` (32+ random bytes each, e.g. `openssl rand -hex 32`).

**Before launch:**

- [ ] Check every regulatory sentence against [SI 2025/797](https://www.legislation.gov.uk/uksi/2025/797/made), and confirm the height help text against Appendix D of Approved Document B.
- [ ] Fill in the real company details, privacy notice controller details, and each provider's data region and transfer terms.
- [ ] Pay the ICO data protection fee if it applies to you, and add your registration number to the privacy notice.
- [ ] Have the terms and privacy notice reviewed.
- [ ] Complete the manual checklist in section 15D.
- [ ] Send yourself reports for all three result types and check them in Outlook and Gmail.
- [ ] Soft-launch to 2–3 trusted people and fix what they find.
- [ ] Remove any contacts from your outreach list that you know through your employer.

**After launch (weekly):**

- [ ] Review Plausible funnel and Supabase rows against the section 1 targets.
- [ ] Reply to every pilot application within 3 working days.
- [ ] Re-check GOV.UK guidance and legislation.gov.uk for changes; if anything changes, update `src/content/regulations.ts`, bump `engineVersion`, and re-run all tests.

**Sources:** [The Fire Safety (Residential Evacuation Plans) (England) Regulations 2025, SI 2025/797](https://www.legislation.gov.uk/uksi/2025/797/made) · [Cheshire Fire and Rescue Service summary](https://www.cheshirefire.gov.uk/fire-protection/business-owner-landlord-or-employee/fire-safety-residential-evacuation-plans-england-regulations-2025).
