// Daily cron job: emails customers about upcoming and overdue finance installments.
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const today = new Date(); today.setHours(0,0,0,0);
  const in3 = new Date(today.getTime() + 3 * 86400_000);

  const { data: upcoming } = await supabase
    .from("finance_schedules")
    .select("id, application_id, installment_number, due_date, amount_ngn, status, finance_applications!inner(full_name, email, phone)")
    .in("status", ["pending", "due"])
    .gte("due_date", today.toISOString().slice(0,10))
    .lte("due_date", in3.toISOString().slice(0,10));

  const { data: overdue } = await supabase
    .from("finance_schedules")
    .select("id, application_id, installment_number, due_date, amount_ngn, status, finance_applications!inner(full_name, email, phone)")
    .in("status", ["pending", "due", "overdue"])
    .lt("due_date", today.toISOString().slice(0,10));

  let sent = 0;
  const buckets = [...(upcoming || []).map((s: any) => ({ ...s, kind: "upcoming" })), ...(overdue || []).map((s: any) => ({ ...s, kind: "overdue" }))];

  for (const s of buckets) {
    const app = s.finance_applications;
    if (!app?.email) continue;
    const subject = s.kind === "overdue"
      ? `Overdue installment #${s.installment_number} — please pay`
      : `Reminder: installment #${s.installment_number} due ${s.due_date}`;
    const body = `Hi ${app.full_name?.split(" ")[0] || "there"},\n\nYour finance installment #${s.installment_number} of ₦${Number(s.amount_ngn).toLocaleString()} is ${s.kind === "overdue" ? "overdue" : `due on ${s.due_date}`}.\n\nView and pay: https://tiogatechnologies.com/account/finance\n\nThe Tioga Team`;

    try {
      await supabase.functions.invoke("send-gmail", { body: { to: app.email, subject, text: body } });
      sent++;
      if (s.kind === "overdue" && s.status !== "overdue") {
        await supabase.from("finance_schedules").update({ status: "overdue" }).eq("id", s.id);
      }
    } catch (e) { console.error("reminder failed", s.id, e); }
  }

  return new Response(JSON.stringify({ ok: true, sent, upcoming: upcoming?.length || 0, overdue: overdue?.length || 0 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
