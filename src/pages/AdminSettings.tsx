import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, Bell, UserPlus, Building2, Phone, Wallet, Share2, Search, Sparkles, Truck, ShieldCheck, CreditCard, Globe, Mail } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

interface GeneralSettings { hero_title: string; hero_subtitle: string; site_name: string; tagline: string; logo_url: string; favicon_url: string; default_language: string; default_currency: string; }
interface ContactSettings { phone: string; email: string; support_email: string; address: string; whatsapp: string; business_hours: string; }
interface NotificationPrefs { notify_email: string; notify_on_new_lead: boolean; notify_on_conversion: boolean; notify_on_order: boolean; notify_on_affiliate_application: boolean; notify_on_payout_request: boolean; notify_on_new_user: boolean; daily_digest: boolean; }
interface FinanceSettings { deposit_percent: number; plan_3_month_rate: number; plan_6_month_rate: number; plan_12_month_rate: number; min_finance_amount_ngn: number; max_finance_amount_ngn: number; late_fee_percent: number; finance_terms_url: string; }
interface SocialSettings { facebook: string; instagram: string; twitter: string; linkedin: string; tiktok: string; youtube: string; telegram: string; whatsapp_community: string; }
interface SeoSettings { meta_title: string; meta_description: string; og_image_url: string; google_analytics_id: string; meta_pixel_id: string; google_tag_manager_id: string; google_site_verification: string; robots_index: boolean; }
interface AffiliateSettings { default_commission_percent: number; min_payout_ngn: number; cookie_window_days: number; auto_approve_applications: boolean; payout_schedule: string; }
interface ShippingSettings { free_shipping_threshold_ngn: number; default_shipping_fee_ngn: number; delivery_eta_days: string; service_areas: string; pickup_address: string; }
interface SecuritySettings { require_email_verification: boolean; allow_guest_checkout: boolean; session_timeout_minutes: number; admin_ip_allowlist: string; }
interface PaymentSettings { paystack_public_key: string; bank_name: string; bank_account_name: string; bank_account_number: string; accept_bank_transfer: boolean; accept_card: boolean; accept_pay_on_delivery: boolean; }

const defaults = {
  general: { hero_title: "Reliable Power. Smarter Living.", hero_subtitle: "Solar, smart home, and security solutions for homes and businesses across Nigeria.", site_name: "Tioga Technologies", tagline: "Powering Nigerian homes and businesses", logo_url: "", favicon_url: "/favicon.ico", default_language: "en", default_currency: "NGN" } as GeneralSettings,
  contact: { phone: "+234 817 800 0023", email: "sales@tiogatechnologies.com", support_email: "support@tiogatechnologies.com", address: "Ikeja, Lagos, Nigeria", whatsapp: "+2348178000023", business_hours: "Mon-Sat 9am-6pm WAT" } as ContactSettings,
  notif: { notify_email: "sales@tiogatechnologies.com", notify_on_new_lead: true, notify_on_conversion: true, notify_on_order: true, notify_on_affiliate_application: true, notify_on_payout_request: true, notify_on_new_user: false, daily_digest: false } as NotificationPrefs,
  finance: { deposit_percent: 30, plan_3_month_rate: 23.3, plan_6_month_rate: 11.7, plan_12_month_rate: 5.8, min_finance_amount_ngn: 500000, max_finance_amount_ngn: 50000000, late_fee_percent: 0, finance_terms_url: "/finance" } as FinanceSettings,
  social: { facebook: "", instagram: "", twitter: "", linkedin: "", tiktok: "", youtube: "", telegram: "", whatsapp_community: "" } as SocialSettings,
  seo: { meta_title: "Tioga Technologies — Solar, Smart Home, Security in Nigeria", meta_description: "Reliable solar, smart home and security systems with flexible financing across Nigeria.", og_image_url: "", google_analytics_id: "", meta_pixel_id: "", google_tag_manager_id: "", google_site_verification: "", robots_index: true } as SeoSettings,
  affiliate: { default_commission_percent: 5, min_payout_ngn: 50000, cookie_window_days: 30, auto_approve_applications: false, payout_schedule: "monthly" } as AffiliateSettings,
  shipping: { free_shipping_threshold_ngn: 500000, default_shipping_fee_ngn: 6000, delivery_eta_days: "3-7", service_areas: "Lagos, Abuja, Port Harcourt, Ibadan", pickup_address: "Ikeja, Lagos" } as ShippingSettings,
  security: { require_email_verification: true, allow_guest_checkout: true, session_timeout_minutes: 60, admin_ip_allowlist: "" } as SecuritySettings,
  payment: { paystack_public_key: "", bank_name: "", bank_account_name: "Tioga Technologies", bank_account_number: "", accept_bank_transfer: true, accept_card: true, accept_pay_on_delivery: false } as PaymentSettings,
};

const inputClass = "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground";
const labelClass = "text-xs font-medium text-muted-foreground mb-1 block";

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div><label className={labelClass}>{label}</label>{children}{hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}</div>
);

const Section = ({ id, icon: Icon, title, desc, children }: { id: string; icon: React.ElementType; title: string; desc?: string; children: React.ReactNode }) => (
  <section id={id} className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5 scroll-mt-24">
    <div>
      <h2 className="font-display font-bold text-card-foreground flex items-center gap-2"><Icon size={18} /> {title}</h2>
      {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
    </div>
    {children}
  </section>
);

const TABS = [
  { id: "general", label: "General", icon: Building2 },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "payment", label: "Payments", icon: CreditCard },
  { id: "finance", label: "Financing", icon: Wallet },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "affiliate", label: "Affiliates", icon: Sparkles },
  { id: "notif", label: "Notifications", icon: Bell },
  { id: "seo", label: "SEO", icon: Search },
  { id: "social", label: "Social", icon: Share2 },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "admins", label: "Admins", icon: UserPlus },
];

const AdminSettings = () => {
  const [general, setGeneral] = useState(defaults.general);
  const [contact, setContact] = useState(defaults.contact);
  const [notif, setNotif] = useState(defaults.notif);
  const [finance, setFinance] = useState(defaults.finance);
  const [social, setSocial] = useState(defaults.social);
  const [seo, setSeo] = useState(defaults.seo);
  const [affiliate, setAffiliate] = useState(defaults.affiliate);
  const [shipping, setShipping] = useState(defaults.shipping);
  const [security, setSecurity] = useState(defaults.security);
  const [payment, setPayment] = useState(defaults.payment);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState("general");
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const keys = ["general", "contact", "notification_preferences", "finance", "social", "seo", "affiliate", "shipping", "security", "payment"];
      const { data } = await supabase.from("site_settings").select("key, value").in("key", keys);
      const map = new Map((data ?? []).map((r) => [r.key, r.value as Record<string, unknown>]));
      if (map.get("general")) setGeneral({ ...defaults.general, ...(map.get("general") as any) });
      if (map.get("contact")) setContact({ ...defaults.contact, ...(map.get("contact") as any) });
      if (map.get("notification_preferences")) setNotif({ ...defaults.notif, ...(map.get("notification_preferences") as any) });
      if (map.get("finance")) setFinance({ ...defaults.finance, ...(map.get("finance") as any) });
      if (map.get("social")) setSocial({ ...defaults.social, ...(map.get("social") as any) });
      if (map.get("seo")) setSeo({ ...defaults.seo, ...(map.get("seo") as any) });
      if (map.get("affiliate")) setAffiliate({ ...defaults.affiliate, ...(map.get("affiliate") as any) });
      if (map.get("shipping")) setShipping({ ...defaults.shipping, ...(map.get("shipping") as any) });
      if (map.get("security")) setSecurity({ ...defaults.security, ...(map.get("security") as any) });
      if (map.get("payment")) setPayment({ ...defaults.payment, ...(map.get("payment") as any) });
      setLoaded(true);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const rows = [
      { key: "general", value: general as any },
      { key: "contact", value: contact as any },
      { key: "notification_preferences", value: notif as any },
      { key: "finance", value: finance as any },
      { key: "social", value: social as any },
      { key: "seo", value: seo as any },
      { key: "affiliate", value: affiliate as any },
      { key: "shipping", value: shipping as any },
      { key: "security", value: security as any },
      { key: "payment", value: payment as any },
    ].map((r) => ({ ...r, updated_at: now }));
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) toast.error("Failed to save settings");
    else toast.success("Settings saved");
  };

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!loaded) return <AdminLayout><div className="text-center py-10 text-muted-foreground">Loading settings...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-5">
        {/* Section navigator */}
        <div ref={navRef} className="sticky top-[60px] z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/85 backdrop-blur-lg border-b border-border">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => scrollTo(t.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${active === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"}`}>
                  <Icon size={12} />{t.label}
                </button>
              );
            })}
          </div>
        </div>

        <Section id="general" icon={Building2} title="General" desc="Brand and homepage hero copy.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Site Name"><input className={inputClass} value={general.site_name} onChange={e => setGeneral({ ...general, site_name: e.target.value })} /></Field>
            <Field label="Tagline"><input className={inputClass} value={general.tagline} onChange={e => setGeneral({ ...general, tagline: e.target.value })} /></Field>
          </div>
          <Field label="Hero Title"><input className={inputClass} value={general.hero_title} onChange={e => setGeneral({ ...general, hero_title: e.target.value })} /></Field>
          <Field label="Hero Subtitle"><textarea className={`${inputClass} min-h-[60px] resize-none`} value={general.hero_subtitle} onChange={e => setGeneral({ ...general, hero_subtitle: e.target.value })} /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Logo URL"><input className={inputClass} value={general.logo_url} onChange={e => setGeneral({ ...general, logo_url: e.target.value })} placeholder="https://..." /></Field>
            <Field label="Favicon URL"><input className={inputClass} value={general.favicon_url} onChange={e => setGeneral({ ...general, favicon_url: e.target.value })} /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Default Language"><input className={inputClass} value={general.default_language} onChange={e => setGeneral({ ...general, default_language: e.target.value })} /></Field>
            <Field label="Default Currency"><input className={inputClass} value={general.default_currency} onChange={e => setGeneral({ ...general, default_currency: e.target.value })} /></Field>
          </div>
        </Section>

        <Section id="contact" icon={Phone} title="Contact" desc="Used in footer, contact page and lead notifications.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Sales Phone"><input className={inputClass} value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} /></Field>
            <Field label="WhatsApp Number" hint="Include country code"><input className={inputClass} value={contact.whatsapp} onChange={e => setContact({ ...contact, whatsapp: e.target.value })} /></Field>
            <Field label="Sales Email"><input className={inputClass} value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} /></Field>
            <Field label="Support Email"><input className={inputClass} value={contact.support_email} onChange={e => setContact({ ...contact, support_email: e.target.value })} /></Field>
          </div>
          <Field label="Office Address"><input className={inputClass} value={contact.address} onChange={e => setContact({ ...contact, address: e.target.value })} /></Field>
          <Field label="Business Hours"><input className={inputClass} value={contact.business_hours} onChange={e => setContact({ ...contact, business_hours: e.target.value })} /></Field>
        </Section>

        <Section id="payment" icon={CreditCard} title="Payments" desc="Bank transfer and payment gateway settings.">
          <div className="grid sm:grid-cols-3 gap-4">
            {([["accept_bank_transfer","Bank Transfer"],["accept_card","Card (Paystack)"],["accept_pay_on_delivery","Pay on Delivery"]] as const).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={payment[k] as boolean} onChange={e => setPayment({ ...payment, [k]: e.target.checked } as PaymentSettings)} />
                {label}
              </label>
            ))}
          </div>
          <Field label="Paystack Public Key" hint="The publishable key (starts with pk_). Secret keys are managed via Lovable secrets."><input className={inputClass} value={payment.paystack_public_key} onChange={e => setPayment({ ...payment, paystack_public_key: e.target.value })} placeholder="pk_live_..." /></Field>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Bank Name"><input className={inputClass} value={payment.bank_name} onChange={e => setPayment({ ...payment, bank_name: e.target.value })} /></Field>
            <Field label="Account Name"><input className={inputClass} value={payment.bank_account_name} onChange={e => setPayment({ ...payment, bank_account_name: e.target.value })} /></Field>
            <Field label="Account Number"><input className={inputClass} value={payment.bank_account_number} onChange={e => setPayment({ ...payment, bank_account_number: e.target.value })} /></Field>
          </div>
        </Section>

        <Section id="finance" icon={Wallet} title="Flexible Payments & Financing" desc="Controls the /finance page and quoted plans.">
          <Field label="Required Deposit (%)"><input type="number" className={inputClass} value={finance.deposit_percent} onChange={e => setFinance({ ...finance, deposit_percent: Number(e.target.value) })} /></Field>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="3-Month Rate (%/mo)"><input type="number" step="0.1" className={inputClass} value={finance.plan_3_month_rate} onChange={e => setFinance({ ...finance, plan_3_month_rate: Number(e.target.value) })} /></Field>
            <Field label="6-Month Rate (%/mo)"><input type="number" step="0.1" className={inputClass} value={finance.plan_6_month_rate} onChange={e => setFinance({ ...finance, plan_6_month_rate: Number(e.target.value) })} /></Field>
            <Field label="12-Month Rate (%/mo)"><input type="number" step="0.1" className={inputClass} value={finance.plan_12_month_rate} onChange={e => setFinance({ ...finance, plan_12_month_rate: Number(e.target.value) })} /></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Min Finance (₦)"><input type="number" className={inputClass} value={finance.min_finance_amount_ngn} onChange={e => setFinance({ ...finance, min_finance_amount_ngn: Number(e.target.value) })} /></Field>
            <Field label="Max Finance (₦)"><input type="number" className={inputClass} value={finance.max_finance_amount_ngn} onChange={e => setFinance({ ...finance, max_finance_amount_ngn: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Late Fee (%)"><input type="number" step="0.1" className={inputClass} value={finance.late_fee_percent} onChange={e => setFinance({ ...finance, late_fee_percent: Number(e.target.value) })} /></Field>
          <Field label="Terms URL"><input className={inputClass} value={finance.finance_terms_url} onChange={e => setFinance({ ...finance, finance_terms_url: e.target.value })} /></Field>
        </Section>

        <Section id="shipping" icon={Truck} title="Shipping & Delivery">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Default Shipping Fee (₦)"><input type="number" className={inputClass} value={shipping.default_shipping_fee_ngn} onChange={e => setShipping({ ...shipping, default_shipping_fee_ngn: Number(e.target.value) })} /></Field>
            <Field label="Free Shipping Above (₦)"><input type="number" className={inputClass} value={shipping.free_shipping_threshold_ngn} onChange={e => setShipping({ ...shipping, free_shipping_threshold_ngn: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Delivery ETA (days)"><input className={inputClass} value={shipping.delivery_eta_days} onChange={e => setShipping({ ...shipping, delivery_eta_days: e.target.value })} /></Field>
          <Field label="Service Areas"><input className={inputClass} value={shipping.service_areas} onChange={e => setShipping({ ...shipping, service_areas: e.target.value })} /></Field>
          <Field label="Pickup Address"><input className={inputClass} value={shipping.pickup_address} onChange={e => setShipping({ ...shipping, pickup_address: e.target.value })} /></Field>
        </Section>

        <Section id="affiliate" icon={Sparkles} title="Affiliate Program">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Default Commission (%)"><input type="number" step="0.1" className={inputClass} value={affiliate.default_commission_percent} onChange={e => setAffiliate({ ...affiliate, default_commission_percent: Number(e.target.value) })} /></Field>
            <Field label="Min Payout (₦)"><input type="number" className={inputClass} value={affiliate.min_payout_ngn} onChange={e => setAffiliate({ ...affiliate, min_payout_ngn: Number(e.target.value) })} /></Field>
            <Field label="Attribution Window (days)"><input type="number" className={inputClass} value={affiliate.cookie_window_days} onChange={e => setAffiliate({ ...affiliate, cookie_window_days: Number(e.target.value) })} /></Field>
            <Field label="Payout Schedule">
              <select className={inputClass} value={affiliate.payout_schedule} onChange={e => setAffiliate({ ...affiliate, payout_schedule: e.target.value })}>
                <option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option><option value="monthly">Monthly</option>
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-3 cursor-pointer text-sm">
            <input type="checkbox" checked={affiliate.auto_approve_applications} onChange={e => setAffiliate({ ...affiliate, auto_approve_applications: e.target.checked })} />
            Auto-approve affiliate applications
          </label>
        </Section>

        <Section id="notif" icon={Bell} title="Notifications">
          <Field label="Notification Email"><input className={inputClass} value={notif.notify_email} onChange={e => setNotif({ ...notif, notify_email: e.target.value })} /></Field>
          <div className="space-y-2">
            {([
              ["notify_on_new_lead", "New lead submitted"],
              ["notify_on_conversion", "Lead converted"],
              ["notify_on_order", "New order placed"],
              ["notify_on_new_user", "New user signup"],
              ["notify_on_affiliate_application", "Affiliate application"],
              ["notify_on_payout_request", "Payout request"],
              ["daily_digest", "Daily digest summary"],
            ] as const).map(([k, label]) => (
              <label key={k} className="flex items-center gap-3 cursor-pointer text-sm">
                <input type="checkbox" checked={notif[k as keyof NotificationPrefs] as boolean} onChange={e => setNotif({ ...notif, [k]: e.target.checked } as NotificationPrefs)} />
                {label}
              </label>
            ))}
          </div>
        </Section>

        <Section id="seo" icon={Search} title="SEO & Analytics">
          <Field label="Default Meta Title"><input className={inputClass} value={seo.meta_title} onChange={e => setSeo({ ...seo, meta_title: e.target.value })} /></Field>
          <Field label="Default Meta Description"><textarea className={`${inputClass} min-h-[60px] resize-none`} value={seo.meta_description} onChange={e => setSeo({ ...seo, meta_description: e.target.value })} /></Field>
          <Field label="Open Graph Image URL"><input className={inputClass} value={seo.og_image_url} onChange={e => setSeo({ ...seo, og_image_url: e.target.value })} /></Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Google Analytics ID" hint="G-XXXXXXX"><input className={inputClass} value={seo.google_analytics_id} onChange={e => setSeo({ ...seo, google_analytics_id: e.target.value })} /></Field>
            <Field label="Google Tag Manager"><input className={inputClass} value={seo.google_tag_manager_id} onChange={e => setSeo({ ...seo, google_tag_manager_id: e.target.value })} placeholder="GTM-XXXXXX" /></Field>
            <Field label="Meta Pixel ID"><input className={inputClass} value={seo.meta_pixel_id} onChange={e => setSeo({ ...seo, meta_pixel_id: e.target.value })} /></Field>
            <Field label="Google Site Verification"><input className={inputClass} value={seo.google_site_verification} onChange={e => setSeo({ ...seo, google_site_verification: e.target.value })} /></Field>
          </div>
          <label className="flex items-center gap-3 cursor-pointer text-sm">
            <input type="checkbox" checked={seo.robots_index} onChange={e => setSeo({ ...seo, robots_index: e.target.checked })} />
            Allow search engines to index the site
          </label>
        </Section>

        <Section id="social" icon={Share2} title="Social Media">
          <div className="grid sm:grid-cols-2 gap-4">
            {(["facebook","instagram","twitter","linkedin","tiktok","youtube","telegram","whatsapp_community"] as const).map((k) => (
              <Field key={k} label={k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + " URL"}>
                <input className={inputClass} value={social[k]} onChange={e => setSocial({ ...social, [k]: e.target.value })} placeholder={`https://${k.split("_")[0]}.com/...`} />
              </Field>
            ))}
          </div>
        </Section>

        <Section id="security" icon={ShieldCheck} title="Security & Access">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={security.require_email_verification} onChange={e => setSecurity({ ...security, require_email_verification: e.target.checked })} />
              Require email verification on signup
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={security.allow_guest_checkout} onChange={e => setSecurity({ ...security, allow_guest_checkout: e.target.checked })} />
              Allow guest checkout
            </label>
          </div>
          <Field label="Session Timeout (minutes)"><input type="number" className={inputClass} value={security.session_timeout_minutes} onChange={e => setSecurity({ ...security, session_timeout_minutes: Number(e.target.value) })} /></Field>
          <Field label="Admin IP Allowlist" hint="Comma-separated IPs allowed to access admin (leave empty to allow all)"><input className={inputClass} value={security.admin_ip_allowlist} onChange={e => setSecurity({ ...security, admin_ip_allowlist: e.target.value })} /></Field>
        </Section>

        <Section id="admins" icon={UserPlus} title="Admin Accounts" desc="Create a new admin account or promote an existing user.">
          <CreateAdminCard />
        </Section>

        <div className="sticky bottom-4 flex justify-end">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40 shadow-lg">
            <Save size={16} />{saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

const CreateAdminCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!email || password.length < 8) { toast.error("Email and password (min 8 chars) required"); return; }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("create-admin", { body: { email, password } });
    setCreating(false);
    if (error || (data as any)?.error) { toast.error(((data as any)?.error || error?.message) ?? "Failed"); return; }
    toast.success((data as any)?.message ?? "Admin created");
    setEmail(""); setPassword("");
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="Email"><input className={inputClass} value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" /></Field>
      <Field label="Password" hint="Min 8 characters"><input type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} /></Field>
      <div className="sm:col-span-2">
        <button onClick={handleCreate} disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-secondary text-secondary-foreground px-4 py-2.5 text-sm font-semibold hover:brightness-110 disabled:opacity-40">
          <UserPlus size={14} />{creating ? "Creating..." : "Create / Promote Admin"}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
