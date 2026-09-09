import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { Search, Save, Building2, Phone, Search as SearchIcon, Truck, ShieldCheck, CreditCard, Bell, Image as ImageIcon, Plug, Database, FileSliders, Tag, Users, ScrollText, Globe, RefreshCw, CloudUpload, ExternalLink, Loader2 } from "lucide-react";
import { bumpGlobalCache } from "@/lib/cache";
import { invalidateSiteContactCache } from "@/hooks/useSiteContact";
import { invalidateSettingsCache } from "@/hooks/useSiteSetting";

type Section = { id: string; label: string; icon: any; group: string; adminOnly?: boolean; members: string[]; keywords?: string };

// Panes group one or more underlying `site_settings` keys. The storage keys are
// unchanged - merging only affects how the panes are presented.
const SECTIONS: Section[] = [
  { id: "brand", label: "Brand & Contact", icon: Building2, group: "Storefront", members: ["general", "social", "contact"], keywords: "site name tagline facebook instagram twitter linkedin tiktok youtube telegram phone email address whatsapp business hours" },
  { id: "seo", label: "SEO & Tracking", icon: SearchIcon, group: "Storefront", members: ["seo"], keywords: "meta analytics pixel tag manager verification robots og image" },

  { id: "payment", label: "Payments & Financing", icon: CreditCard, group: "Commerce", members: ["payment", "finance"], keywords: "paystack bank transfer card guest checkout flexible payment easy flex deposit tenure interest" },
  { id: "selling", label: "Delivery, Tax & Promotions", icon: Truck, group: "Commerce", members: ["shipping", "tax", "discounts", "promotions", "affiliate"], keywords: "delivery fee pickup shipping vat invoice discount coupon slashed struck crossed out was price list price markup save badge affiliate commission payout cookie" },

  { id: "notif", label: "Notifications & Email", icon: Bell, group: "Comms", members: ["notif", "email"], keywords: "alerts from name sender template footer" },

  { id: "system", label: "System & Access", icon: ShieldCheck, group: "System", adminOnly: true, members: ["admins", "features", "backups"], keywords: "admins users roles ai chat recommender sizing store toggle backup export drive cache purge" },

];


// Every field below is read by something. Controls that wrote a value nothing
// ever consumed (hero copy, theme colour, "connected service" booleans, session
// timeout / IP allowlist / HIBP - all owned by Supabase Auth, not by a jsonb
// row) were removed rather than left as decoration an admin could trust.
const defaults: Record<string, any> = {
  general: { site_name: "Tioga Technologies", tagline: "Powering Nigerian homes and businesses" },
  contact: { phone: "+234 903 596 6388", email: "sales@tiogatechnologies.com", support_email: "support@tiogatechnologies.com", address: "No 7, Commercial Layout, Abattoir Rd, LGA, behind Airforce Primary School, Jos 930103, Plateau State, Nigeria", whatsapp: "+2348178000023", business_hours: "Mon to Fri · 10:00 AM to 6:00 PM WAT" },
  social: { facebook: "", instagram: "", twitter: "", linkedin: "", tiktok: "", youtube: "", telegram: "", whatsapp_community: "" },
  seo: { meta_title: "Tioga Technologies - Solar, Smart Home, Security in Nigeria", meta_description: "Reliable solar, smart home and security systems with flexible financing across Nigeria.", og_image_url: "", google_analytics_id: "", meta_pixel_id: "", google_tag_manager_id: "", google_site_verification: "", robots_index: true },
  payment: { bank_name: "", bank_account_name: "Tioga Technologies", bank_account_number: "", accept_bank_transfer: true, accept_card: true, allow_guest_checkout: true },
  finance: { deposit_pct: 0.30, tenures_months: [3, 6, 12, 24], vat_pct: 0.075, install_pct: 0.10, insurance_pct: 0.02, management_pct: 0.01, min_finance_amount_ngn: 500000, max_finance_amount_ngn: 50000000, finance_terms_url: "/finance", interest_tiers: [{ min: 1000000, max: 5000000, rate: 0.09 }, { min: 5000001, max: 7500000, rate: 0.15 }, { min: 7500001, max: null, rate: 0.25 }] },
  // Defaults mirror the delivery rules the storefront already applied, so an
  // untouched install behaves exactly as before this became configurable.
  shipping: { free_shipping_threshold_ngn: 0, default_shipping_fee_ngn: 15000, delivery_eta_days: "3-7", service_areas: "Abuja, FCT, Jos, Plateau", pickup_address: "No 7, Commercial Layout, Abattoir Rd, Jos, Plateau State" },
  tax: { vat_percent: 7.5, vat_inclusive: true, invoice_prefix: "TIO", invoice_footer: "Thank you for your business." },
  promotions: { show_compare_at_price: true, default_markup_pct: 12, badge_format: "save_pct", product_overrides: {} },
  discounts: { show_code_field: true },
  affiliate: { default_commission_percent: 5, min_payout_ngn: 50000, cookie_window_days: 30, auto_approve_applications: false, payout_schedule: "monthly" },
  notif: { notify_email: "sales@tiogatechnologies.com", notify_on_new_lead: true, notify_on_order: true, notify_on_affiliate_application: true, notify_on_finance_application: true },
  email: { from_name: "Tioga Technologies", from_email: "sales@tiogatechnologies.com", footer_text: "Tioga Technologies, Jos, Nigeria" },
  features: { ai_chat_enabled: true, ai_recommender_enabled: true, ai_solar_sizing_enabled: true, flexible_payment_enabled: true, store_enabled: true },
  backups: {},
  admins: {},
};

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-foreground">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

const inputClass = "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground";
const toggleClass = "relative inline-flex h-5 w-9 items-center rounded-full transition-colors";
const normalizeFinanceSettings = (value: any = {}) => {
  const base = { ...defaults.finance, ...(value || {}) };
  return {
    ...base,
    deposit_pct: typeof base.deposit_pct === "number" ? base.deposit_pct : Number(base.deposit_percent || 30) / 100,
    tenures_months: [3, 6, 12, 24],
  };
};

const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button type="button" onClick={() => onChange(!value)} className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg border border-border hover:bg-muted/40 text-left">
    <span className="text-sm">{label}</span>
    <span className={`${toggleClass} ${value ? "bg-primary" : "bg-muted-foreground/30"}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-background transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </span>
  </button>
);

const Card = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card">
    <div className="px-5 py-4 border-b border-border">
      <h3 className="text-sm font-display font-bold text-card-foreground">{title}</h3>
      {desc && <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const AdminSettings = () => {
  const [data, setData] = useState<Record<string, any>>(defaults);
  const [original, setOriginal] = useState<Record<string, any>>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("brand");

  useEffect(() => {
    (async () => {
      try {
        const { data: rows } = await supabase.from("site_settings").select("key, value");
        const merged = { ...defaults };
        (rows || []).forEach((r: any) => {
          if (r.key) {
            merged[r.key] = r.key === "finance"
              ? normalizeFinanceSettings(r.value)
              : { ...(defaults[r.key] || {}), ...(r.value || {}) };
          }
        });
        setData(merged);
        setOriginal(merged);
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(original), [data, original]);

  const set = (section: string, patch: any) => setData((d) => ({ ...d, [section]: { ...(d[section] || {}), ...patch } }));

  const saveAll = async () => {
    setSaving(true);
    try {
      const changed = Object.keys(data).filter((k) => JSON.stringify(data[k]) !== JSON.stringify(original[k]));
      for (const k of changed) {
        await supabase.from("site_settings").upsert({ key: k, value: data[k] }, { onConflict: "key" });
      }
      if (changed.includes("contact")) invalidateSiteContactCache();
      // Storefront reads shipping/payment/tax/features/affiliate/seo through the
      // settings cache, so drop it or open tabs keep serving the old values.
      invalidateSettingsCache();
      setOriginal(data); toast.success("Settings saved");
    } catch (e: any) { toast.error(e?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = SECTIONS.filter(
      (s) => !q || s.label.toLowerCase().includes(q) || s.group.toLowerCase().includes(q) || (s.keywords || "").includes(q),
    );
    const byGroup: Record<string, Section[]> = {};
    filtered.forEach((s) => { (byGroup[s.group] = byGroup[s.group] || []).push(s); });
    return byGroup;
  }, [query]);

  const openSection = (id: string) => {
    setActive(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById("settings-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const activeSection = SECTIONS.find((s) => s.id === active);
  // A pane can host several legacy sections; show every section that belongs to it.
  const paneCls = (id: string) => (activeSection?.members.includes(id) ? "space-y-4" : "hidden");


  return (
    <AdminLayout>
      <div className="space-y-6 pb-24">
        {/* Page header - matches the other admin pages */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure your storefront, commerce, communications and system preferences.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <button
                onClick={() => setData(original)}
                className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted"
              >
                Discard
              </button>
            )}
            <button
              onClick={saveAll}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </button>
          </div>
        </div>

        {/* Mobile group + section picker */}
        <div className="lg:hidden space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search settings…"
              className={`${inputClass} pl-9`}
            />
          </div>
          <div className="-mx-4 px-4 overflow-x-auto">
            <div className="flex gap-2 w-max pb-1">
              {Object.entries(groups).flatMap(([group, items]) =>
                items.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openSection(s.id)}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active === s.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <s.icon size={12} />
                    {s.label}
                  </button>
                )),
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left rail */}
          <aside className="hidden lg:block lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-20 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search settings…"
                    className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <nav className="rounded-2xl border border-border bg-card p-2 space-y-3 max-h-[70vh] overflow-y-auto">
                {Object.entries(groups).map(([group, items]) => (
                  <div key={group}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70 px-3 pt-2 pb-1.5">{group}</p>
                    <div className="space-y-0.5">
                      {items.map((s) => {
                        const isActive = active === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => openSection(s.id)}
                            className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                              isActive
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            }`}
                          >
                            <span className={`flex h-7 w-7 items-center justify-center rounded-md ${isActive ? "bg-primary/15" : "bg-muted/50 group-hover:bg-muted"}`}>
                              <s.icon size={14} />
                            </span>
                            <span className="flex-1 text-left truncate">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {Object.keys(groups).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No matches</p>
                )}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div id="settings-panel" className="flex-1 min-w-0 rounded-2xl border border-border bg-muted/20 p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span>{activeSection?.group}</span>
              <span aria-hidden>/</span>
              <span className="text-primary">{activeSection?.label}</span>
            </div>

          {loading ? (
            <div className="text-center py-20 text-muted-foreground">Loading…</div>
          ) : (
            <>
              {/* GENERAL */}
              <section id="sec-general" className={paneCls("general")}>
                <header><h2 className="font-display text-xl font-bold">General</h2><p className="text-xs text-muted-foreground">Core site identity and defaults.</p></header>
                <Card title="Site identity" desc="Homepage hero copy lives in Landing & Web Pages; logo and theme colour ship with the build.">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Site name"><input className={inputClass} value={data.general.site_name} onChange={(e) => set("general", { site_name: e.target.value })} /></Field>
                    <Field label="Tagline"><input className={inputClass} value={data.general.tagline} onChange={(e) => set("general", { tagline: e.target.value })} /></Field>
                  </div>
                </Card>
              </section>

              {/* CONTACT */}
              <section id="sec-contact" className={paneCls("contact")}>
                <header><h2 className="font-display text-xl font-bold">Contact</h2></header>
                <Card title="Customer-facing contact details">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(["phone","email","support_email","address","whatsapp","business_hours"] as const).map((k) => (
                      <Field key={k} label={k.replace(/_/g," ").replace(/^\w/, (c) => c.toUpperCase())}><input className={inputClass} value={data.contact[k]} onChange={(e) => set("contact", { [k]: e.target.value })} /></Field>
                    ))}
                  </div>
                </Card>
              </section>

              {/* SOCIAL */}
              <section id="sec-social" className={paneCls("social")}>
                <header><h2 className="font-display text-xl font-bold">Social</h2></header>
                <Card title="Social media handles">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(["facebook","instagram","twitter","linkedin","tiktok","youtube","telegram","whatsapp_community"] as const).map((k) => (
                      <Field key={k} label={k.replace(/_/g," ").replace(/^\w/, (c) => c.toUpperCase())}><input className={inputClass} value={data.social[k]} onChange={(e) => set("social", { [k]: e.target.value })} placeholder="https://…" /></Field>
                    ))}
                  </div>
                </Card>
              </section>

              {/* SEO */}
              <section id="sec-seo" className={paneCls("seo")}>
                <header><h2 className="font-display text-xl font-bold">SEO & Tracking</h2></header>
                <Card title="Search engine optimization">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Meta title"><input className={inputClass} value={data.seo.meta_title} onChange={(e) => set("seo", { meta_title: e.target.value })} /></Field>
                    <Field label="Meta description"><input className={inputClass} value={data.seo.meta_description} onChange={(e) => set("seo", { meta_description: e.target.value })} /></Field>
                    <Field label="OG image URL"><input className={inputClass} value={data.seo.og_image_url} onChange={(e) => set("seo", { og_image_url: e.target.value })} /></Field>
                    <div className="flex items-center"><Toggle label="Allow search indexing" value={!!data.seo.robots_index} onChange={(v) => set("seo", { robots_index: v })} /></div>
                  </div>
                </Card>
                <Card title="Analytics & pixels">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Google Analytics ID"><input className={inputClass} value={data.seo.google_analytics_id} onChange={(e) => set("seo", { google_analytics_id: e.target.value })} placeholder="G-XXXX" /></Field>
                    <Field label="Google Tag Manager"><input className={inputClass} value={data.seo.google_tag_manager_id} onChange={(e) => set("seo", { google_tag_manager_id: e.target.value })} placeholder="GTM-XXXX" /></Field>
                    <Field label="Meta Pixel ID"><input className={inputClass} value={data.seo.meta_pixel_id} onChange={(e) => set("seo", { meta_pixel_id: e.target.value })} /></Field>
                    <Field label="Google site verification"><input className={inputClass} value={data.seo.google_site_verification} onChange={(e) => set("seo", { google_site_verification: e.target.value })} /></Field>
                  </div>
                </Card>
              </section>

              {/* PAYMENT */}
              <section id="sec-payment" className={paneCls("payment")}>
                <header><h2 className="font-display text-xl font-bold">Payments</h2></header>
                <Card title="Paystack" desc="Both keys live in Supabase secrets - checkout runs server-side, so no key is ever exposed to the browser.">
                  <p className="text-xs text-muted-foreground">
                    Set <code className="font-mono text-foreground">PAYSTACK_SECRET_KEY</code> under Project Settings &rarr; Edge Functions &rarr; Secrets.
                    The callback URL in your Paystack dashboard should point at <code className="font-mono text-foreground">/checkout/success</code>.
                  </p>
                </Card>
                <Card title="Bank transfer" desc="Shown to customers who ask for a manual transfer.">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Bank name"><input className={inputClass} value={data.payment.bank_name} onChange={(e) => set("payment", { bank_name: e.target.value })} /></Field>
                    <Field label="Account name"><input className={inputClass} value={data.payment.bank_account_name} onChange={(e) => set("payment", { bank_account_name: e.target.value })} /></Field>
                    <Field label="Account number"><input className={inputClass} value={data.payment.bank_account_number} onChange={(e) => set("payment", { bank_account_number: e.target.value })} /></Field>
                  </div>
                </Card>
                <Card title="Accepted methods" desc="Card and bank transfer share one Paystack checkout; switching both off hides it and leaves WhatsApp as the only route.">
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Toggle label="Card (Paystack)" value={!!data.payment.accept_card} onChange={(v) => set("payment", { accept_card: v })} />
                    <Toggle label="Bank transfer (Paystack)" value={!!data.payment.accept_bank_transfer} onChange={(v) => set("payment", { accept_bank_transfer: v })} />
                    <Toggle label="Allow guest checkout" value={!!data.payment.allow_guest_checkout} onChange={(v) => set("payment", { allow_guest_checkout: v })} />
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Card payment always requires an account - the transaction is verified against its signed-in owner. Guest checkout controls the WhatsApp route.
                  </p>
                </Card>
              </section>

              {/* FINANCE */}
              <section id="sec-finance" className={paneCls("finance")}>
                <header><h2 className="font-display text-xl font-bold">Flexible Payment</h2></header>
                <Card title="Plan rates" desc="Markup applied per plan tenor.">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Deposit %"><input type="number" className={inputClass} value={Math.round((data.finance.deposit_pct ?? 0.3) * 100)} onChange={(e) => set("finance", { deposit_pct: +e.target.value / 100 })} /></Field>
                    <Field label="Insurance %"><input type="number" step="0.1" className={inputClass} value={((data.finance.insurance_pct ?? 0.02) * 100).toFixed(1)} onChange={(e) => set("finance", { insurance_pct: +e.target.value / 100 })} /></Field>
                    <Field label="Management %"><input type="number" step="0.1" className={inputClass} value={((data.finance.management_pct ?? 0.01) * 100).toFixed(1)} onChange={(e) => set("finance", { management_pct: +e.target.value / 100 })} /></Field>
                    <Field label="VAT %"><input type="number" step="0.1" className={inputClass} value={((data.finance.vat_pct ?? 0.075) * 100).toFixed(1)} onChange={(e) => set("finance", { vat_pct: +e.target.value / 100 })} /></Field>
                    <Field label="Min finance amount (NGN)"><input type="number" className={inputClass} value={data.finance.min_finance_amount_ngn} onChange={(e) => set("finance", { min_finance_amount_ngn: +e.target.value })} /></Field>
                    <Field label="Max finance amount (NGN)"><input type="number" className={inputClass} value={data.finance.max_finance_amount_ngn} onChange={(e) => set("finance", { max_finance_amount_ngn: +e.target.value })} /></Field>
                  </div>
                  <div className="mt-4 rounded-2xl border border-border bg-background/50 p-4">
                    <label className="text-xs font-semibold text-foreground block mb-2">Available tenures</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[3, 6, 12, 24].map((m) => <span key={m} className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-3 text-center text-sm font-semibold text-primary">{m} months</span>)}
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">All four tenures are enforced on the public calculator, application form, and backend schedule generator.</p>
                  </div>
                </Card>
              </section>

              {/* SHIPPING */}
              <section id="sec-shipping" className={paneCls("shipping")}>
                <header><h2 className="font-display text-xl font-bold">Shipping & Pickup</h2></header>
                <Card title="Rates and areas" desc="Applied live at checkout.">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Default shipping fee (NGN)" hint="Charged outside your service areas."><input type="number" className={inputClass} value={data.shipping.default_shipping_fee_ngn} onChange={(e) => set("shipping", { default_shipping_fee_ngn: +e.target.value })} /></Field>
                    <Field label="Free shipping threshold (NGN)" hint="Orders at or above this ship free anywhere. 0 disables it."><input type="number" className={inputClass} value={data.shipping.free_shipping_threshold_ngn} onChange={(e) => set("shipping", { free_shipping_threshold_ngn: +e.target.value })} /></Field>
                    <Field label="Delivery ETA (days)"><input className={inputClass} value={data.shipping.delivery_eta_days} onChange={(e) => set("shipping", { delivery_eta_days: e.target.value })} /></Field>
                    <Field label="Service areas" hint="Comma-separated states/cities you deliver to free from your own offices."><input className={inputClass} value={data.shipping.service_areas} onChange={(e) => set("shipping", { service_areas: e.target.value })} /></Field>
                    <Field label="Pickup address"><input className={inputClass} value={data.shipping.pickup_address} onChange={(e) => set("shipping", { pickup_address: e.target.value })} /></Field>
                  </div>
                </Card>
              </section>

              {/* TAX */}
              <section id="sec-tax" className={paneCls("tax")}>
                <header><h2 className="font-display text-xl font-bold">Tax & Invoicing</h2></header>
                <Card title="VAT & invoices">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="VAT %"><input type="number" step="0.1" className={inputClass} value={data.tax.vat_percent} onChange={(e) => set("tax", { vat_percent: +e.target.value })} /></Field>
                    <div className="flex items-center"><Toggle label="VAT inclusive pricing" value={!!data.tax.vat_inclusive} onChange={(v) => set("tax", { vat_inclusive: v })} /></div>
                    <Field label="Invoice number prefix"><input className={inputClass} value={data.tax.invoice_prefix} onChange={(e) => set("tax", { invoice_prefix: e.target.value })} /></Field>
                    <Field label="Invoice footer"><input className={inputClass} value={data.tax.invoice_footer} onChange={(e) => set("tax", { invoice_footer: e.target.value })} /></Field>
                  </div>
                </Card>
              </section>

              {/* DISCOUNTS */}
              <section id="sec-discounts" className={paneCls("discounts")}>
                <header><h2 className="font-display text-xl font-bold">Discounts</h2><p className="text-xs text-muted-foreground">Manage codes in the Discounts page.</p></header>
                <Card title="Behavior">
                  <Toggle label="Show discount code field at checkout" value={!!data.discounts.show_code_field} onChange={(v) => set("discounts", { show_code_field: v })} />
                  <p className="mt-3 text-[11px] text-muted-foreground">One code per order - codes are validated server-side and cannot be stacked.</p>
                </Card>
                <Card
                  title="Struck-through list price"
                  desc="Shows a crossed-out higher price and a Save % badge on product and package cards."
                >
                  <Toggle
                    label="Show a struck-through list price"
                    value={!!data.promotions.show_compare_at_price}
                    onChange={(v) => set("promotions", { show_compare_at_price: v })}
                  />
                  <div className="mt-4 max-w-xs">
                    <Field
                      label="List price markup (%)"
                      hint="How far above the selling price the crossed-out figure sits. 12% on ₦500,000 shows ₦560,000 and a Save 11% badge."
                    >
                      <input
                        type="number"
                        min={0}
                        max={90}
                        className={inputClass}
                        value={data.promotions.default_markup_pct}
                        onChange={(e) => set("promotions", { default_markup_pct: Math.max(0, Math.min(90, +e.target.value)) })}
                      />
                    </Field>
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    This markup is the fallback. Any product with a <strong className="text-foreground">Previous price</strong> filled in
                    under Product Catalog uses that real figure instead, and keeps showing it even if this is switched off.
                  </p>
                </Card>
              </section>

              {/* AFFILIATES */}
              <section id="sec-affiliate" className={paneCls("affiliate")}>
                <header><h2 className="font-display text-xl font-bold">Affiliates</h2></header>
                <Card title="Program rules">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Default commission %"><input type="number" className={inputClass} value={data.affiliate.default_commission_percent} onChange={(e) => set("affiliate", { default_commission_percent: +e.target.value })} /></Field>
                    <Field label="Minimum payout (NGN)"><input type="number" className={inputClass} value={data.affiliate.min_payout_ngn} onChange={(e) => set("affiliate", { min_payout_ngn: +e.target.value })} /></Field>
                    <Field label="Cookie window (days)"><input type="number" className={inputClass} value={data.affiliate.cookie_window_days} onChange={(e) => set("affiliate", { cookie_window_days: +e.target.value })} /></Field>
                    <Field label="Payout schedule"><input className={inputClass} value={data.affiliate.payout_schedule} onChange={(e) => set("affiliate", { payout_schedule: e.target.value })} /></Field>
                  </div>
                  <div className="mt-4"><Toggle label="Auto-approve affiliate applications" value={!!data.affiliate.auto_approve_applications} onChange={(v) => set("affiliate", { auto_approve_applications: v })} /></div>
                </Card>
              </section>

              {/* NOTIF */}
              <section id="sec-notif" className={paneCls("notif")}>
                <header><h2 className="font-display text-xl font-bold">Notifications</h2></header>
                <Card title="Notification email" desc="Where internal alerts are delivered. Every admin account is copied too.">
                  <Field label="Notification email"><input className={inputClass} value={data.notif.notify_email} onChange={(e) => set("notif", { notify_email: e.target.value })} /></Field>
                </Card>
                <Card title="What to alert me about">
                  <div className="grid sm:grid-cols-2 gap-2">
                    {([
                      ["notify_on_new_lead", "New lead captured"],
                      ["notify_on_order", "New order placed"],
                      ["notify_on_affiliate_application", "Affiliate application"],
                      ["notify_on_finance_application", "Finance application"],
                    ] as const).map(([k, label]) => (
                      <Toggle key={k} label={label} value={!!data.notif[k]} onChange={(v) => set("notif", { [k]: v })} />
                    ))}
                  </div>
                </Card>
              </section>

              {/* EMAIL */}
              <section id="sec-email" className={paneCls("email")}>
                <header><h2 className="font-display text-xl font-bold">Email & Templates</h2></header>
                <Card title="Sender">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="From name"><input className={inputClass} value={data.email.from_name} onChange={(e) => set("email", { from_name: e.target.value })} /></Field>
                    <Field label="From email"><input className={inputClass} value={data.email.from_email} onChange={(e) => set("email", { from_email: e.target.value })} /></Field>
                  </div>
                  <div className="mt-4"><Field label="Footer text"><input className={inputClass} value={data.email.footer_text} onChange={(e) => set("email", { footer_text: e.target.value })} /></Field></div>
                </Card>
              </section>

              {/* FEATURES */}
              <section id="sec-features" className={paneCls("features")}>
                <header><h2 className="font-display text-xl font-bold">Feature Flags</h2></header>
                <Card title="Toggle features">
                  <div className="grid sm:grid-cols-2 gap-2">
                    {([
                      ["ai_chat_enabled", "AI chat assistant"],
                      ["ai_recommender_enabled", "AI product recommender"],
                      ["ai_solar_sizing_enabled", "AI solar sizing"],
                      ["flexible_payment_enabled", "Flexible payment plan at checkout"],
                      ["store_enabled", "Online store & checkout"],
                    ] as const).map(([k, label]) => (
                      <Toggle key={k} label={label} value={!!data.features[k]} onChange={(v) => set("features", { [k]: v })} />
                    ))}
                  </div>
                </Card>
                <Card title="Authentication & access" desc="Managed by Supabase, not by this page.">
                  <p className="text-xs text-muted-foreground">
                    Email verification, password strength and leaked-password checks, session length and MFA are configured in
                    Supabase Dashboard &rarr; Authentication. Staff roles and per-page permissions live in Staff &amp; User Management and the Role Permissions Matrix.
                  </p>
                </Card>
              </section>

              {/* BACKUPS */}
              <section id="sec-backups" className={paneCls("backups")}>
                <header><h2 className="font-display text-xl font-bold">Backups & Cache</h2></header>

                <CachePurgeCard />
                <GoogleDriveBackupCard />

                <Card title="Export data" desc="CSV downloads. Admin only.">
                  <div className="flex flex-wrap gap-2">
                    {[ "leads", "orders", "profiles", "newsletter_subscribers", "affiliates", "finance_applications"].map((t) => (
                      <a key={t} href={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-csv?table=${t}`} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-2 rounded-lg border border-border hover:bg-primary hover:text-primary-foreground">
                        Export {t}.csv
                      </a>
                    ))}
                  </div>
                </Card>
              </section>

              {/* ADMINS */}
              <section id="sec-admins" className={paneCls("admins")}>
                <header><h2 className="font-display text-xl font-bold">Admins</h2></header>
                <Card title="Manage admin team" desc="Use Users & Roles for full RBAC.">
                  <a href="/admin/users" className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Open Users & Roles</a>
                </Card>
              </section>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Unsaved-changes bar */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
          <p className="text-sm text-muted-foreground">You have unsaved changes</p>
          <div className="flex gap-2">
            <button onClick={() => setData(original)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-muted">Discard</button>
            <button onClick={saveAll} disabled={saving} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground font-semibold flex items-center gap-2 disabled:opacity-60">
              <Save size={14} />{saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

// ---- Cache purge card ----
function CachePurgeCard() {
  const [busy, setBusy] = useState(false);
  const purge = async () => {
    setBusy(true);
    try {
      const at = await bumpGlobalCache();
      toast.success("Cache cleared. All visitors will fetch fresh data within 60s.");
    } catch (e: any) {
      toast.error(e?.message || "Could not clear cache");
    } finally { setBusy(false); }
  };
  return (
    <Card title="Website cache" desc="Force every browser to fetch fresh blog posts, packages and landing content.">
      <button onClick={purge} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        {busy ? "Clearing…" : "Clear website cache"}
      </button>
    </Card>
  );
}

function GoogleDriveBackupCard() {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [purging, setPurging] = useState(false);

  const load = async () => {
    try {
      const { data } = await supabase.from("backups_log" as any).select("*").order("created_at", { ascending: false }).limit(10);
      setRows((data as any[]) || []);
    } catch {
      setRows([]);
    }
  };

  useEffect(() => { load(); }, []);

  const run = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("backup-to-drive");
      if (error) throw error;
      toast.success("Backup uploaded to Google Drive");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Backup failed");
    } finally {
      setBusy(false);
    }
  };

  // Count first, then confirm against that count. The old flow deleted straight
  // from a generic confirm(), so nobody could see what was about to go.
  const handlePurge = async () => {
    setPurging(true);
    try {
      const { purgeAllMockData } = await import("@/lib/purgeMockData");
      const preview = await purgeAllMockData({ dryRun: true });
      if (!preview.success) { toast.error(preview.message); return; }
      if (preview.results.length === 0) { toast.success(preview.message); return; }

      const breakdown = preview.results.map((r) => `  • ${r.table}: ${r.count}`).join("\n");
      if (!confirm(`${preview.message}\n\n${breakdown}\n\nDelete these permanently? Customers, orders, leads and catalog items are never touched.`)) return;

      const res = await purgeAllMockData();
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    } catch (err: any) {
      toast.error(err.message || "Purge failed");
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Google Drive backups" desc="Full JSON snapshot of the database uploaded to the Tioga Drive account.">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button onClick={run} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <CloudUpload size={14} />}
            {busy ? "Backing up…" : "Backup now"}
          </button>
          <span className="text-xs text-muted-foreground">Uses the connected Google Drive account. Files land in the "Tioga Backups" folder.</span>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No backups yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm rounded-xl border border-border overflow-hidden">
            {rows.map((r) => (
              <li key={r.id} className="px-3 py-2.5 flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${r.status === "success" ? "bg-emerald-500" : "bg-destructive"}`} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{r.filename}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.tables_count || 0} tables · {r.size_bytes ? Math.round(r.size_bytes / 1024) + " KB" : "-"}</div>
                </div>
                {r.drive_web_link && (
                  <a href={r.drive_web_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1">Open <ExternalLink size={11} /></a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Remove QA test records" desc="Clears ERP documents whose reference number contains TEST — test invoices, work orders, RMAs, journal entries, serials.">
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-rose-500/5 rounded-2xl border border-rose-500/20">
          <div>
            <p className="text-sm font-bold text-foreground">Find and remove test documents</p>
            <p className="text-xs text-muted-foreground">
              Shows you exactly what it found before deleting anything. Customers, orders, leads, tickets and catalog items are never touched.
            </p>
          </div>
          <button
            onClick={handlePurge}
            disabled={purging}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:brightness-110 disabled:opacity-60"
          >
            {purging ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
            {purging ? "Checking…" : "Scan for test records"}
          </button>
        </div>
      </Card>
    </div>
  );
}

export default AdminSettings;
