import { useEffect } from "react";
import { useSiteSetting } from "@/hooks/useSiteSetting";

/**
 * Injects the analytics tags configured in Admin > Settings > SEO & Tracking.
 *
 * Those fields used to be written and never read, so pasting a GA4 or Pixel ID
 * did nothing. Tags are added once per id and only in the browser; ids are
 * validated against their known formats so a stray paste cannot inject markup.
 */

const GA_RE = /^(G|UA|AW)-[A-Z0-9-]{4,20}$/i;
const GTM_RE = /^GTM-[A-Z0-9]{4,12}$/i;
const PIXEL_RE = /^\d{8,20}$/;

const addOnce = (id: string, build: () => HTMLElement) => {
  if (document.getElementById(id)) return;
  const el = build();
  el.id = id;
  document.head.appendChild(el);
};

const SiteAnalytics = () => {
  const { settings, loaded } = useSiteSetting("seo");

  useEffect(() => {
    if (!loaded || typeof document === "undefined") return;

    const ga = (settings.google_analytics_id || "").trim();
    if (GA_RE.test(ga)) {
      addOnce("tioga-ga-src", () => {
        const s = document.createElement("script");
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`;
        return s;
      });
      addOnce("tioga-ga-init", () => {
        const s = document.createElement("script");
        s.text = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(ga)});`;
        return s;
      });
    }

    const gtm = (settings.google_tag_manager_id || "").trim();
    if (GTM_RE.test(gtm)) {
      addOnce("tioga-gtm", () => {
        const s = document.createElement("script");
        s.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(gtm)});`;
        return s;
      });
    }

    const pixel = (settings.meta_pixel_id || "").trim();
    if (PIXEL_RE.test(pixel)) {
      addOnce("tioga-meta-pixel", () => {
        const s = document.createElement("script");
        s.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(pixel)});fbq('track','PageView');`;
        return s;
      });
    }

    const verification = (settings.google_site_verification || "").trim();
    if (verification && !document.querySelector('meta[name="google-site-verification"]')) {
      addOnce("tioga-gsv", () => {
        const m = document.createElement("meta");
        m.setAttribute("name", "google-site-verification");
        m.setAttribute("content", verification);
        return m;
      });
    }

    // Turning indexing off has to override the static tag in index.html.
    const robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const value = settings.robots_index ? "index, follow" : "noindex, nofollow";
    if (robots) robots.content = value;
    else {
      const m = document.createElement("meta");
      m.setAttribute("name", "robots");
      m.content = value;
      document.head.appendChild(m);
    }
  }, [loaded, settings]);

  return null;
};

export default SiteAnalytics;
