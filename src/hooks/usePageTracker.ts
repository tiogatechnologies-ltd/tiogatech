import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  let sid = sessionStorage.getItem("tioga_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("tioga_session_id", sid);
  }
  return sid;
}

export function usePageTracker() {
  const location = useLocation();
  const lastPath = useRef<string>("");

  useEffect(() => {
    const path = location.pathname;
    // Skip admin pages and avoid duplicate fires
    if (path.startsWith("/admin") || path === lastPath.current) return;
    lastPath.current = path;

    const session_id = getSessionId();

    // Fire and forget
    supabase.functions.invoke("track-pageview", {
      body: {
        session_id,
        page_path: path,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      },
    }).catch(() => {});
  }, [location.pathname]);
}
