/**
 * Zod schemas shared by the browser and the server (PRD sections 4, 8A, 9A, 10 and 12).
 * One set of validation rules: the forms use them for inline errors, and the API routes
 * use them again on every request. Unknown keys are stripped, so a `status` or `result`
 * sent by the browser never reaches the server code.
 */

import { z } from 'zod';
import {
  buildingsBandLabels,
  currentMethodLabels,
  featureLabels,
  fraTrackerLabels,
  keysOf,
  orgTypeLabels,
  priceBandLabels,
  roleLabels,
  startTimingLabels,
} from '@/content/forms';
import { READINESS_ANSWERS } from '@/lib/readiness/score';
import { pruneAnswers } from '@/lib/scope/answers';
import { getNextQuestion, type Answers, type QuestionId } from '@/lib/scope/engine';

// ---------------------------------------------------------------------------
// Messages (PRD section 8A, "Validation messages")
// ---------------------------------------------------------------------------

export const messages = {
  choose: 'Choose an option to continue.',
  storeys: "Enter a whole number between 1 and 120, or tick 'I don't know'.",
  height: "Enter a height between 0.1 and 350 metres, using up to one decimal place, or tick 'I don't know'.",
} as const;

// ---------------------------------------------------------------------------
// Number normalisation
// ---------------------------------------------------------------------------

export const STOREYS_MIN = 1;
export const STOREYS_MAX = 120;
export const HEIGHT_MIN = 0.1;
export const HEIGHT_MAX = 350;

/** Strip every kind of space, including non-breaking spaces. */
const withoutSpaces = (text: string) => text.replace(/\s+/g, '');

/** True when `n` has at most one decimal place (allowing for floating-point error). */
const hasOneDecimalPlace = (n: number) => Math.abs(n * 10 - Math.round(n * 10)) < 1e-9;

/**
 * Whole number of storeys from a number or from typed text. Returns `undefined` if it is not
 * a whole number from 1 to 120. "7", " 7 " and 7 are accepted; "7.5", "seven" and 0 are not.
 */
export function parseStoreys(input: number | string): number | undefined {
  const n = typeof input === 'number' ? input : /^\d+$/.test(withoutSpaces(input)) ? Number(withoutSpaces(input)) : NaN;
  return Number.isInteger(n) && n >= STOREYS_MIN && n <= STOREYS_MAX ? n : undefined;
}

/**
 * Height in metres from a number or from typed text. Accepts "." and "," as the decimal
 * separator and strips spaces and a trailing "m": "11,5" is 11.5 and "18 m" is 18. Returns
 * `undefined` if it is not between 0.1 and 350 with at most one decimal place.
 */
export function parseHeight(input: number | string): number | undefined {
  let n: number;
  if (typeof input === 'number') {
    n = input;
  } else {
    const text = withoutSpaces(input).replace(/m$/i, '');
    n = /^\d+(?:[.,]\d+)?$/.test(text) ? Number(text.replace(',', '.')) : NaN;
  }
  return Number.isFinite(n) && n >= HEIGHT_MIN && n <= HEIGHT_MAX && hasOneDecimalPlace(n) ? Math.round(n * 10) / 10 : undefined;
}

/** `null` means "I don't know" and is kept as it is. */
function numberOrUnknown(parse: (input: number | string) => number | undefined, message: string) {
  return z.union([z.null(), z.number(), z.string()], { error: message }).transform((value, ctx) => {
    if (value === null) return null;
    const parsed = parse(value);
    if (parsed === undefined) {
      ctx.addIssue({ code: 'custom', message });
      return z.NEVER;
    }
    return parsed;
  });
}

export const storeysSchema = numberOrUnknown(parseStoreys, messages.storeys);
export const heightSchema = numberOrUnknown(parseHeight, messages.height);

// ---------------------------------------------------------------------------
// Scope answers (PRD section 7B, `Answers`)
// ---------------------------------------------------------------------------

const choice = <const T extends readonly [string, ...string[]]>(values: T) => z.enum(values, { error: messages.choose });

const answersShape = z.object({
  inEngland: choice(['yes', 'no']).optional(),
  excludedPremises: choice(['yes', 'no']).optional(),
  dwellings: choice(['two_or_more', 'fewer_than_two']).optional(),
  storeys: storeysSchema.optional(),
  heightMetres: heightSchema.optional(),
  evacuationStrategy: choice(['stay_put', 'simultaneous', 'temporary_simultaneous', 'phased_or_other', 'unsure']).optional(),
});

const missingMessage = (question: QuestionId): string =>
  question === 'storeys' ? messages.storeys : question === 'heightMetres' ? messages.height : messages.choose;

/**
 * The answers sent with a report request. Keys for questions that were not asked are omitted;
 * `storeys` and `heightMetres` use `null` for "I don't know". The checker must be finished
 * (`getNextQuestion` returns `null`), and answers to questions it would not have asked are dropped,
 * so the stored answers always match what the engine would have asked.
 */
export const answersSchema = answersShape.transform((raw, ctx): Partial<Answers> => {
  const answers = pruneAnswers(raw as Partial<Answers>);
  const next = getNextQuestion(answers);
  if (next !== null) {
    ctx.addIssue({ code: 'custom', path: [next], message: missingMessage(next) });
    return z.NEVER;
  }
  return answers;
});

// ---------------------------------------------------------------------------
// Readiness (PRD section 8C)
// ---------------------------------------------------------------------------

const readinessAnswer = z.enum(READINESS_ANSWERS, { error: messages.choose });

/** All six readiness answers. The whole object is optional on a request, but never half-filled. */
export const readinessSchema = z.object({
  R1: readinessAnswer,
  R2: readinessAnswer,
  R3: readinessAnswer,
  R4: readinessAnswer,
  R5: readinessAnswer,
  R6: readinessAnswer,
});

// ---------------------------------------------------------------------------
// Shared fields
// ---------------------------------------------------------------------------

const emailMessage = 'Enter a valid email address.';

/** Trimmed, lower-cased, at most 254 characters (PRD sections 9A and 11). */
export const emailSchema = z
  .string({ error: emailMessage })
  .trim()
  .toLowerCase()
  .min(1, emailMessage)
  .max(254, 'Email address must be 254 characters or fewer.')
  .pipe(z.email({ error: emailMessage }));

const requiredText = (max: number, required: string, tooLong: string) =>
  z.string({ error: required }).trim().min(1, required).max(max, tooLong);

/** Optional text that becomes `null` when left empty. */
const optionalText = (max: number, tooLong: string) =>
  z
    .string()
    .trim()
    .max(max, tooLong)
    .nullish()
    .transform((value) => value || null);

const firstName = requiredText(60, 'Enter your first name.', 'First name must be 60 characters or fewer.');
const organisation = requiredText(120, 'Enter your organisation.', 'Organisation must be 120 characters or fewer.');
const role = z.enum(keysOf(roleLabels), { error: 'Choose your role.' });
const roleOther = optionalText(60, 'Describe your role in 60 characters or fewer.');
const orgType = z.enum(keysOf(orgTypeLabels), { error: 'Choose your organisation type.' });
const buildingsBand = z.enum(keysOf(buildingsBandLabels), { error: 'Choose how many buildings may be in scope.' });
/** Unticked by default, so a missing value means "no". */
const marketingConsent = z.boolean({ error: 'Choose an option to continue.' }).default(false);

const utmValue = optionalText(200, 'UTM values must be 200 characters or fewer.');

/** UTM parameters captured from the landing URL (PRD section 9A, "Hidden fields"). */
export const utmSchema = z
  .object({ source: utmValue, medium: utmValue, campaign: utmValue })
  .default({ source: null, medium: null, campaign: null });

const turnstileToken = z
  .string({ error: 'Complete the bot check to continue.' })
  .trim()
  .min(1, 'Complete the bot check to continue.')
  .max(2048, 'Complete the bot check to continue.');

/** "Other" reveals a text field. The text is kept only when the choice is "Other". */
const keepRoleOtherOnlyForOther = <T extends { role: string; roleOther: string | null }>(value: T): T => ({
  ...value,
  roleOther: value.role === 'other' ? value.roleOther : null,
});

// ---------------------------------------------------------------------------
// Report request: POST /api/report (PRD sections 9A and 12)
// ---------------------------------------------------------------------------

/** The six fields of the report form. Also used on its own by the form for inline errors. */
export const reportContactSchema = z
  .object({
    firstName,
    email: emailSchema,
    organisation,
    role,
    roleOther,
    orgType,
    buildingsBand,
    marketingConsent,
  })
  .transform(keepRoleOtherOnlyForOther);

export const buildingRefSchema = optionalText(80, 'Building name or reference must be 80 characters or fewer.');

export const reportRequestSchema = z.object({
  answers: answersSchema,
  /** Optional. Only accepted by the route when the server engine returns `in_scope`. */
  readiness: readinessSchema.optional(),
  buildingRef: buildingRefSchema,
  contact: reportContactSchema,
  utm: utmSchema,
  turnstileToken,
});

export type ReportRequest = z.output<typeof reportRequestSchema>;
export type ReportRequestInput = z.input<typeof reportRequestSchema>;
export type ReportContact = z.output<typeof reportContactSchema>;

// ---------------------------------------------------------------------------
// Pilot request: POST /api/pilot (PRD section 10)
// ---------------------------------------------------------------------------

const currentMethod = z.enum(keysOf(currentMethodLabels));
const feature = z.enum(keysOf(featureLabels));

const unique = <T>(items: T[]): T[] => [...new Set(items)];

const pilotFields = z.object({
  firstName,
  lastName: requiredText(60, 'Enter your last name.', 'Last name must be 60 characters or fewer.'),
  email: emailSchema,
  organisation,
  role,
  roleOther,
  orgType,
  buildingsBand,
  currentMethods: z
    .array(currentMethod, { error: 'Choose at least one option.' })
    .min(1, 'Choose at least one option.')
    .transform(unique),
  /** "Which one?", revealed by "Our existing compliance software". */
  currentSoftware: optionalText(80, 'Software name must be 80 characters or fewer.'),
  hardestPart: z
    .string({ error: 'Tell us the hardest part, in 10 to 800 characters.' })
    .trim()
    .min(10, 'Tell us the hardest part, in 10 to 800 characters.')
    .max(800, 'Keep this to 800 characters or fewer.'),
  /** Up to three. Zero is allowed. */
  topFeatures: z
    .array(feature)
    .transform(unique)
    .pipe(z.array(feature).max(3, 'Choose up to 3 features.'))
    .default([]),
  wantsFraTracker: z.enum(keysOf(fraTrackerLabels), { error: 'Choose an option.' }),
  priceBand: z.enum(keysOf(priceBandLabels), { error: 'Choose an option.' }),
  willingToPay: z.boolean().default(false),
  startTiming: z.enum(keysOf(startTimingLabels), { error: 'Choose an option.' }),
  marketingConsent,
});

type PilotFields = z.output<typeof pilotFields>;

/** The software name is kept only when "Our existing compliance software" is ticked. */
const normalisePilot = <T extends PilotFields>(value: T): T => ({
  ...keepRoleOtherOnlyForOther(value),
  currentSoftware: value.currentMethods.includes('compliance_software') ? value.currentSoftware : null,
});

/** The visible form fields only (P1–P15). Used by the form for inline errors. */
export const pilotFormSchema = pilotFields.transform(normalisePilot);

export const pilotRequestSchema = pilotFields
  .extend({
    /** Links the application to a report when the visitor came from a finished checker. */
    reportId: z.uuid({ error: 'Invalid report reference.' }).nullish().transform((value) => value ?? null),
    utm: utmSchema,
    turnstileToken,
  })
  .transform(normalisePilot);

export type PilotRequest = z.output<typeof pilotRequestSchema>;
export type PilotRequestInput = z.input<typeof pilotRequestSchema>;
export type PilotForm = z.output<typeof pilotFormSchema>;

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Flatten a Zod error to `{ "contact.email": "message" }`, keeping the first message for each
 * field. This is the `fields` object returned with a 400 (PRD section 12).
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'form';
    fields[path] ??= issue.message;
  }
  return fields;
}
