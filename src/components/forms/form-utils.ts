import type { FieldErrors, FieldValues } from 'react-hook-form';
import type { ErrorSummaryItem } from '@/components/ui/error-summary';
import { contact } from '@/content/site';

/** The id used for a field, so an error summary can link to it. `contact.email` becomes `field-contact-email`. */
export const fieldId = (name: string) => `field-${name.replace(/\./g, '-')}`;

/** Every error in a React Hook Form error object as `{ id, message }`, in field order, for the error summary. */
export function summariseErrors<T extends FieldValues>(errors: FieldErrors<T>, prefix = ''): ErrorSummaryItem[] {
  const items: ErrorSummaryItem[] = [];
  for (const [key, value] of Object.entries(errors)) {
    if (!value || typeof value !== 'object') continue;
    const name = prefix ? `${prefix}.${key}` : key;
    const message = (value as { message?: unknown }).message;
    if (typeof message === 'string') items.push({ id: fieldId(name), message });
    else items.push(...summariseErrors(value as FieldErrors<T>, name));
  }
  return items;
}

/** Messages shown for the failures the API can return (PRD sections 9A and 12). */
export const apiMessages = {
  network: `Something went wrong and your report wasn't sent. Please try again. If it keeps happening, email ${contact.email}.`,
  pilotNetwork: `Something went wrong and your application wasn't sent. Please try again. If it keeps happening, email ${contact.email}.`,
  botCheck: "We couldn't verify you're human. Please refresh and try again.",
  rateLimited: 'Too many requests. Please wait 10 minutes and try again.',
  tooLarge: 'That request was too large. Please shorten your answers and try again.',
} as const;

export type ApiFailure =
  | { kind: 'validation'; fields: Record<string, string> }
  | { kind: 'bot_check' }
  | { kind: 'rate_limited' }
  | { kind: 'too_large' }
  | { kind: 'server' };

export type ApiOutcome<T> = { ok: true; data: T } | { ok: false; failure: ApiFailure };

/** POSTs JSON and sorts the response into the outcomes the forms handle. A network error is a "server" failure. */
export async function postJson<T>(url: string, body: unknown): Promise<ApiOutcome<T>> {
  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    return { ok: false, failure: { kind: 'server' } };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { ok: false, failure: { kind: 'server' } };
  }

  if (response.ok && (data as { ok?: unknown }).ok === true) return { ok: true, data: data as T };
  switch (response.status) {
    case 400: {
      const fields = (data as { fields?: Record<string, string> }).fields;
      return { ok: false, failure: { kind: 'validation', fields: fields && typeof fields === 'object' ? fields : {} } };
    }
    case 403:
      return { ok: false, failure: { kind: 'bot_check' } };
    case 413:
      return { ok: false, failure: { kind: 'too_large' } };
    case 429:
      return { ok: false, failure: { kind: 'rate_limited' } };
    default:
      return { ok: false, failure: { kind: 'server' } };
  }
}

/** The message for a failure that is not a field error. */
export function failureMessage(failure: ApiFailure, serverMessage: string): string {
  switch (failure.kind) {
    case 'bot_check':
      return apiMessages.botCheck;
    case 'rate_limited':
      return apiMessages.rateLimited;
    case 'too_large':
      return apiMessages.tooLarge;
    default:
      return serverMessage;
  }
}
