import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  let sid = sessionStorage.getItem("_tid_session");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("_tid_session", sid);
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
  | "product_click";

/** Fire-and-forget conversion tracking. Never blocks UI. */
export function trackConversion(
  event_type: ConversionEvent,
  metadata: Record<string, any> = {}
) {
  try {
    supabase
      .from("conversions")
      .insert({
        session_id: getSessionId(),
        event_type,
        page_path: typeof window !== "undefined" ? window.location.pathname : null,
        metadata,
      })
      .then(({ error }) => {
        if (error) console.warn("[tracking] insert failed", error.message);
      });
  } catch (e) {
    // swallow
  }
}
