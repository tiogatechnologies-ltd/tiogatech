// Admin-only: manually fire a scheduled automation from the Automations dashboard.
//
// The target functions (check-overdue-and-deadlines, finance-reminders,
// auto-charge-due, reset-monthly-free-credits, process-email-queue) all
// require a service-role JWT or the cron shared secret, because they act
// across every customer's data and previously had no auth at all. The
// browser only ever holds the logged-in admin's own session JWT, so calling
// them directly from the client (as the "Run Now" button used to) always
// returned 401. This function checks the caller is an admin/staff user,
// then re-invokes the target function server-side with the service key.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_FUNCTIONS = new Set([
  "check-overdue-and-deadlines",
  "finance-reminders",
  "auto-charge-due",
  "reset-monthly-free-credits",
  "process-email-queue",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);
    const anon = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: ud } = await anon.auth.getUser();
    if (!ud?.user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", ud.user.id);
    if (!(roles || []).some((r: any) => r.role === "admin" || r.role === "staff")) return json({ error: "forbidden" }, 403);

    const { function: fnName } = await req.json().catch(() => ({}));
    if (!fnName || !ALLOWED_FUNCTIONS.has(fnName)) return json({ error: "unknown or disallowed function" }, 400);

    const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: "{}",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return json({ error: data?.error || `${fnName} returned ${res.status}` }, res.status);
    return json({ ok: true, result: data });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
