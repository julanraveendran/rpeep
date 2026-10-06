import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dir = new URL('./migrations/', import.meta.url);
const sql = (name: string) => readFileSync(new URL(name, dir), 'utf8');
const prd = readFileSync(new URL('../docs/PRD.md', import.meta.url), 'utf8');

describe('supabase migrations (PRD section 11)', () => {
  it('0001_init.sql is identical to the SQL block in the PRD', () => {
    const block = /```sql\n([\s\S]*?)```/.exec(prd)?.[1];
    expect(block).toBeDefined();
    expect(sql('0001_init.sql')).toBe(block);
  });

  it('creates the three tables with Row Level Security on and no policies', () => {
    const all = readdirSync(dir)
      .filter((name) => name.endsWith('.sql'))
      .map(sql)
      .join('\n');
    for (const table of ['reports', 'pilot_applications', 'email_suppressions']) {
      expect(all).toContain(`create table public.${table}`);
      expect(all).toContain(`alter table public.${table}`);
      expect(all).toMatch(new RegExp(`alter table public\\.${table}\\s+enable row level security`));
    }
    expect(all.toLowerCase()).not.toContain('create policy');
    expect(all.toLowerCase()).not.toMatch(/grant\s+.*\s+to\s+(anon|authenticated)/);
  });

  it('stores a hash of the IP, never the raw address', () => {
    const init = sql('0001_init.sql');
    expect(init).toContain('ip_hash');
    expect(init).not.toMatch(/\bip_address\b|\bip\s+(text|inet)/);
  });

  it('schedules the 24-month retention deletes monthly for reports and pilot applications, and never for suppressions', () => {
    const retention = sql('0002_retention.sql');
    expect(retention).toContain("delete from public.reports where created_at < now() - interval '24 months'");
    expect(retention).toContain("delete from public.pilot_applications where created_at < now() - interval '24 months'");
    expect(retention).not.toContain('email_suppressions');
    expect(retention.match(/cron\.schedule/g)).toHaveLength(2);
    expect(retention.match(/'\d+ \d+ 1 \* \*'/g)).toHaveLength(2); // day 1 of every month
  });

  it('adds the pilot role_other column in its own migration', () => {
    expect(sql('0003_pilot_role_other.sql')).toContain('add column role_other text check (char_length(role_other) <= 60)');
  });
});
