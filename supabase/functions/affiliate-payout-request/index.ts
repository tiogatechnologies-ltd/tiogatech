// Affiliate-initiated payout request. Validates the requested amount against the
// affiliate's real available balance before creating the request row.
import { createClient } from "npm:@supabase/supabase-js@2";
import { computeBalance, escapeLike, findAffiliateForUser, getAffiliateSettings } from "../_shared/affiliate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Missing auth" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: ures, error: uerr } = await userClient.auth.getUser();
    if (uerr || !ures.user?.email) return json({ error: "Invalid session" }, 401);

    const body = await req.json().catch(() => ({}));
    const requested = Number(body?.amount);
    const note = typeof body?.note === "string" ? body.note.slice(0, 500) : null;
    if (!Number.isFinite(requested) || requested <= 0) return json({ error: "Enter a valid amount" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const affiliate = await findAffiliateForUser(admin, ures.user, "id, code, commission_rate, status, payout_method, payout_details");

    if (!affiliate) return json({ error: "No affiliate account found" }, 404);
    if (affiliate.status !== "active") return json({ error: "Your affiliate account is not active" }, 403);
    if (!affiliate.payout_details || !String(affiliate.payout_details).trim()) {
      return json({ error: "Add your bank details in Settings before requesting a payout." }, 400);
    }

    const settings = await getAffiliateSettings(admin);
    const MIN_PAYOUT_NGN = settings.min_payout_ngn;

    const [{ data: orders }, { data: payouts }, { data: pendingReqs }] = await Promise.all([
      admin.from("orders").select("total, payment_status").ilike("affiliate_code", escapeLike(affiliate.code)).eq("payment_status", "paid"),
      admin.from("affiliate_payouts").select("amount, status").eq("affiliate_id", affiliate.id),
      admin.from("affiliate_payout_requests").select("amount, status").eq("affiliate_id", affiliate.id).eq("status", "pending"),
    ]);

    const { available } = computeBalance(Number(affiliate.commission_rate || 0), orders ?? [], payouts ?? [], pendingReqs ?? []);

    if (available < MIN_PAYOUT_NGN) {
      return json({ error: `You need at least ₦${MIN_PAYOUT_NGN.toLocaleString()} available to request a payout.` }, 400);
    }
    if (requested < MIN_PAYOUT_NGN) {
      return json({ error: `Minimum payout request is ₦${MIN_PAYOUT_NGN.toLocaleString()}.` }, 400);
    }
    if (requested > available) {
      return json({ error: `You can request up to ₦${Math.floor(available).toLocaleString()}.` }, 400);
    }

    const { data: created, error: insErr } = await admin
      .from("affiliate_payout_requests")
      .insert({ affiliate_id: affiliate.id, amount: requested, note, status: "pending" })
      .select()
      .single();

    if (insErr) return json({ error: insErr.message }, 500);
    return json({ success: true, request: created, available: available - requested, min_payout: MIN_PAYOUT_NGN });
  } catch (err) {
    console.error("affiliate-payout-request error", err);
    return json({ error: (err as Error).message }, 500);
  }
});
