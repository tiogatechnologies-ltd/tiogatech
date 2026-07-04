import { supabase } from "@/integrations/supabase/client";

export type AiPlanId = "starter" | "business" | "custom";

interface StartOpts {
  plan: AiPlanId;
  amountNgn: number;
  email: string;
  userId?: string | null;
}

/**
 * Start a Paystack checkout for an AI plan subscription.
 * Opens the authorization_url in the same tab. Returns an error string if init fails.
 */
export async function startAiSubscription({ plan, amountNgn, email, userId }: StartOpts): Promise<string | null> {
  try {
    const callback_url = `${window.location.origin}/account/subscription?plan=${plan}&pay=success`;
    const { data, error } = await supabase.functions.invoke("paystack-init", {
      body: {
        amount_ngn: amountNgn,
        email,
        callback_url,
        metadata: { purpose: "ai_subscription", plan, user_id: userId || null },
      },
    });
    if (error) return error.message || "Payment init failed";
    const url = (data as any)?.authorization_url;
    if (!url) return (data as any)?.error || "Payment init failed";
    window.location.href = url;
    return null;
  } catch (e: any) {
    return e?.message || "Payment init failed";
  }
}
