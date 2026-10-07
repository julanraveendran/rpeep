-- The API routes write with the service role key (PRD section 4, rule 6). Row Level Security stays ON with no
-- public policies, so the service role bypasses it, but a bypass is not a grant: some Supabase projects no longer
-- give new tables to service_role by default, and then every insert fails with "permission denied" (42501).
-- Grant it explicitly, and take the tables away from the public roles as well. Safe to run more than once.
grant select, insert, update, delete on table public.reports to service_role;
grant select, insert, update, delete on table public.pilot_applications to service_role;
grant select, insert, update, delete on table public.email_suppressions to service_role;

revoke all on table public.reports from anon, authenticated;
revoke all on table public.pilot_applications from anon, authenticated;
revoke all on table public.email_suppressions from anon, authenticated;
