// Admin CSV export for selected tables.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/ai-gateway.ts";

const ALLOWED: Record<string, string[]> = {
  leads: ["id", "full_name", "phone", "email", "location", "products", "budget", "status", "created_at"],
  orders: ["id", "order_number", "full_name", "phone", "email", "total", "status", "payment_status", "created_at"],
  profiles: ["id", "email", "full_name", "phone", "created_at"],
  newsletter_subscribers: ["id", "email", "status", "created_at"],
  affiliates: ["id", "code", "full_name", "email", "phone", "commission_rate", "created_at"],
  finance_applications: ["id", "full_name", "email", "phone", "item_name", "total_amount_ngn", "months", "status", "created_at"],
};

function csv(rows: any[], cols: string[]) {
  const esc = (v: any) => { const s = v == null ? "" : Array.isArray(v) ? v.join("; ") : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const table = url.searchParams.get("table") || "";
    const cols = ALLOWED[table];
    if (!cols) return new Response("Invalid table", { status: 400, headers: corsHeaders });

    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!(roles || []).some((r: any) => r.role === "admin" || r.role === "staff")) return new Response("Forbidden", { status: 403, headers: corsHeaders });

    const { data } = await admin.from(table).select(cols.join(",")).order("created_at", { ascending: false }).limit(10000);
    const body = csv(data || [], cols);
    return new Response(body, { headers: { ...corsHeaders, "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${table}-${Date.now()}.csv"` } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
