// Called by a Postgres AFTER INSERT trigger on upiti (see the accompanying
// migration) whenever a public visitor submits an inquiry. Looks up the
// firma's admin emails and sends them a notification via Resend, so a new
// lead doesn't just sit in the dashboard unnoticed.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("UPITI_WEBHOOK_SECRET")!;
const FROM_EMAIL = Deno.env.get("NOTIFY_FROM_EMAIL") || "onboarding@resend.dev";

const fmtKM = (n: number) =>
  n.toLocaleString("bs-BA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " KM";

Deno.serve(async (req) => {
  // Shared secret set on the database side (app.settings.upiti_webhook_secret)
  // and here as an edge function secret — proves the call actually came from
  // our own trigger, not an arbitrary request to this public URL.
  if (req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const record = payload?.record;
  if (!record) return new Response(JSON.stringify({ error: "No record" }), { status: 400 });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const upit = record.data ?? {};
  const firmaId = record.firma_id as string | null;

  const [{ data: firma }, { data: korisnici }] = await Promise.all([
    firmaId
      ? admin.from("firme").select("naziv,slug").eq("id", firmaId).single()
      : Promise.resolve({ data: null }),
    firmaId
      ? admin.from("korisnici").select("email").eq("firma_id", firmaId)
      : Promise.resolve({ data: [] as { email: string }[] }),
  ]);

  const recipients = (korisnici ?? []).map((k) => k.email).filter(Boolean);
  if (recipients.length === 0) {
    return new Response(JSON.stringify({ skipped: "no recipients for this firma" }), { status: 200 });
  }

  const stavke: { naziv: string; kolicina: number; jm: string; cijena: number }[] = upit.stavke || [];
  const ukupno = stavke.reduce((s, x) => s + (x.kolicina || 0) * (x.cijena || 0), 0);

  const stavkeHtml = stavke.length
    ? `<table style="width:100%;border-collapse:collapse;margin-top:12px">
        <tr style="text-align:left;font-size:12px;color:#888">
          <th style="padding:4px 0">Stavka</th><th>Kol.</th><th>Iznos</th>
        </tr>
        ${stavke
          .map(
            (s) =>
              `<tr style="border-top:1px solid #eee"><td style="padding:4px 0">${s.naziv}</td>` +
              `<td>${s.kolicina} ${s.jm}</td><td>${fmtKM(s.kolicina * s.cijena)}</td></tr>`
          )
          .join("")}
      </table>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;color:#1c1a16">
      <h2 style="margin:0 0 4px">Novi upit${firma?.naziv ? ` — ${firma.naziv}` : ""}</h2>
      <p style="color:#888;font-size:12px;margin:0 0 16px">${record.created_at}</p>
      <p style="margin:0 0 4px"><b>Ime:</b> ${upit.ime || "—"}</p>
      <p style="margin:0 0 4px"><b>Telefon:</b> ${upit.telefon || "—"}</p>
      <p style="margin:0 0 4px"><b>Email:</b> ${upit.email || "—"}</p>
      ${upit.napomena ? `<p style="margin:12px 0 0"><b>Napomena:</b> ${upit.napomena}</p>` : ""}
      ${stavkeHtml}
      ${ukupno > 0 ? `<p style="margin-top:12px"><b>Okvirna vrijednost:</b> ${fmtKM(ukupno)}</p>` : ""}
      ${firma?.slug ? `<p style="margin-top:20px"><a href="https://${Deno.env.get("APP_HOST") || "predmjer-pro.vercel.app"}/${firma.slug}">Otvori admin panel →</a></p>` : ""}
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: recipients,
      subject: `Novi upit${upit.ime ? ` od ${upit.ime}` : ""}`,
      html,
    }),
  });

  const result = await res.json().catch(() => ({}));
  return new Response(JSON.stringify(result), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
});
