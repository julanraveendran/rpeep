-- Retention: delete reports and pilot applications older than 24 months (PRD section 11, "Data rules").
-- Runs monthly on the 1st at 03:00 UTC. Suppressions are kept indefinitely so unsubscribes are honoured.
--
-- pg_cron must be enabled for the project before this runs (Supabase dashboard: Integrations > Cron, then enable pg_cron).
create extension if not exists pg_cron;

select cron.schedule(
  'delete-old-reports',
  '0 3 1 * *',
  $$delete from public.reports where created_at < now() - interval '24 months';$$
);

select cron.schedule(
  'delete-old-pilot-applications',
  '5 3 1 * *',
  $$delete from public.pilot_applications where created_at < now() - interval '24 months';$$
);
