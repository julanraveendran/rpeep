import { createMailer, createResendTransport } from '@/lib/email/send';
import { createDb } from '@/lib/db';
import { serverEnv } from '@/lib/env';
import { saltedHash } from '@/lib/ip';
import { logError } from '@/lib/log';
import { renderReportPdf } from '@/lib/pdf/render';
import { createUpstashLimiter } from '@/lib/ratelimit';
import { createServiceClient } from '@/lib/supabase';
import { verifyTurnstile } from '@/lib/turnstile';
import type { ApiDeps } from '@/lib/api/types';

let cached: ApiDeps | undefined;

/** The real services, built once from the validated environment. Server only. */
export function getApiDeps(): ApiDeps {
  if (cached) return cached;
  const env = serverEnv();
  cached = {
    db: createDb(createServiceClient({ url: env.SUPABASE_URL, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY })),
    limiter: createUpstashLimiter({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN }),
    mailer: createMailer({
      transport: createResendTransport(env.RESEND_API_KEY),
      from: env.EMAIL_FROM,
      replyTo: env.EMAIL_REPLY_TO,
      founderEmail: env.FOUNDER_EMAIL,
      unsubscribeSecret: env.UNSUBSCRIBE_SECRET,
    }),
    verifyTurnstile: (token, ip) => verifyTurnstile(token, { secret: env.TURNSTILE_SECRET_KEY, ip }),
    renderPdf: renderReportPdf,
    hash: (value) => saltedHash(value, env.IP_HASH_SALT),
    now: () => new Date(),
    unsubscribeSecret: env.UNSUBSCRIBE_SECRET,
    logError,
  };
  return cached;
}
