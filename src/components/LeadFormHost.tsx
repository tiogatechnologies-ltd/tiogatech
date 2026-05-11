import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LeadForm from "./LeadForm";
import { trackConversion } from "@/lib/tracking";

/**
 * Mounted once at the app root so any page can open the lead form
 * by dispatching `tioga:open-lead-form` or by navigating with `?lead=1`.
 */
const LeadFormHost = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      trackConversion("cta_click", { source: detail.source || "ai_badge" });
      trackConversion("lead_form_opened", { source: detail.source || "ai_badge" });
      setOpen(true);
    };
    window.addEventListener("tioga:open-lead-form", handler);
    return () => window.removeEventListener("tioga:open-lead-form", handler);
  }, []);

  // Auto-open when navigated with ?lead=1 from anywhere
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("lead") === "1") {
      trackConversion("lead_form_opened", { source: "url_param" });
      setOpen(true);
      params.delete("lead");
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  return <LeadForm open={open} onClose={() => setOpen(false)} />;
};

export default LeadFormHost;
