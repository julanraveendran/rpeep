import { z } from 'zod';

/**
 * Environment validation (PRD section 12). The app must fail fast with a clear
 * message if a required variable is missing, so every variable in `.env.example`
 * is declared here.
 *
 * Secrets are server-only. Nothing secret may use the `NEXT_PUBLIC_` prefix
 * (PRD section 4, rule 5), so the client-visible variables are in their own schema.
 */

const required = (name: string) => z.string({ error: `${name} is required` }).trim().min(1, `${name} is required`);

/** 32+ random bytes: 43 base64 characters or 64 hex characters at the shortest. */
const secret = (name: string) =>
  required(name).min(43, `${name} must be at least 32 random bytes (for example, run: openssl rand -hex 32)`);

const url = (name: string) => required(name).pipe(z.url({ error: `${name} must be a full URL` }));

const emailAddress = (name: string) =>
  required(name).pipe(z.email({ error: `${name} must be an email address` }));

/** `Brand Name <hello@example.com>` */
const namedAddress = (name: string) =>
  required(name).regex(/^[^<>]+ <[^<>@\s]+@[^<>@\s]+>$/, `${name} must look like: Brand <hello@example.com>`);

/** Variables that only server code may read. */
export const serverEnvSchema = z.object({
  TURNSTILE_SECRET_KEY: required('TURNSTILE_SECRET_KEY'),
  SUPABASE_URL: url('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
  RESEND_API_KEY: required('RESEND_API_KEY'),
  EMAIL_FROM: namedAddress('EMAIL_FROM'),
  EMAIL_REPLY_TO: emailAddress('EMAIL_REPLY_TO'),
  FOUNDER_EMAIL: emailAddress('FOUNDER_EMAIL'),
  UPSTASH_REDIS_REST_URL: url('UPSTASH_REDIS_REST_URL'),
  UPSTASH_REDIS_REST_TOKEN: required('UPSTASH_REDIS_REST_TOKEN'),
  UNSUBSCRIBE_SECRET: secret('UNSUBSCRIBE_SECRET'),
  IP_HASH_SALT: secret('IP_HASH_SALT'),
  /** Optional: Sentry is skipped when this is not set (local development). */
  SENTRY_DSN: z.union([z.literal(''), url('SENTRY_DSN')]).optional(),
});

/** Variables that are safe to expose to the browser. Never put a secret here. */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: url('NEXT_PUBLIC_SITE_URL'),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: required('NEXT_PUBLIC_TURNSTILE_SITE_KEY'),
  /** Optional: analytics do nothing when this is not set. */
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().trim().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

export class EnvError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(
      [
        'Invalid or missing environment variables:',
        ...issues.map((line) => `  - ${line}`),
        '',
        'Copy .env.example to .env.local and fill in every value. See docs/PRD.md section 12.',
      ].join('\n'),
    );
    this.name = 'EnvError';
    this.issues = issues;
  }
}

type Source = Record<string, string | undefined>;

function parse<T extends z.ZodType>(schema: T, source: Source): z.infer<T> {
  // Treat an empty string like an unset variable, so `FOO=` in a copied .env.example is caught.
  const cleaned = Object.fromEntries(Object.entries(source).filter(([, value]) => value !== ''));
  const result = schema.safeParse(cleaned);
  if (result.success) return result.data;

  const issues = result.error.issues.map((issue) => {
    const name = issue.path.join('.');
    return issue.message.startsWith(name) ? issue.message : `${name}: ${issue.message}`;
  });
  throw new EnvError(issues);
}

/** Validate server variables from any source. Pure, so it can be tested. */
export function parseServerEnv(source: Source): ServerEnv {
  return parse(serverEnvSchema, source);
}

/** Validate public variables from any source. Pure, so it can be tested. */
export function parsePublicEnv(source: Source): PublicEnv {
  return parse(publicEnvSchema, source);
}

let cachedServerEnv: ServerEnv | undefined;

/** Server variables from `process.env`, validated once. Call from server code only. */
export function serverEnv(): ServerEnv {
  cachedServerEnv ??= parseServerEnv(process.env);
  return cachedServerEnv;
}

/**
 * Validate everything at server start (called from `src/instrumentation.ts`).
 * Set `SKIP_ENV_VALIDATION=1` only for CI jobs and tests that do not use real services.
 */
export function assertEnv(source: Source = process.env): void {
  if (source.SKIP_ENV_VALIDATION === '1') return;
  const issues: string[] = [];
  for (const parseFn of [parseServerEnv, parsePublicEnv]) {
    try {
      parseFn(source);
    } catch (error) {
      if (error instanceof EnvError) issues.push(...error.issues);
      else throw error;
    }
  }
  if (issues.length > 0) throw new EnvError(issues);
}
