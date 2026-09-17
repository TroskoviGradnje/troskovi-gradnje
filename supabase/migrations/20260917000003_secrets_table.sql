-- ALTER DATABASE ... SET for a custom GUC needs superuser, which Supabase's
-- managed Postgres doesn't grant even to the project owner (confirmed: the
-- previous migration's approach fails with "permission denied to set
-- parameter"). Use a schema-isolated table instead: `private` is not in
-- PostgREST's exposed-schema list, so it's unreachable from the REST API
-- regardless of RLS, and the explicit revokes below are defense in depth.
-- The actual secret VALUE is inserted separately, outside of source control.

create schema if not exists private;

create table if not exists private.app_secrets (
  key text primary key,
  value text not null
);
revoke all on private.app_secrets from public, anon, authenticated;

-- security definer: runs as the function owner (not the anon role that
-- fires this trigger via a public upiti insert), so it can read the secret
-- table even though anon/authenticated have no grants on it.
create or replace function public.notify_new_upit() returns trigger
language plpgsql security definer as $$
declare
  webhook_secret text;
begin
  select value into webhook_secret from private.app_secrets where key = 'upiti_webhook_secret';
  if webhook_secret is null then
    return new; -- not configured yet — don't block the insert
  end if;

  perform net.http_post(
    url := 'https://gmzzicwntezdmzriwswh.supabase.co/functions/v1/notify-upit',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    ),
    body := jsonb_build_object('type', 'INSERT', 'table', 'upiti', 'record', to_jsonb(new))
  );
  return new;
end;
$$;
