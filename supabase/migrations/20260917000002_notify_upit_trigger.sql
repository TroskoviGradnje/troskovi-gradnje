-- Notify a firma's admins by email whenever a new upit is inserted.
--
-- The shared secret used to authenticate the trigger's call to the edge
-- function is intentionally NOT in this file — it's set directly on the
-- database via `alter database ... set app.settings.upiti_webhook_secret`
-- (a Postgres custom GUC, persisted server-side) so it never ends up in
-- source control. See the notify-upit edge function for the other half.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_new_upit() returns trigger
language plpgsql as $$
begin
  perform net.http_post(
    url := 'https://gmzzicwntezdmzriwswh.supabase.co/functions/v1/notify-upit',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', current_setting('app.settings.upiti_webhook_secret', true)
    ),
    body := jsonb_build_object('type', 'INSERT', 'table', 'upiti', 'record', to_jsonb(new))
  );
  return new;
end;
$$;

drop trigger if exists upiti_notify_new on upiti;
create trigger upiti_notify_new
  after insert on upiti
  for each row execute function public.notify_new_upit();
