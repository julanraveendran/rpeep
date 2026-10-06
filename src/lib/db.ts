import type { SupabaseClient } from '@supabase/supabase-js';
import type { ScopeStatus } from '@/lib/scope/engine';

/** A row of `public.reports` as inserted (PRD section 11). */
export type ReportRow = {
  first_name: string;
  email: string;
  organisation: string;
  role: string;
  role_other: string | null;
  org_type: string;
  buildings_band: string;
  building_ref: string | null;
  answers: Record<string, unknown>;
  status: ScopeStatus;
  criteria_met: string[];
  missing: string[];
  engine_version: string;
  readiness_answers: Record<string, string> | null;
  readiness_score: number | null;
  marketing_consent: boolean;
  consent_text_ver: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ip_hash: string | null;
};

/** A row of `public.pilot_applications` as inserted (PRD section 11). */
export type PilotRow = {
  first_name: string;
  last_name: string;
  email: string;
  organisation: string;
  role: string;
  /** Column added in migration 0003. */
  role_other: string | null;
  org_type: string;
  buildings_band: string;
  current_methods: string[];
  current_software: string | null;
  hardest_part: string;
  top_features: string[];
  wants_fra_tracker: string;
  price_band: string;
  willing_to_pay: boolean;
  start_timing: string;
  marketing_consent: boolean;
  consent_text_ver: string;
  report_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ip_hash: string | null;
};

/** Everything the API routes need from the database. Written only from the server (PRD section 4, rule 6). */
export type Db = {
  /** Inserts a report and returns its id. */
  insertReport(row: ReportRow): Promise<string>;
  markEmailSent(reportId: string, at: Date): Promise<void>;
  markEmailError(reportId: string, message: string): Promise<void>;
  reportExists(reportId: string): Promise<boolean>;
  /** Inserts a pilot application and returns its id. */
  insertPilot(row: PilotRow): Promise<string>;
  isSuppressed(email: string): Promise<boolean>;
  /** Adds the address to `email_suppressions`. Suppressions are kept indefinitely. */
  suppress(email: string): Promise<void>;
  /** Sets `marketing_consent = false` on every matching report and pilot application. */
  withdrawMarketingConsent(email: string): Promise<void>;
};

function fail(action: string, error: { message: string } | null): never {
  throw new Error(`Database ${action} failed: ${error?.message ?? 'unknown error'}`);
}

export function createDb(client: SupabaseClient): Db {
  return {
    async insertReport(row) {
      const { data, error } = await client.from('reports').insert(row).select('id').single();
      if (error || !data) fail('insert into reports', error);
      return (data as { id: string }).id;
    },

    async markEmailSent(reportId, at) {
      const { error } = await client.from('reports').update({ email_sent_at: at.toISOString(), email_error: null }).eq('id', reportId);
      if (error) fail('update of email_sent_at', error);
    },

    async markEmailError(reportId, message) {
      const { error } = await client.from('reports').update({ email_error: message }).eq('id', reportId);
      if (error) fail('update of email_error', error);
    },

    async reportExists(reportId) {
      const { data, error } = await client.from('reports').select('id').eq('id', reportId).maybeSingle();
      if (error) fail('lookup in reports', error);
      return data !== null;
    },

    async insertPilot(row) {
      const { data, error } = await client.from('pilot_applications').insert(row).select('id').single();
      if (error || !data) fail('insert into pilot_applications', error);
      return (data as { id: string }).id;
    },

    async isSuppressed(email) {
      const { data, error } = await client.from('email_suppressions').select('email').eq('email', email).maybeSingle();
      if (error) fail('lookup in email_suppressions', error);
      return data !== null;
    },

    async suppress(email) {
      const { error } = await client.from('email_suppressions').upsert({ email, reason: 'unsubscribe' }, { onConflict: 'email' });
      if (error) fail('upsert into email_suppressions', error);
    },

    async withdrawMarketingConsent(email) {
      for (const table of ['reports', 'pilot_applications']) {
        const { error } = await client.from(table).update({ marketing_consent: false }).eq('email', email);
        if (error) fail(`update of ${table}.marketing_consent`, error);
      }
    },
  };
}
