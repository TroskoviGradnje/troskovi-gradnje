// Handles the three korisnici operations that need the service role key
// (creating/deleting an auth.users entry, or resetting someone else's
// password) — none of which are safe to do from the browser.
//
// Every request is re-checked server-side against the caller's own JWT before
// doing anything: the client-side UI restricting this to the superadmin panel
// is not the enforcement point, this is.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Edge Functions don't get CORS headers for free — without these, every call
// from the browser (the admin panel) is blocked at the preflight OPTIONS
// request before it ever reaches this handler.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, PATCH, DELETE, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Missing Authorization header" }, 401);

  // Client bound to the caller's own JWT — used only to verify who they are.
  const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userErr } = await callerClient.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "Invalid session" }, 401);

  // Service-role client — does the actual privileged work, only after the
  // superadmin check below passes.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: caller } = await admin
    .from("korisnici")
    .select("uloga")
    .eq("id", userData.user.id)
    .single();
  if (caller?.uloga !== "superadmin") {
    return json({ error: "Superadmin only" }, 403);
  }

  const url = new URL(req.url);
  const id = url.pathname.split("/").filter(Boolean).pop();

  try {
    if (req.method === "POST") {
      const { firmaId, email, password } = await req.json();
      if (!firmaId || !email || !password) {
        return json({ error: "firmaId, email and password are required" }, 400);
      }
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) return json({ error: createErr.message }, 400);

      const { data: profile, error: profileErr } = await admin
        .from("korisnici")
        .insert({ id: created.user.id, firma_id: firmaId, email, uloga: "admin" })
        .select()
        .single();
      if (profileErr) return json({ error: profileErr.message }, 400);

      return json({ data: profile });
    }

    if (req.method === "PATCH") {
      const { password } = await req.json();
      if (!id || id === "admin-users" || !password) {
        return json({ error: "id and password are required" }, 400);
      }
      const { error: pwErr } = await admin.auth.admin.updateUserById(id, { password });
      if (pwErr) return json({ error: pwErr.message }, 400);
      return json({ ok: true });
    }

    if (req.method === "DELETE") {
      if (!id || id === "admin-users") return json({ error: "id is required" }, 400);
      await admin.from("korisnici").delete().eq("id", id);
      const { error: delErr } = await admin.auth.admin.deleteUser(id);
      if (delErr) return json({ error: delErr.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
