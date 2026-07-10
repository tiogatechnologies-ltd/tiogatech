// Daily cron: mark schedules overdue when their due_date has passed.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const CRON_SECRET = Deno.env.get("CRON_SHARED_SECRET");

  const authHeader = req.headers.get("Authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const isAuthed = authHeader === `Bearer ${SERVICE_KEY}` || (CRON_SECRET && cronHeader === CRON_SECRET);
  if (!isAuthed) return json({ error: "unauthorized" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const today = new Date().toISOString().slice(0, 10);

  const { data: overdue, error } = await admin
    .from("finance_schedules")
    .update({ status: "overdue" })
    .lt("due_date", today)
    .in("status", ["upcoming", "due"])
    .select("id");
  if (error) return json({ error: error.message }, 500);

  return json({ marked_overdue: (overdue || []).length });
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
}
