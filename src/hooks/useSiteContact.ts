import { useEffect, useState } from "react";
import { fetchFreshSingle } from "@/lib/freshContent";

export interface SiteContact {
  phone: string;
  email: string;
  support_email: string;
  address: string;
  whatsapp: string;
  business_hours: string;
}

/** Falls back to the values shown in Admin > Settings > Brand & Contact until the live row loads. */
export const DEFAULT_CONTACT: SiteContact = {
  phone: "+234 903 596 6388",
  email: "sales@tiogatechnologies.com",
  support_email: "support@tiogatechnologies.com",
  address: "No 7, Commercial Layout, Abattoir Rd, LGA, behind Airforce Primary School, Jos 930103, Plateau State, Nigeria",
  whatsapp: "+2348178000023",
  business_hours: "Mon to Fri · 10:00 AM to 6:00 PM WAT",
};

/** Digits-only WhatsApp number for wa.me links, e.g. "2348178000023". */
export function whatsappDigits(contact: SiteContact): string {
  return (contact.whatsapp || "").replace(/[^\d]/g, "");
}

/** Builds a wa.me link, optionally pre-filled with a message. */
export function whatsappLink(contact: SiteContact, message?: string): string {
  const base = `https://wa.me/${whatsappDigits(contact)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

let inflight: Promise<SiteContact> | null = null;
let cached: SiteContact | null = null;

async function loadContact(): Promise<SiteContact> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = fetchFreshSingle<{ value: Partial<SiteContact> }>("site_settings?select=value&key=eq.contact")
    .then(({ data }) => {
      const merged = { ...DEFAULT_CONTACT, ...(data?.value || {}) };
      cached = merged;
      return merged;
    })
    .catch(() => DEFAULT_CONTACT)
    .finally(() => { inflight = null; });
  return inflight;
}

export const CONTACT_UPDATED_EVENT = "tioga:contact-updated";

export function invalidateSiteContactCache() {
  cached = null;
  inflight = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CONTACT_UPDATED_EVENT));
  }
}

/** Live, admin-editable contact details (phone/WhatsApp/email/address). */
export function useSiteContact(): { contact: SiteContact; loading: boolean } {
  const [contact, setContact] = useState<SiteContact>(cached ?? DEFAULT_CONTACT);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;
    const fetchLatest = () => {
      loadContact().then((c) => {
        if (!cancelled) {
          setContact(c);
          setLoading(false);
        }
      });
    };

    fetchLatest();

    if (typeof window !== "undefined") {
      window.addEventListener(CONTACT_UPDATED_EVENT, fetchLatest);
    }

    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener(CONTACT_UPDATED_EVENT, fetchLatest);
      }
    };
  }, []);

  return { contact, loading };
}
