'use client';

import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';
import { CheckboxField, ChoiceGroup, SelectField, TextField, TextareaField } from '@/components/forms/fields';
import { apiMessages, failureMessage, fieldId, postJson, summariseErrors } from '@/components/forms/form-utils';
import { Turnstile, type TurnstileHandle } from '@/components/forms/Turnstile';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/error-summary';
import {
  buildingsBandLabels,
  currentMethodLabels,
  featureLabels,
  fraTrackerLabels,
  marketingConsentLabel,
  orgTypeLabels,
  priceBandLabels,
  roleLabels,
  startTimingLabels,
  toOptions,
  willingToPayLabel,
} from '@/content/forms';
import { HARDEST_PART_MAX, MAX_FEATURES, pilotPage, pilotQuestions } from '@/content/pilot';
import { track } from '@/lib/analytics';
import { useCheckerState } from '@/lib/checker/store';
import { pilotFormSchema } from '@/lib/schemas';
import { readUtm } from '@/lib/utm';

type PilotInput = z.input<typeof pilotFormSchema>;
type PilotOutput = z.output<typeof pilotFormSchema>;

const roleOptions = toOptions(roleLabels);
const orgTypeOptions = toOptions(orgTypeLabels);
const bandOptions = toOptions(buildingsBandLabels);
const methodOptions = toOptions(currentMethodLabels);
const featureOptions = toOptions(featureLabels);
const fraOptions = toOptions(fraTrackerLabels);
const priceOptions = toOptions(priceBandLabels);
const timingOptions = toOptions(startTimingLabels);

const blank = '' as never;

/** The pilot application, which doubles as the no-calls survey (PRD section 10). */
export function PilotForm() {
  const router = useRouter();
  const [state, update] = useCheckerState();
  const turnstile = useRef<TurnstileHandle>(null);
  const started = useRef(false);
  const prefilled = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [failedSubmits, setFailedSubmits] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<PilotInput, unknown, PilotOutput>({
    resolver: zodResolver(pilotFormSchema),
    // The error summary takes focus on a failed submit, not the first invalid field.
    shouldFocusError: false,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      organisation: '',
      role: blank,
      roleOther: '',
      orgType: blank,
      buildingsBand: blank,
      currentMethods: [],
      currentSoftware: '',
      hardestPart: '',
      topFeatures: [],
      wantsFraTracker: blank,
      priceBand: blank,
      willingToPay: false,
      startTiming: blank,
      marketingConsent: false,
    },
  });
  const { register, handleSubmit, control, reset, setError, formState } = form;
  const errors = formState.errors;

  // Pre-fill from a finished checker (name, email, organisation, role, organisation type and buildings band).
  const contact = state.contact;
  useEffect(() => {
    if (prefilled.current || !contact || formState.isDirty) return;
    prefilled.current = true;
    reset({
      ...form.getValues(),
      firstName: contact.firstName,
      email: contact.email,
      organisation: contact.organisation,
      role: contact.role,
      roleOther: contact.roleOther ?? '',
      orgType: contact.orgType,
      buildingsBand: contact.buildingsBand,
    });
  }, [contact, formState.isDirty, form, reset]);

  const role = useWatch({ control, name: 'role' });
  const methods = useWatch({ control, name: 'currentMethods' }) ?? [];
  const features = useWatch({ control, name: 'topFeatures' }) ?? [];
  const hardestPart = useWatch({ control, name: 'hardestPart' }) ?? '';
  const atFeatureLimit = features.length >= MAX_FEATURES;

  async function onValid(values: PilotOutput) {
    setFormError(null);
    setSubmitting(true);
    try {
      const token = await turnstile.current?.getToken();
      if (!token) {
        setFormError(apiMessages.botCheck);
        return;
      }
      const outcome = await postJson<{ ok: true }>('/api/pilot', {
        ...values,
        reportId: state.reportId,
        utm: readUtm(),
        turnstileToken: token,
      });

      if (!outcome.ok) {
        turnstile.current?.reset();
        const { failure } = outcome;
        if (failure.kind === 'validation') {
          let placed = false;
          for (const [path, message] of Object.entries(failure.fields)) {
            if (path in values) {
              setError(path as keyof PilotInput, { type: 'server', message });
              placed = true;
            }
          }
          if (placed) setFailedSubmits((count) => count + 1);
          else setFormError(apiMessages.pilotNetwork);
        } else {
          setFormError(failureMessage(failure, apiMessages.pilotNetwork));
        }
        return;
      }

      track('pilot_submitted', {
        orgType: values.orgType,
        buildingsBand: values.buildingsBand,
        priceBand: values.priceBand,
        willingToPay: values.willingToPay,
      });
      update((current) => ({ ...current, pilotFirstName: values.firstName }));
      router.push('/pilot/thanks');
    } finally {
      setSubmitting(false);
    }
  }

  const summary = summariseErrors(errors);

  return (
    <form
      noValidate
      className="grid gap-6"
      aria-label={pilotPage.title}
      // Fires once, when the first field receives focus.
      onFocusCapture={(event) => {
        if (started.current) return;
        if (event.target instanceof HTMLElement && event.target.matches('input, select, textarea')) {
          started.current = true;
          track('pilot_started');
        }
      }}
      onSubmit={handleSubmit(onValid, () => {
        setFormError(null);
        setFailedSubmits((count) => count + 1);
      })}
    >
      {failedSubmits > 0 && summary.length > 0 ? <ErrorSummary key={failedSubmits} errors={summary} /> : null}
      {formError ? (
        <Alert variant="error">
          <p>{formError}</p>
        </Alert>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField id={fieldId('firstName')} label="First name" autoComplete="given-name" required error={errors.firstName?.message} {...register('firstName')} />
        <TextField id={fieldId('lastName')} label="Last name" autoComplete="family-name" required error={errors.lastName?.message} {...register('lastName')} />
      </div>
      <TextField id={fieldId('email')} label="Work email" type="email" autoComplete="email" required error={errors.email?.message} {...register('email')} />
      <TextField id={fieldId('organisation')} label="Organisation" autoComplete="organization" required error={errors.organisation?.message} {...register('organisation')} />
      <SelectField id={fieldId('role')} label="Role" options={roleOptions} required error={errors.role?.message} {...register('role')} />
      {role === 'other' ? (
        <TextField id={fieldId('roleOther')} label="Describe your role" maxLength={60} error={errors.roleOther?.message} {...register('roleOther')} />
      ) : null}
      <SelectField id={fieldId('orgType')} label="Organisation type" options={orgTypeOptions} required error={errors.orgType?.message} {...register('orgType')} />
      <SelectField
        id={fieldId('buildingsBand')}
        label="Buildings that may be in scope"
        options={bandOptions}
        required
        error={errors.buildingsBand?.message}
        {...register('buildingsBand')}
      />

      <ChoiceGroup
        id={fieldId('currentMethods')}
        legend={pilotQuestions.currentMethods}
        hint="Choose at least one."
        type="checkbox"
        options={methodOptions}
        register={() => register('currentMethods')}
        error={errors.currentMethods?.message}
        after={{
          compliance_software: methods.includes('compliance_software') ? (
            <div className="mb-2 ml-8 max-w-sm">
              <TextField id={fieldId('currentSoftware')} label={pilotQuestions.currentSoftware} maxLength={80} error={errors.currentSoftware?.message} {...register('currentSoftware')} />
            </div>
          ) : null,
        }}
      />

      <TextareaField
        {...register('hardestPart')}
        id={fieldId('hardestPart')}
        label={pilotQuestions.hardestPart}
        hint="Between 10 and 800 characters."
        required
        count={hardestPart.length}
        max={HARDEST_PART_MAX}
        error={errors.hardestPart?.message}
      />

      <ChoiceGroup
        id={fieldId('topFeatures')}
        legend={pilotQuestions.topFeatures}
        hint={pilotQuestions.topFeaturesHint}
        type="checkbox"
        options={featureOptions}
        register={() => register('topFeatures')}
        disabledValues={atFeatureLimit ? featureOptions.map((option) => option.value).filter((value) => !features.includes(value as never)) : []}
        error={errors.topFeatures?.message}
      />

      <ChoiceGroup
        id={fieldId('wantsFraTracker')}
        legend={pilotQuestions.wantsFraTracker}
        type="radio"
        options={fraOptions}
        register={() => register('wantsFraTracker')}
        error={errors.wantsFraTracker?.message}
      />
      <ChoiceGroup
        id={fieldId('priceBand')}
        legend={pilotQuestions.priceBand}
        type="radio"
        options={priceOptions}
        register={() => register('priceBand')}
        error={errors.priceBand?.message}
      />
      <CheckboxField id={fieldId('willingToPay')} label={willingToPayLabel} {...register('willingToPay')} />
      <ChoiceGroup
        id={fieldId('startTiming')}
        legend={pilotQuestions.startTiming}
        type="radio"
        options={timingOptions}
        register={() => register('startTiming')}
        error={errors.startTiming?.message}
      />
      <CheckboxField id={fieldId('marketingConsent')} label={marketingConsentLabel} {...register('marketingConsent')} />

      <Turnstile ref={turnstile} />

      <div>
        <Button type="submit" loading={submitting}>
          {pilotPage.submit}
        </Button>
        <p className="mt-3 text-sm text-muted">
          We use your details to review your application and, if you tick the box, to send occasional updates. See our <a href="/privacy">privacy notice</a>.
        </p>
      </div>
    </form>
  );
}
