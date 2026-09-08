// Monthly free-credit top-up. Idempotent: safe to run daily.
// Tops every user up to at least 3 free credits at the start of each calendar month
// and resets used_credits to 0. Never touches purchased_credits.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Fails closed. This used to be `if (shared && provided !== shared)`, which
  // let anyone call it whenever CRON_SHARED_SECRET was unset - harmless while
  // the gateway still demanded a JWT, but wide open once it does not. A
  // service-role caller is also accepted, matching the other scheduled jobs.
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const shared = Deno.env.get("CRON_SHARED_SECRET");
  const provided = req.headers.get("x-cron-secret") || new URL(req.url).searchParams.get("secret");
  const isAuthed =
    req.headers.get("Authorization") === `Bearer ${SERVICE_KEY}` ||
    (!!shared && provided === shared);
  if (!isAuthed) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, SERVICE_KEY);
  const { data, error } = await admin.rpc("reset_monthly_free_credits");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify({ updated: data ?? 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
