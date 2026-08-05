// Public, server-validated retrieval of a saved LumiVolt sizing report by share token.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    let token = new URL(req.url).searchParams.get("token") || "";
    if (!token && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      token = String(body.token || "");
    }
    if (!/^[a-zA-Z0-9]{16,64}$/.test(token)) return json({ error: "Invalid token" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await admin
      .from("lumivolt_sizings")
      .select(
        "id, full_name, location, appliances, total_load_w, daily_energy_wh, days_autonomy, battery_voltage, battery_type, battery_dod, sunlight_hours, solar_panel_w, recommended_panel_w, inverter_w, battery_ah, battery_kwh, charge_controller_a, revised, notes, created_at",
      )
      .eq("share_token", token)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "Report not found" }, 404);

    return json({ report: data });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});
