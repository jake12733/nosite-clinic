// NO-SITE CLINIC inbox: public inquiry submit + admin list/read
// Deployed as Supabase Edge Function "nosite-inbox" (verify_jwt = false)
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SR_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN = Deno.env.get("NOSITE_ADMIN_KEY") || "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-admin-key, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const db = (path: string, init: RequestInit = {}) => fetch(`${SB_URL}/rest/v1/${path}`, {
  ...init,
  headers: { apikey: SR_KEY, Authorization: `Bearer ${SR_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
});
const cut = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const a = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  a.push(now); hits.set(ip, a);
  return a.length > 8;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  const action = String(b.action || "submit");

  if (action === "submit") {
    if (b.website) return json({ ok: true }); // honeypot
    const message = cut(b.message, 2000);
    if (message.length < 2) return json({ error: "내용을 입력해 주세요" }, 400);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "?";
    if (limited(ip)) return json({ error: "잠시 후 다시 시도해 주세요" }, 429);
    const row = {
      hkey: cut(b.hkey, 200), hname: cut(b.hname, 100), source: cut(b.source, 60) || "문의 페이지",
      sender: cut(b.sender, 60), contact: cut(b.contact, 120), message, page: cut(b.page, 300),
    };
    const r = await db("nosite_inquiries", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(row) });
    if (!r.ok) return json({ error: "저장 실패", detail: await r.text() }, 500);
    return json({ ok: true });
  }

  if (!ADMIN || req.headers.get("x-admin-key") !== ADMIN) return json({ error: "unauthorized" }, 401);

  if (action === "list") {
    const since = Number(b.since || 0) | 0;
    const q = since > 0
      ? `nosite_inquiries?select=*&id=gt.${since}&order=id.asc&limit=100`
      : `nosite_inquiries?select=*&order=id.desc&limit=200`;
    const r = await db(q);
    const rows = await r.json();
    return json({ ok: true, rows: Array.isArray(rows) ? rows : [] });
  }
  if (action === "read") {
    const ids = (Array.isArray(b.ids) ? b.ids : []).map((x) => Number(x) | 0).filter(Boolean).slice(0, 500);
    if (!ids.length) return json({ ok: true });
    await db(`nosite_inquiries?id=in.(${ids.join(",")})`, { method: "PATCH", body: JSON.stringify({ is_read: true }) });
    return json({ ok: true });
  }
  if (action === "delete") {
    const id = Number(b.id) | 0;
    if (id) await db(`nosite_inquiries?id=eq.${id}`, { method: "DELETE" });
    return json({ ok: true });
  }
  return json({ error: "unknown action" }, 400);
});
