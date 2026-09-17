-- Lock down access with RLS. korisnici.id is the matching auth.users.id (see
-- init_schema.sql) — accounts are created via Supabase Dashboard >
-- Authentication > Add user (or the admin-users edge function), then linked
-- with a korisnici row.

-- ── Helper functions (SECURITY DEFINER so policies on korisnici can query
--    korisnici itself without recursing through RLS) ─────────────────────────

-- korisnici.id is text (it held genId() strings pre-migration), auth.uid()
-- returns uuid — no implicit cast between them, so cast explicitly.
create or replace function public.current_uloga() returns text
language sql security definer stable as $$
  select uloga from public.korisnici where id = auth.uid()::text
$$;

create or replace function public.current_firma_id() returns text
language sql security definer stable as $$
  select firma_id from public.korisnici where id = auth.uid()::text
$$;

create or replace function public.is_superadmin() returns boolean
language sql security definer stable as $$
  select exists(select 1 from public.korisnici where id = auth.uid()::text and uloga = 'superadmin')
$$;

-- ── firme ────────────────────────────────────────────────────────────────────
alter table firme enable row level security;

drop policy if exists "firme public read" on firme;
create policy "firme public read" on firme
  for select using (true);

drop policy if exists "firme superadmin write" on firme;
create policy "firme superadmin write" on firme
  for all using (is_superadmin()) with check (is_superadmin());

-- ── settings (kategorije / faze_kat / faze_list / profil, per firma) ─────────
alter table settings enable row level security;

drop policy if exists "settings public read" on settings;
create policy "settings public read" on settings
  for select using (true);

drop policy if exists "settings admin write" on settings;
create policy "settings admin write" on settings
  for all
  using (is_superadmin() or firma_id = current_firma_id())
  with check (is_superadmin() or firma_id = current_firma_id());

-- ── upiti (inquiries — contains customer PII, must not be publicly readable) ─
alter table upiti enable row level security;

drop policy if exists "upiti public insert" on upiti;
create policy "upiti public insert" on upiti
  for insert with check (true);

drop policy if exists "upiti admin read" on upiti;
create policy "upiti admin read" on upiti
  for select using (is_superadmin() or firma_id = current_firma_id());

drop policy if exists "upiti admin write" on upiti;
create policy "upiti admin write" on upiti
  for update using (is_superadmin() or firma_id = current_firma_id())
  with check (is_superadmin() or firma_id = current_firma_id());

drop policy if exists "upiti admin delete" on upiti;
create policy "upiti admin delete" on upiti
  for delete using (is_superadmin() or firma_id = current_firma_id());

-- ── korisnici (profile/role rows — writes only via the admin-users edge
--    function using the service role key, which bypasses RLS entirely) ───────
alter table korisnici enable row level security;

drop policy if exists "korisnici self or superadmin read" on korisnici;
create policy "korisnici self or superadmin read" on korisnici
  for select using (auth.uid()::text = id or is_superadmin());

-- No insert/update/delete policies for korisnici: default-deny from the
-- client. All writes happen through supabase/functions/admin-users using the
-- service role key.
