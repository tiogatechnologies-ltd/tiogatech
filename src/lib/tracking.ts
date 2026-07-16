import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  let sid = sessionStorage.getItem("tioga_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("tioga_session_id", sid);
  }
  return sid;
}

export type ConversionEvent =
  | "cta_click"
  | "lead_form_opened"
  | "lead_form_started"
  | "lead_submitted"
  | "whatsapp_click"
  | "catalog_view"
  | "product_view"
  | "product_click"
  | "contact_submitted"
  | "cart_add"
  | "cart_open"
  | "cart_checkout_whatsapp"
  | "cart_checkout_lead"
  | "energy_calculator_open"
  | "energy_calculator_submit"
  | "lumivolt_sizer_submit"
  | "assessment_started"
  | "assessment_completed"
  | "assessment_full_unlock"
  | "ai_chat_open"
  | "ai_chat_message"
  | "checkout_view"
  | "checkout_step"
  | "checkout_paid"
  | "scroll_depth"
  | "session_end"
  | "vitals"
  | "error";

/** Fire-and-forget conversion tracking. Never blocks UI. */
export function trackConversion(
  event_type: ConversionEvent,
  metadata: Record<string, any> = {}
) {
  try {
    // Attach UTM/campaign context from session storage when present
    const utmRaw = sessionStorage.getItem("tioga_utm");
    const utm = utmRaw ? JSON.parse(utmRaw) : null;
    const meta = utm ? { ...metadata, __utm: utm } : metadata;

    supabase
      .from("conversions")
      .insert({
        session_id: getSessionId(),
        event_type,
        page_path: typeof window !== "undefined" ? window.location.pathname : null,
        metadata: meta,
      })
      .then(({ error }) => {
        if (error) console.warn("[tracking] insert failed", error.message);
      });
  } catch {
    // swallow
  }
}
