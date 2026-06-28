// Verify a Paystack transaction by reference.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!SECRET) {
      return new Response(JSON.stringify({ error: "PAYSTACK_SECRET_KEY not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference") || (await req.json().catch(() => ({}))).reference;
    if (!reference) {
      return new Response(JSON.stringify({ error: "reference is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    const j = await r.json();
    return new Response(JSON.stringify({
      success: j?.data?.status === "success",
      status: j?.data?.status,
      amount_ngn: j?.data?.amount ? j.data.amount / 100 : null,
      currency: j?.data?.currency,
      reference: j?.data?.reference,
      paid_at: j?.data?.paid_at,
      customer_email: j?.data?.customer?.email,
      metadata: j?.data?.metadata,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
