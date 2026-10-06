/**
 * Error logging without personal data (PRD section 13: "Log errors to Sentry without personal data").
 * Email addresses are removed from messages. Sentry is attached in the hardening phase through `setErrorReporter`.
 */

type Reporter = (context: string, error: unknown) => void;

let reporter: Reporter | undefined;

export function setErrorReporter(next: Reporter | undefined): void {
  reporter = next;
}

const EMAIL_PATTERN = /[^\s<>"'()@]+@[^\s<>"'()@]+\.[^\s<>"'()@.,;:!?]+/g;

/** The error's name and message, with anything that looks like an email address removed. */
export function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return message.replace(EMAIL_PATTERN, '[email]').slice(0, 500);
}

export function logError(context: string, error: unknown): void {
  console.error(`[${context}] ${safeErrorMessage(error)}`);
  try {
    reporter?.(context, error);
  } catch {
    // Reporting must never break a request.
  }
}
