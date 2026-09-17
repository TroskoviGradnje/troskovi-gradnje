-- Base schema for a fresh project. Ids are supplied by the client (genId()
-- for firme/settings/upiti; the Supabase Auth user id for korisnici), so no
-- generated defaults are needed.

create table firme (
  id text primary key,
  naziv text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- korisnici.id = auth.users.id (see 20260917000001_auth_rls.sql). No FK to
-- auth.users is declared here since that schema is managed by Supabase.
create table korisnici (
  id text primary key,
  email text not null unique,
  uloga text not null check (uloga in ('admin','superadmin')),
  firma_id text references firme(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- kategorije / faze_kat / faze_list / profil, one row per (key, firma_id).
-- firma_id is null for any future non-firma-scoped default; the app always
-- passes a firma_id today. Writes go through a delete-then-insert pattern in
-- the app itself, so this unique index just guards against duplicates.
create table settings (
  id bigint generated always as identity primary key,
  key text not null,
  data jsonb not null,
  firma_id text references firme(id) on delete cascade,
  updated_at timestamptz not null default now()
);
create unique index settings_key_firma_unique on settings (key, coalesce(firma_id,''));

create table upiti (
  id text primary key,
  data jsonb not null,
  firma_id text references firme(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index upiti_firma_id_idx on upiti (firma_id);
