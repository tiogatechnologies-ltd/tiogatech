import { useEffect, useState } from "react";
import { fetchFreshSingle } from "@/lib/freshContent";

/**
 * Generic reader for a single `site_settings` group (one jsonb row per key).
 *
 * Admin > Settings writes these rows; before this hook existed most of them were
 * written and never read, so editing them silently changed nothing on the site.
 * Every group exposed here is consumed somewhere in the app - do not add a group
 * unless something actually reads it.
 */

export interface ShippingSettings {
  free_shipping_threshold_ngn: number;
  default_shipping_fee_ngn: number;
  delivery_eta_days: string;
  /** Comma-separated states/cities that ship free (our own service areas). */
  service_areas: string;
  pickup_address: string;
}

export interface PaymentSettings {
  accept_bank_transfer: boolean;
  accept_card: boolean;
  accept_pay_on_delivery: boolean;
  allow_guest_checkout: boolean;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
}

export interface TaxSettings {
  vat_percent: number;
  vat_inclusive: boolean;
  invoice_prefix: string;
  invoice_footer: string;
}

export interface PromotionSettings {
  /** Master switch for the struck-through "was" price across the storefront. */
  show_compare_at_price: boolean;
  /**
   * List-price markup, as a percentage above the selling price, used for any
   * item that has no genuine previous price recorded against it. Setting a real
   * `compare_at_price` on a product always overrides this.
   */
  default_markup_pct: number;
}

export interface DiscountSettings {
  /** Hides the coupon input at checkout when the shop is not running promos. */
  show_code_field: boolean;
}

export interface FeatureSettings {
  ai_chat_enabled: boolean;
  ai_recommender_enabled: boolean;
  ai_solar_sizing_enabled: boolean;
  flexible_payment_enabled: boolean;
  store_enabled: boolean;
}

export interface AffiliateSettings {
  default_commission_percent: number;
  min_payout_ngn: number;
  cookie_window_days: number;
  auto_approve_applications: boolean;
  payout_schedule: string;
}

export interface SeoSettings {
  meta_title: string;
  meta_description: string;
  og_image_url: string;
  google_analytics_id: string;
  meta_pixel_id: string;
  google_tag_manager_id: string;
  google_site_verification: string;
  robots_index: boolean;
}

/**
 * Fallbacks used until the live row loads (and if it never does). These are the
 * same values Admin > Settings shows as its defaults, so the UI and the site
 * never disagree about what "unset" means.
 */
export const SETTING_DEFAULTS = {
  shipping: {
    free_shipping_threshold_ngn: 0,
    default_shipping_fee_ngn: 15000,
    delivery_eta_days: "3-7",
    service_areas: "Abuja, FCT, Jos, Plateau",
    pickup_address: "No 7, Commercial Layout, Abattoir Rd, Jos, Plateau State",
  } as ShippingSettings,
  payment: {
    accept_bank_transfer: true,
    accept_card: true,
    accept_pay_on_delivery: false,
    allow_guest_checkout: true,
    bank_name: "",
    bank_account_name: "Tioga Technologies",
    bank_account_number: "",
  } as PaymentSettings,
  tax: {
    vat_percent: 7.5,
    vat_inclusive: true,
    invoice_prefix: "TIO",
    invoice_footer: "Thank you for your business.",
  } as TaxSettings,
  features: {
    ai_chat_enabled: true,
    ai_recommender_enabled: true,
    ai_solar_sizing_enabled: true,
    flexible_payment_enabled: true,
    store_enabled: true,
  } as FeatureSettings,
  promotions: {
    show_compare_at_price: true,
    default_markup_pct: 12,
  } as PromotionSettings,
  discounts: {
    show_code_field: true,
  } as DiscountSettings,
  affiliate: {
    default_commission_percent: 5,
    min_payout_ngn: 50000,
    cookie_window_days: 30,
    auto_approve_applications: false,
    payout_schedule: "monthly",
  } as AffiliateSettings,
  seo: {
    meta_title: "Tioga Technologies - Solar, Smart Home, Security in Nigeria",
    meta_description: "Reliable solar, smart home and security systems with flexible financing across Nigeria.",
    og_image_url: "",
    google_analytics_id: "",
    meta_pixel_id: "",
    google_tag_manager_id: "",
    google_site_verification: "",
    robots_index: true,
  } as SeoSettings,
};

export type SettingGroup = keyof typeof SETTING_DEFAULTS;

const cached = new Map<string, any>();
const inflight = new Map<string, Promise<any>>();

export function loadSetting<K extends SettingGroup>(group: K): Promise<(typeof SETTING_DEFAULTS)[K]> {
  const hit = cached.get(group);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(group);
  if (pending) return pending;

  const p = fetchFreshSingle<{ value: Record<string, unknown> }>(
    `site_settings?select=value&key=eq.${group}`,
  )
    .then(({ data }) => {
      const merged = { ...SETTING_DEFAULTS[group], ...(data?.value || {}) };
      cached.set(group, merged);
      return merged;
    })
    .catch(() => SETTING_DEFAULTS[group])
    .finally(() => { inflight.delete(group); });

  inflight.set(group, p);
  return p;
}

export const SETTINGS_UPDATED_EVENT = "tioga:settings-updated";

/** Called by Admin > Settings after a save so open tabs pick the change up. */
export function invalidateSettingsCache() {
  cached.clear();
  inflight.clear();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT));
  }
}

export function useSiteSetting<K extends SettingGroup>(group: K) {
  const [value, setValue] = useState<(typeof SETTING_DEFAULTS)[K]>(
    () => cached.get(group) ?? SETTING_DEFAULTS[group],
  );
  const [loaded, setLoaded] = useState(() => cached.has(group));

  useEffect(() => {
    let alive = true;
    const run = () => {
      loadSetting(group).then((v) => {
        if (!alive) return;
        setValue(v);
        setLoaded(true);
      });
    };
    run();
    window.addEventListener(SETTINGS_UPDATED_EVENT, run);
    return () => { alive = false; window.removeEventListener(SETTINGS_UPDATED_EVENT, run); };
  }, [group]);

  return { settings: value, loaded };
}

/** Splits the admin's "service areas" list into lowercase tokens for matching. */
export function parseServiceAreas(raw: string): string[] {
  return (raw || "")
    .split(/[,\n;]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
