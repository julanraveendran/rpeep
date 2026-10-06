-- The pilot form's role list has an "Other" choice that reveals a text field (PRD section 10, P5),
-- but pilot_applications in 0001 has no column for that text (reports has role_other).
-- Added as a separate migration so 0001 stays identical to PRD section 11.
alter table public.pilot_applications
  add column role_other text check (char_length(role_other) <= 60);
