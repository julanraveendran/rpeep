'use client';

import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';
import { CheckboxField, SelectField, TextField } from '@/components/forms/fields';
import { apiMessages, failureMessage, fieldId, postJson, summariseErrors } from '@/components/forms/form-utils';
import { Turnstile, type TurnstileHandle } from '@/components/forms/Turnstile';
import { PilotCard } from '@/components/checker/PilotCard';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ErrorSummary } from '@/components/ui/error-summary';
import { buildingsBandLabels, marketingConsentLabel, orgTypeLabels, roleLabels, toOptions } from '@/content/forms';
import { reportCopy } from '@/content/questions';
import { track } from '@/lib/analytics';
import { useCheckerState } from '@/lib/checker/store';
import type { ReadinessAnswers } from '@/lib/readiness/score';
import { reportContactSchema } from '@/lib/schemas';
import type { Answers, ScopeStatus } from '@/lib/scope/engine';
import { readUtm } from '@/lib/utm';

type ContactInput = z.input<typeof reportContactSchema>;
type ContactOutput = z.output<typeof reportContactSchema>;

type ReportFormProps = {
  /** The finished checker answers. */
  answers: Partial<Answers>;
  buildingRef: string;
  /** Only when the readiness check was completed. The server ignores it unless the building is in scope. */
  readiness: ReadinessAnswers | null;
};

type ReportSuccess = { reportId: string; status: ScopeStatus; emailSent: boolean; pdfBase64: string; fileName: string };

const roleOptions = toOptions(roleLabels);
const orgTypeOptions = toOptions(orgTypeLabels);
const bandOptions = toOptions(buildingsBandLabels);

function downloadPdf(base64: string, fileName: string) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** The report form (PRD section 9A): six short fields, the bot check, then the PDF to download and by email. */
export function ReportForm({ answers, buildingRef, readiness }: ReportFormProps) {
  const [state, update] = useCheckerState();
  const turnstile = useRef<TurnstileHandle>(null);
  const [submitting, setSubmitting] = useState(false);
  const [failedSubmits, setFailedSubmits] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ report: ReportSuccess; email: string } | null>(null);

  const saved = state.contact;
  const form = useForm<ContactInput, unknown, ContactOutput>({
    resolver: zodResolver(reportContactSchema),
    // The error summary takes focus on a failed submit, not the first invalid field.
    shouldFocusError: false,
    defaultValues: {
      firstName: saved?.firstName ?? '',
      email: saved?.email ?? '',
      organisation: saved?.organisation ?? '',
      role: saved?.role ?? ('' as ContactInput['role']),
      roleOther: saved?.roleOther ?? '',
      orgType: saved?.orgType ?? ('' as ContactInput['orgType']),
      buildingsBand: saved?.buildingsBand ?? ('' as ContactInput['buildingsBand']),
      marketingConsent: false,
    },
  });
  const { register, handleSubmit, control, setError, formState } = form;
  const role = useWatch({ control, name: 'role' });
  const errors = formState.errors;

  async function onValid(contact: ContactOutput) {
    setFormError(null);
    setSubmitting(true);
    try {
      const token = await turnstile.current?.getToken();
      if (!token) {
        setFormError(apiMessages.botCheck);
        return;
      }

      const outcome = await postJson<ReportSuccess & { ok: true }>('/api/report', {
        answers,
        ...(readiness ? { readiness } : {}),
        buildingRef: buildingRef || null,
        contact,
        utm: readUtm(),
        turnstileToken: token,
      });

      if (!outcome.ok) {
        turnstile.current?.reset();
        const { failure } = outcome;
        if (failure.kind === 'validation') {
          let placed = false;
          for (const [path, message] of Object.entries(failure.fields)) {
            if (path.startsWith('contact.')) {
              setError(path.slice('contact.'.length) as keyof ContactInput, { type: 'server', message });
              placed = true;
            }
          }
          if (placed) setFailedSubmits((count) => count + 1);
          else setFormError(apiMessages.network);
        } else {
          setFormError(failureMessage(failure, apiMessages.network));
        }
        return;
      }

      const report = outcome.data;
      track('report_requested', { status: report.status });
      update((current) => ({
        ...current,
        reportId: report.reportId,
        contact: {
          firstName: contact.firstName,
          email: contact.email,
          organisation: contact.organisation,
          role: contact.role,
          roleOther: contact.roleOther,
          orgType: contact.orgType,
          buildingsBand: contact.buildingsBand,
        },
      }));
      setSuccess({ report, email: contact.email });
    } finally {
      setSubmitting(false);
    }
  }

  const summary = summariseErrors(errors);

  if (success) return <ReportSuccessView {...success} />;

  return (
    <form
      noValidate
      className="grid gap-6"
      aria-label={reportCopy.title}
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

      <TextField id={fieldId('firstName')} label="First name" autoComplete="given-name" required error={errors.firstName?.message} {...register('firstName')} />
      <TextField
        id={fieldId('email')}
        label="Work email"
        hint="Use your work email."
        type="email"
        autoComplete="email"
        required
        error={errors.email?.message}
        {...register('email')}
      />
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
      <CheckboxField id={fieldId('marketingConsent')} label={marketingConsentLabel} {...register('marketingConsent')} />

      <Turnstile ref={turnstile} />

      <div>
        <Button type="submit" loading={submitting}>
          Get my free report
        </Button>
        <p className="mt-3 text-sm text-muted">
          We use your details to send this report and, if you tick the box, occasional updates. See our <a href="/privacy">privacy notice</a>.
        </p>
      </div>
    </form>
  );
}

function ReportSuccessView({ report, email }: { report: ReportSuccess; email: string }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <div className="grid gap-6" role="status">
      <h2 ref={heading} tabIndex={-1} className="text-2xl">
        Your report is ready
      </h2>
      <div>
        <Button
          onClick={() => {
            downloadPdf(report.pdfBase64, report.fileName);
            track('report_downloaded');
          }}
        >
          Download PDF
        </Button>
      </div>
      {report.emailSent ? (
        <p>
          We&apos;ve also emailed it to <strong>{email}</strong>. It can take a few minutes — check your junk folder.
        </p>
      ) : (
        <p>We couldn&apos;t email it, but you can download it now.</p>
      )}
      <PilotCard location="report_success" />
    </div>
  );
}
