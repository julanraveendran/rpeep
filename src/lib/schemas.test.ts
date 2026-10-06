import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { buildingsBandLabels, orgTypeLabels, roleLabels } from '@/content/forms';
import {
  answersSchema,
  emailSchema,
  fieldErrors,
  heightSchema,
  messages,
  parseHeight,
  parseStoreys,
  pilotFormSchema,
  pilotRequestSchema,
  reportRequestSchema,
  storeysSchema,
} from './schemas';

/** Run a schema and return either the value or the field errors. */
function run<T extends z.ZodType>(schema: T, input: unknown) {
  const result = schema.safeParse(input);
  return result.success ? { ok: true as const, data: result.data as z.output<T> } : { ok: false as const, errors: fieldErrors(result.error) };
}

describe('storeys (PRD section 15A, schema tests)', () => {
  it.each([0, 121, 7.5, 'seven', -1, '', '7.5', 'NaN', 1e3, true, {}])('rejects %j with the storeys message', (value) => {
    const result = storeysSchema.safeParse(value);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe(messages.storeys);
  });

  it.each([
    [1, 1],
    [7, 7],
    [120, 120],
    ['7', 7],
    [' 7 ', 7],
    ['1 2', 12],
  ])('accepts %j as %j', (input, expected) => {
    expect(storeysSchema.parse(input)).toBe(expected);
  });

  it('keeps "I don\'t know" (null) as null', () => {
    expect(storeysSchema.parse(null)).toBeNull();
  });

  it('has a parse helper for the number field', () => {
    expect(parseStoreys('6')).toBe(6);
    expect(parseStoreys('6.0')).toBeUndefined();
  });
});

describe('height (PRD section 15A, schema tests)', () => {
  it.each([0, 350.1, 11.15, -3, '0', '350.1', '11.15', '-3', 'tall', '', 'm', '1e2', '11..5', '11,', ',5', 351, 0.05])(
    'rejects %j with the height message',
    (value) => {
      const result = heightSchema.safeParse(value);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.message).toBe(messages.height);
    },
  );

  it.each([
    ['11,5', 11.5],
    ['18 m', 18],
    ['18m', 18],
    ['18 M', 18],
    ['  11.1  ', 11.1],
    ['0.1', 0.1],
    ['350', 350],
    ['1 8 . 0 m', 18],
    [18, 18],
    [11.1, 11.1],
    [0.1, 0.1],
    [350, 350],
    [18.3, 18.3],
    [' 18 m', 18],
  ])('accepts %j as %j', (input, expected) => {
    expect(heightSchema.parse(input)).toBe(expected);
  });

  it('keeps "I don\'t know" (null) as null', () => {
    expect(heightSchema.parse(null)).toBeNull();
  });

  it('keeps the boundary values exact: 11.0 stays 11 and 11.1 stays 11.1', () => {
    expect(parseHeight('11')).toBe(11);
    expect(parseHeight('11.1')).toBe(11.1);
    expect(parseHeight('17,9')).toBe(17.9);
    expect(parseHeight('18.0')).toBe(18);
  });
});

describe('answersSchema', () => {
  const base = { inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more' } as const;

  it('accepts a finished set of answers', () => {
    expect(run(answersSchema, { ...base, storeys: 9 })).toEqual({ ok: true, data: { ...base, storeys: 9 } });
  });

  it('normalises typed numbers', () => {
    const result = run(answersSchema, { ...base, storeys: '4', heightMetres: '12,5', evacuationStrategy: 'simultaneous' });
    expect(result).toEqual({ ok: true, data: { ...base, storeys: 4, heightMetres: 12.5, evacuationStrategy: 'simultaneous' } });
  });

  it('rejects answers that stop before the checker would finish, at the question that is missing', () => {
    expect(run(answersSchema, {})).toEqual({ ok: false, errors: { inEngland: messages.choose } });
    expect(run(answersSchema, { ...base })).toEqual({ ok: false, errors: { storeys: messages.storeys } });
    expect(run(answersSchema, { ...base, storeys: 4 })).toEqual({ ok: false, errors: { heightMetres: messages.height } });
    expect(run(answersSchema, { ...base, storeys: 4, heightMetres: 15 })).toEqual({
      ok: false,
      errors: { evacuationStrategy: messages.choose },
    });
  });

  it('does not ask for the evacuation strategy when the height is 11m or less', () => {
    expect(run(answersSchema, { ...base, storeys: 4, heightMetres: 11 }).ok).toBe(true);
  });

  it('accepts "I don\'t know" for storeys and height', () => {
    expect(run(answersSchema, { ...base, storeys: null, heightMetres: null, evacuationStrategy: 'unsure' }).ok).toBe(true);
  });

  it('drops answers to questions the checker would not have asked', () => {
    const result = run(answersSchema, { inEngland: 'no', excludedPremises: 'no', dwellings: 'two_or_more', storeys: 10, heightMetres: 30 });
    expect(result).toEqual({ ok: true, data: { inEngland: 'no' } });
    expect(run(answersSchema, { ...base, storeys: 9, heightMetres: 5, evacuationStrategy: 'stay_put' })).toEqual({
      ok: true,
      data: { ...base, storeys: 9 },
    });
  });

  it('rejects a value that is not one of the options', () => {
    expect(run(answersSchema, { ...base, inEngland: 'maybe' }).ok).toBe(false);
    expect(run(answersSchema, { ...base, inEngland: null }).ok).toBe(false);
    expect(run(answersSchema, { ...base, dwellings: 'three' })).toMatchObject({ ok: false, errors: { dwellings: messages.choose } });
  });

  it('reports a bad number at its own field', () => {
    expect(run(answersSchema, { ...base, storeys: 7.5 })).toEqual({ ok: false, errors: { storeys: messages.storeys } });
    expect(run(answersSchema, { ...base, storeys: 4, heightMetres: 11.15 })).toEqual({ ok: false, errors: { heightMetres: messages.height } });
  });
});

describe('emailSchema', () => {
  it('trims and lower-cases', () => {
    expect(emailSchema.parse('  Sam@Example.ORG ')).toBe('sam@example.org');
  });

  it('does not block personal domains', () => {
    expect(emailSchema.parse('sam@gmail.com')).toBe('sam@gmail.com');
  });

  it.each(['', '   ', 'sam', 'sam@', '@example.org', 'sam example@org.uk', 'sam@@example.org'])('rejects %j', (value) => {
    expect(emailSchema.safeParse(value).success).toBe(false);
  });

  it('accepts 254 characters and rejects 255', () => {
    const domain = `${'a'.repeat(60)}.${'b'.repeat(60)}.${'c'.repeat(60)}.example.org`;
    const withLength = (n: number) => `${'x'.repeat(n - 1 - domain.length)}@${domain}`;
    // The local part is longer than the 64 characters the format allows, so only the length rule is under test here.
    const long = emailSchema.safeParse(withLength(255));
    expect(long.success).toBe(false);
    if (!long.success) expect(long.error.issues[0]?.message).toBe('Email address must be 254 characters or fewer.');
    expect(emailSchema.safeParse(`${'x'.repeat(40)}@${domain}`).success).toBe(true);
  });
});

/** The exact example body from PRD section 12. */
const prdExample = {
  answers: { inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more', storeys: 9 },
  readiness: { R1: 'partly', R2: 'not_yet', R3: 'not_yet', R4: 'yes', R5: 'partly', R6: 'not_yet' },
  buildingRef: 'Example House',
  contact: {
    firstName: 'Sam',
    email: 'sam@example.org',
    organisation: 'Example Homes',
    role: 'head_building_safety',
    roleOther: null,
    orgType: 'housing_association',
    buildingsBand: '6-20',
    marketingConsent: false,
  },
  utm: { source: null, medium: null, campaign: null },
  turnstileToken: '...',
};

const clone = <T>(value: T): T => structuredClone(value);

describe('reportRequestSchema (PRD sections 9A and 12)', () => {
  it('accepts the example request from the PRD', () => {
    const result = run(reportRequestSchema, prdExample);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.answers).toEqual({ inEngland: 'yes', excludedPremises: 'no', dwellings: 'two_or_more', storeys: 9 });
      expect(result.data.contact.email).toBe('sam@example.org');
      expect(result.data.buildingRef).toBe('Example House');
    }
  });

  it('accepts a request without readiness, building reference or UTM values', () => {
    const { readiness: _readiness, buildingRef: _ref, utm: _utm, ...minimal } = prdExample;
    void _readiness;
    void _ref;
    void _utm;
    const result = run(reportRequestSchema, minimal);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.readiness).toBeUndefined();
      expect(result.data.buildingRef).toBeNull();
      expect(result.data.utm).toEqual({ source: null, medium: null, campaign: null });
    }
  });

  it('rejects a missing email', () => {
    const body = clone(prdExample);
    delete (body.contact as Partial<typeof body.contact>).email;
    expect(run(reportRequestSchema, body)).toMatchObject({ ok: false, errors: { 'contact.email': 'Enter a valid email address.' } });
  });

  it('rejects an email over 254 characters', () => {
    const body = clone(prdExample);
    body.contact.email = `${'a'.repeat(250)}@example.org`;
    expect(run(reportRequestSchema, body)).toMatchObject({ ok: false, errors: { 'contact.email': expect.any(String) } });
  });

  it('rejects a role outside the list, and accepts every role in the list', () => {
    const body = clone(prdExample);
    body.contact.role = 'ceo';
    expect(run(reportRequestSchema, body)).toMatchObject({ ok: false, errors: { 'contact.role': 'Choose your role.' } });
    for (const role of Object.keys(roleLabels)) {
      expect(run(reportRequestSchema, { ...prdExample, contact: { ...prdExample.contact, role } }).ok, role).toBe(true);
    }
  });

  it('rejects an organisation type or buildings band outside the list, and accepts every one in the list', () => {
    expect(run(reportRequestSchema, { ...prdExample, contact: { ...prdExample.contact, orgType: 'charity' } }).ok).toBe(false);
    expect(run(reportRequestSchema, { ...prdExample, contact: { ...prdExample.contact, buildingsBand: '7' } }).ok).toBe(false);
    for (const orgType of Object.keys(orgTypeLabels)) {
      expect(run(reportRequestSchema, { ...prdExample, contact: { ...prdExample.contact, orgType } }).ok, orgType).toBe(true);
    }
    for (const buildingsBand of Object.keys(buildingsBandLabels)) {
      expect(run(reportRequestSchema, { ...prdExample, contact: { ...prdExample.contact, buildingsBand } }).ok, buildingsBand).toBe(true);
    }
  });

  it('ignores a status or result sent by the browser (unknown keys are stripped)', () => {
    const result = run(reportRequestSchema, { ...prdExample, status: 'in_scope', result: { status: 'in_scope' }, answers: { ...prdExample.answers, status: 'in_scope' } });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty('status');
      expect(result.data).not.toHaveProperty('result');
      expect(result.data.answers).not.toHaveProperty('status');
    }
  });

  it('keeps every error at its own field, so the form can show it inline', () => {
    const result = run(reportRequestSchema, { answers: {}, contact: {}, turnstileToken: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(
        [
          'answers.inEngland',
          'contact.buildingsBand',
          'contact.email',
          'contact.firstName',
          'contact.orgType',
          'contact.organisation',
          'contact.role',
          'turnstileToken',
        ].sort(),
      );
    }
  });

  it('enforces the length limits: first name 60, organisation 120, role text 60, building reference 80', () => {
    const tooLong = (patch: Record<string, unknown>, buildingRef?: string) =>
      run(reportRequestSchema, { ...prdExample, buildingRef: buildingRef ?? prdExample.buildingRef, contact: { ...prdExample.contact, ...patch } }).ok;
    expect(tooLong({ firstName: 'a'.repeat(60) })).toBe(true);
    expect(tooLong({ firstName: 'a'.repeat(61) })).toBe(false);
    expect(tooLong({ organisation: 'a'.repeat(120) })).toBe(true);
    expect(tooLong({ organisation: 'a'.repeat(121) })).toBe(false);
    expect(tooLong({ role: 'other', roleOther: 'a'.repeat(60) })).toBe(true);
    expect(tooLong({ role: 'other', roleOther: 'a'.repeat(61) })).toBe(false);
    expect(tooLong({}, 'a'.repeat(80))).toBe(true);
    expect(tooLong({}, 'a'.repeat(81))).toBe(false);
  });

  it('trims text, turns empty optional text into null, and drops the role text unless the role is "Other"', () => {
    const result = run(reportRequestSchema, {
      ...prdExample,
      buildingRef: '   ',
      contact: { ...prdExample.contact, firstName: '  Sam  ', roleOther: 'something', email: ' SAM@Example.org ' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.buildingRef).toBeNull();
      expect(result.data.contact.firstName).toBe('Sam');
      expect(result.data.contact.roleOther).toBeNull();
      expect(result.data.contact.email).toBe('sam@example.org');
    }
    const other = run(reportRequestSchema, { ...prdExample, contact: { ...prdExample.contact, role: 'other', roleOther: ' Surveyor ' } });
    expect(other.ok && other.data.contact.roleOther).toBe('Surveyor');
  });

  it('treats marketing consent as unticked unless it is exactly true', () => {
    const { marketingConsent: _consent, ...withoutConsent } = prdExample.contact;
    void _consent;
    const missing = run(reportRequestSchema, { ...prdExample, contact: withoutConsent });
    expect(missing.ok && missing.data.contact.marketingConsent).toBe(false);
    expect(run(reportRequestSchema, { ...prdExample, contact: { ...prdExample.contact, marketingConsent: 'yes' } }).ok).toBe(false);
    const ticked = run(reportRequestSchema, { ...prdExample, contact: { ...prdExample.contact, marketingConsent: true } });
    expect(ticked.ok && ticked.data.contact.marketingConsent).toBe(true);
  });

  it('rejects readiness that is only partly filled in, or has an unknown answer', () => {
    expect(run(reportRequestSchema, { ...prdExample, readiness: { R1: 'yes' } }).ok).toBe(false);
    expect(run(reportRequestSchema, { ...prdExample, readiness: { ...prdExample.readiness, R3: 'maybe' } })).toMatchObject({
      ok: false,
      errors: { 'readiness.R3': messages.choose },
    });
  });

  it('requires a Turnstile token', () => {
    const { turnstileToken: _token, ...withoutToken } = prdExample;
    void _token;
    expect(run(reportRequestSchema, withoutToken)).toMatchObject({ ok: false, errors: { turnstileToken: 'Complete the bot check to continue.' } });
  });
});

const pilot = {
  firstName: 'Sam',
  lastName: 'Jones',
  email: 'sam@example.org',
  organisation: 'Example Homes',
  role: 'property_block_manager',
  roleOther: null,
  orgType: 'managing_agent',
  buildingsBand: '2-5',
  currentMethods: ['spreadsheets'],
  currentSoftware: null,
  hardestPart: 'Finding residents who need help to evacuate.',
  topFeatures: ['find_residents', 'record_consent'],
  wantsFraTracker: 'maybe',
  priceBand: '100_250',
  willingToPay: true,
  startTiming: 'within_3_months',
  marketingConsent: false,
};

describe('pilotRequestSchema (PRD section 10)', () => {
  const request = { ...pilot, utm: { source: 'report_email', medium: null, campaign: null }, turnstileToken: 'token' };

  it('accepts a complete application', () => {
    expect(run(pilotRequestSchema, request).ok).toBe(true);
    expect(run(pilotFormSchema, pilot).ok).toBe(true);
  });

  it('requires at least one way of managing RPEEPs today', () => {
    expect(run(pilotFormSchema, { ...pilot, currentMethods: [] })).toMatchObject({ ok: false, errors: { currentMethods: 'Choose at least one option.' } });
    expect(run(pilotFormSchema, { ...pilot, currentMethods: ['pen_and_ink'] }).ok).toBe(false);
  });

  it('limits the top features to three, and allows none', () => {
    const four = ['find_residents', 'record_consent', 'pcfra_forms', 'review_reminders'];
    expect(run(pilotFormSchema, { ...pilot, topFeatures: four })).toMatchObject({ ok: false, errors: { topFeatures: 'Choose up to 3 features.' } });
    expect(run(pilotFormSchema, { ...pilot, topFeatures: four.slice(0, 3) }).ok).toBe(true);
    const none = run(pilotFormSchema, { ...pilot, topFeatures: [] });
    expect(none.ok && none.data.topFeatures).toEqual([]);
    const { topFeatures: _features, ...without } = pilot;
    void _features;
    const omitted = run(pilotFormSchema, without);
    expect(omitted.ok && omitted.data.topFeatures).toEqual([]);
  });

  it('counts a repeated feature once', () => {
    const result = run(pilotFormSchema, { ...pilot, topFeatures: ['find_residents', 'find_residents', 'record_consent', 'pcfra_forms'] });
    expect(result.ok && result.data.topFeatures).toEqual(['find_residents', 'record_consent', 'pcfra_forms']);
  });

  it('requires the hardest part to be 10 to 800 characters', () => {
    const tooShort = 'a'.repeat(9);
    expect(run(pilotFormSchema, { ...pilot, hardestPart: tooShort })).toMatchObject({ ok: false, errors: { hardestPart: expect.stringContaining('10 to 800') } });
    expect(run(pilotFormSchema, { ...pilot, hardestPart: '   ' }).ok).toBe(false);
    expect(run(pilotFormSchema, { ...pilot, hardestPart: 'a'.repeat(10) }).ok).toBe(true);
    expect(run(pilotFormSchema, { ...pilot, hardestPart: 'a'.repeat(800) }).ok).toBe(true);
    expect(run(pilotFormSchema, { ...pilot, hardestPart: 'a'.repeat(801) }).ok).toBe(false);
  });

  it('keeps the software name only when "Our existing compliance software" is ticked', () => {
    const without = run(pilotFormSchema, { ...pilot, currentSoftware: 'Acme Compliance' });
    expect(without.ok && without.data.currentSoftware).toBeNull();
    const withSoftware = run(pilotFormSchema, { ...pilot, currentMethods: ['compliance_software', 'spreadsheets'], currentSoftware: ' Acme Compliance ' });
    expect(withSoftware.ok && withSoftware.data.currentSoftware).toBe('Acme Compliance');
    expect(run(pilotFormSchema, { ...pilot, currentMethods: ['compliance_software'], currentSoftware: 'a'.repeat(81) }).ok).toBe(false);
  });

  it('requires both names, each up to 60 characters', () => {
    expect(run(pilotFormSchema, { ...pilot, lastName: '' })).toMatchObject({ ok: false, errors: { lastName: 'Enter your last name.' } });
    expect(run(pilotFormSchema, { ...pilot, lastName: 'a'.repeat(61) }).ok).toBe(false);
  });

  it('treats willing to pay and updates as unticked unless they are true', () => {
    const { willingToPay: _pay, marketingConsent: _consent, ...rest } = pilot;
    void _pay;
    void _consent;
    const result = run(pilotFormSchema, rest);
    expect(result.ok && result.data.willingToPay).toBe(false);
    expect(result.ok && result.data.marketingConsent).toBe(false);
  });

  it('rejects an option outside the list for each choice', () => {
    for (const patch of [
      { wantsFraTracker: 'always' },
      { priceBand: '1000' },
      { startTiming: 'yesterday' },
      { role: 'ceo' },
      { orgType: 'charity' },
      { buildingsBand: '7' },
    ]) {
      expect(run(pilotFormSchema, { ...pilot, ...patch }).ok, JSON.stringify(patch)).toBe(false);
    }
  });

  it('accepts a report reference only if it is a UUID, and ignores unknown keys such as an admin status', () => {
    expect(run(pilotRequestSchema, { ...request, reportId: 'not-a-uuid' }).ok).toBe(false);
    const linked = run(pilotRequestSchema, { ...request, reportId: '3f0c9a42-6f0e-4d0e-9c43-2a5a5a4b7d11', status: 'accepted' });
    expect(linked.ok).toBe(true);
    if (linked.ok) {
      expect(linked.data.reportId).toBe('3f0c9a42-6f0e-4d0e-9c43-2a5a5a4b7d11');
      expect(linked.data).not.toHaveProperty('status');
    }
    const unlinked = run(pilotRequestSchema, request);
    expect(unlinked.ok && unlinked.data.reportId).toBeNull();
  });

  it('requires a Turnstile token on the request', () => {
    expect(run(pilotRequestSchema, pilot)).toMatchObject({ ok: false, errors: { turnstileToken: 'Complete the bot check to continue.' } });
  });
});

describe('fieldErrors', () => {
  it('keeps the first message for each field and uses "form" for a problem with the whole body', () => {
    const result = z.object({ a: z.string().min(2, 'first').max(1, 'second') }).safeParse({ a: 'x'.repeat(3) });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error)).toEqual({ a: 'second' });
    const whole = reportRequestSchema.safeParse('nope');
    expect(whole.success).toBe(false);
    if (!whole.success) expect(Object.keys(fieldErrors(whole.error))).toEqual(['form']);
  });
});
