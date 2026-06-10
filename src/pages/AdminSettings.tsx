import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, Bell, UserPlus, Building2, Phone, Wallet, Share2, Search, Shield, Sparkles, Truck } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface GeneralSettings {
  hero_title: string;
  hero_subtitle: string;
  site_name: string;
  tagline: string;
}

interface ContactSettings {
  phone: string;
  email: string;
  support_email: string;
  address: string;
  whatsapp: string;
  business_hours: string;
}

interface NotificationPrefs {
  notify_email: string;
  notify_on_new_lead: boolean;
  notify_on_conversion: boolean;
  notify_on_order: boolean;
  notify_on_affiliate_application: boolean;
  notify_on_payout_request: boolean;
}

interface FinanceSettings {
  deposit_percent: number;
  plan_3_month_rate: number;
  plan_6_month_rate: number;
  plan_12_month_rate: number;
  min_finance_amount_ngn: number;
  max_finance_amount_ngn: number;
  late_fee_percent: number;
  finance_terms_url: string;
}

interface SocialSettings {
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  tiktok: string;
  youtube: string;
  telegram: string;
}

interface SeoSettings {
  meta_title: string;
  meta_description: string;
  og_image_url: string;
  google_analytics_id: string;
  meta_pixel_id: string;
}

interface AffiliateSettings {
  default_commission_percent: number;
  min_payout_ngn: number;
  cookie_window_days: number;
  auto_approve_applications: boolean;
}

interface ShippingSettings {
  free_shipping_threshold_ngn: number;
  default_shipping_fee_ngn: number;
  delivery_eta_days: string;
  service_areas: string;
}

const defaults = {
  general: { hero_title: "Reliable Power. Smarter Living.", hero_subtitle: "Solar, smart home, and security solutions for homes and businesses across Nigeria.", site_name: "Tioga Technologies", tagline: "Powering Nigerian homes and businesses" } as GeneralSettings,
  contact: { phone: "+234 817 800 0023", email: "sales@tiogatechnologies.com", support_email: "support@tiogatechnologies.com", address: "Ikeja, Lagos, Nigeria", whatsapp: "+2348178000023", business_hours: "Mon-Sat 9am-6pm WAT" } as ContactSettings,
  notif: { notify_email: "sales@tiogatechnologies.com", notify_on_new_lead: true, notify_on_conversion: true, notify_on_order: true, notify_on_affiliate_application: true, notify_on_payout_request: true } as NotificationPrefs,
  finance: { deposit_percent: 30, plan_3_month_rate: 23.3, plan_6_month_rate: 11.7, plan_12_month_rate: 5.8, min_finance_amount_ngn: 500000, max_finance_amount_ngn: 50000000, late_fee_percent: 0, finance_terms_url: "/finance" } as FinanceSettings,
  social: { facebook: "", instagram: "", twitter: "", linkedin: "", tiktok: "", youtube: "", telegram: "" } as SocialSettings,
  seo: { meta_title: "Tioga Technologies — Solar, Smart Home, Security in Nigeria", meta_description: "Reliable solar, smart home and security systems with flexible financing across Nigeria.", og_image_url: "", google_analytics_id: "", meta_pixel_id: "" } as SeoSettings,
  affiliate: { default_commission_percent: 5, min_payout_ngn: 50000, cookie_window_days: 30, auto_approve_applications: false } as AffiliateSettings,
  shipping: { free_shipping_threshold_ngn: 1000000, default_shipping_fee_ngn: 15000, delivery_eta_days: "3-7", service_areas: "Lagos, Abuja, Port Harcourt, Ibadan" } as ShippingSettings,
};

const inputClass = "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground";
const labelClass = "text-xs font-medium text-muted-foreground mb-1 block";

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {children}
    {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
  </div>
);

const Section = ({ icon: Icon, title, desc, children }: { icon: React.ElementType; title: string; desc?: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
    <div>
      <h2 className="font-display font-bold text-card-foreground flex items-center gap-2"><Icon size={18} /> {title}</h2>
      {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
    </div>
    {children}
  </div>
);

const AdminSettings = () => {
  const [general, setGeneral] = useState(defaults.general);
  const [contact, setContact] = useState(defaults.contact);
  const [notif, setNotif] = useState(defaults.notif);
  const [finance, setFinance] = useState(defaults.finance);
  const [social, setSocial] = useState(defaults.social);
  const [seo, setSeo] = useState(defaults.seo);
  const [affiliate, setAffiliate] = useState(defaults.affiliate);
  const [shipping, setShipping] = useState(defaults.shipping);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const keys = ["general", "contact", "notification_preferences", "finance", "social", "seo", "affiliate", "shipping"];
      const { data } = await supabase.from("site_settings").select("key, value").in("key", keys);
      const map = new Map((data ?? []).map((r) => [r.key, r.value as Record<string, unknown>]));
      if (map.get("general")) setGeneral({ ...defaults.general, ...(map.get("general") as Partial<GeneralSettings>) });
      if (map.get("contact")) setContact({ ...defaults.contact, ...(map.get("contact") as Partial<ContactSettings>) });
      if (map.get("notification_preferences")) setNotif({ ...defaults.notif, ...(map.get("notification_preferences") as Partial<NotificationPrefs>) });
      if (map.get("finance")) setFinance({ ...defaults.finance, ...(map.get("finance") as Partial<FinanceSettings>) });
      if (map.get("social")) setSocial({ ...defaults.social, ...(map.get("social") as Partial<SocialSettings>) });
      if (map.get("seo")) setSeo({ ...defaults.seo, ...(map.get("seo") as Partial<SeoSettings>) });
      if (map.get("affiliate")) setAffiliate({ ...defaults.affiliate, ...(map.get("affiliate") as Partial<AffiliateSettings>) });
      if (map.get("shipping")) setShipping({ ...defaults.shipping, ...(map.get("shipping") as Partial<ShippingSettings>) });
      // Back-compat: previous "general" combined hero + contact
      if (map.get("general")) {
        const g = map.get("general") as Record<string, string>;
        setContact((c) => ({ ...c, phone: g.phone ?? c.phone, email: g.email ?? c.email, address: g.address ?? c.address, whatsapp: g.whatsapp ?? c.whatsapp }));
      }
      setLoaded(true);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const rows = [
      { key: "general", value: general as unknown as Record<string, string> },
      { key: "contact", value: contact as unknown as Record<string, string> },
      { key: "notification_preferences", value: notif as unknown as Record<string, string> },
      { key: "finance", value: finance as unknown as Record<string, string> },
      { key: "social", value: social as unknown as Record<string, string> },
      { key: "seo", value: seo as unknown as Record<string, string> },
      { key: "affiliate", value: affiliate as unknown as Record<string, string> },
      { key: "shipping", value: shipping as unknown as Record<string, string> },
    ].map((r) => ({ ...r, updated_at: now }));
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) toast.error("Failed to save settings");
    else toast.success("Settings saved");
  };

  if (!loaded) {
    return <AdminLayout><div className="text-center py-10 text-muted-foreground">Loading settings...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="general"><Building2 size={14} className="mr-1.5" />General</TabsTrigger>
            <TabsTrigger value="contact"><Phone size={14} className="mr-1.5" />Contact</TabsTrigger>
            <TabsTrigger value="finance"><Wallet size={14} className="mr-1.5" />Finance</TabsTrigger>
            <TabsTrigger value="shipping"><Truck size={14} className="mr-1.5" />Shipping</TabsTrigger>
            <TabsTrigger value="affiliate"><Sparkles size={14} className="mr-1.5" />Affiliates</TabsTrigger>
            <TabsTrigger value="notifications"><Bell size={14} className="mr-1.5" />Notifications</TabsTrigger>
            <TabsTrigger value="seo"><Search size={14} className="mr-1.5" />SEO</TabsTrigger>
            <TabsTrigger value="social"><Share2 size={14} className="mr-1.5" />Social</TabsTrigger>
            <TabsTrigger value="admins"><Shield size={14} className="mr-1.5" />Admins</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-5 space-y-6">
            <Section icon={Building2} title="Brand & Hero" desc="Headline copy that appears on the homepage hero.">
              <Field label="Site Name"><input className={inputClass} value={general.site_name} onChange={e => setGeneral({ ...general, site_name: e.target.value })} /></Field>
              <Field label="Tagline"><input className={inputClass} value={general.tagline} onChange={e => setGeneral({ ...general, tagline: e.target.value })} /></Field>
              <Field label="Hero Title"><input className={inputClass} value={general.hero_title} onChange={e => setGeneral({ ...general, hero_title: e.target.value })} /></Field>
              <Field label="Hero Subtitle"><textarea className={`${inputClass} min-h-[60px] resize-none`} value={general.hero_subtitle} onChange={e => setGeneral({ ...general, hero_subtitle: e.target.value })} /></Field>
            </Section>
          </TabsContent>

          <TabsContent value="contact" className="mt-5 space-y-6">
            <Section icon={Phone} title="Contact Information" desc="Used in the footer, contact page and lead notifications.">
              <Field label="Sales Phone"><input className={inputClass} value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} /></Field>
              <Field label="Sales Email"><input className={inputClass} value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} /></Field>
              <Field label="Support Email"><input className={inputClass} value={contact.support_email} onChange={e => setContact({ ...contact, support_email: e.target.value })} /></Field>
              <Field label="WhatsApp Number" hint="Include country code, e.g. +2348178000023"><input className={inputClass} value={contact.whatsapp} onChange={e => setContact({ ...contact, whatsapp: e.target.value })} /></Field>
              <Field label="Office Address"><input className={inputClass} value={contact.address} onChange={e => setContact({ ...contact, address: e.target.value })} /></Field>
              <Field label="Business Hours"><input className={inputClass} value={contact.business_hours} onChange={e => setContact({ ...contact, business_hours: e.target.value })} /></Field>
            </Section>
          </TabsContent>

          <TabsContent value="finance" className="mt-5 space-y-6">
            <Section icon={Wallet} title="Flexible Payments & Financing" desc="Controls the plans shown on /finance and used when generating quotes.">
              <Field label="Required Deposit (%)" hint="Customer pays this upfront to start installation."><input type="number" className={inputClass} value={finance.deposit_percent} onChange={e => setFinance({ ...finance, deposit_percent: Number(e.target.value) })} /></Field>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="3-Month Plan Rate (%/mo)"><input type="number" step="0.1" className={inputClass} value={finance.plan_3_month_rate} onChange={e => setFinance({ ...finance, plan_3_month_rate: Number(e.target.value) })} /></Field>
                <Field label="6-Month Plan Rate (%/mo)"><input type="number" step="0.1" className={inputClass} value={finance.plan_6_month_rate} onChange={e => setFinance({ ...finance, plan_6_month_rate: Number(e.target.value) })} /></Field>
                <Field label="12-Month Plan Rate (%/mo)"><input type="number" step="0.1" className={inputClass} value={finance.plan_12_month_rate} onChange={e => setFinance({ ...finance, plan_12_month_rate: Number(e.target.value) })} /></Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Min Finance Amount (₦)"><input type="number" className={inputClass} value={finance.min_finance_amount_ngn} onChange={e => setFinance({ ...finance, min_finance_amount_ngn: Number(e.target.value) })} /></Field>
                <Field label="Max Finance Amount (₦)"><input type="number" className={inputClass} value={finance.max_finance_amount_ngn} onChange={e => setFinance({ ...finance, max_finance_amount_ngn: Number(e.target.value) })} /></Field>
              </div>
              <Field label="Late Fee (%)"><input type="number" step="0.1" className={inputClass} value={finance.late_fee_percent} onChange={e => setFinance({ ...finance, late_fee_percent: Number(e.target.value) })} /></Field>
              <Field label="Terms & Conditions URL"><input className={inputClass} value={finance.finance_terms_url} onChange={e => setFinance({ ...finance, finance_terms_url: e.target.value })} /></Field>
            </Section>
          </TabsContent>

          <TabsContent value="shipping" className="mt-5 space-y-6">
            <Section icon={Truck} title="Shipping & Delivery" desc="Used by the catalog checkout and order summary.">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Default Shipping Fee (₦)"><input type="number" className={inputClass} value={shipping.default_shipping_fee_ngn} onChange={e => setShipping({ ...shipping, default_shipping_fee_ngn: Number(e.target.value) })} /></Field>
                <Field label="Free Shipping Above (₦)"><input type="number" className={inputClass} value={shipping.free_shipping_threshold_ngn} onChange={e => setShipping({ ...shipping, free_shipping_threshold_ngn: Number(e.target.value) })} /></Field>
              </div>
              <Field label="Delivery ETA (days)"><input className={inputClass} value={shipping.delivery_eta_days} onChange={e => setShipping({ ...shipping, delivery_eta_days: e.target.value })} /></Field>
              <Field label="Service Areas" hint="Comma separated cities/states we deliver to."><input className={inputClass} value={shipping.service_areas} onChange={e => setShipping({ ...shipping, service_areas: e.target.value })} /></Field>
            </Section>
          </TabsContent>

          <TabsContent value="affiliate" className="mt-5 space-y-6">
            <Section icon={Sparkles} title="Affiliate Program" desc="Defaults applied to new affiliates and payouts.">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Default Commission (%)"><input type="number" step="0.1" className={inputClass} value={affiliate.default_commission_percent} onChange={e => setAffiliate({ ...affiliate, default_commission_percent: Number(e.target.value) })} /></Field>
                <Field label="Minimum Payout (₦)"><input type="number" className={inputClass} value={affiliate.min_payout_ngn} onChange={e => setAffiliate({ ...affiliate, min_payout_ngn: Number(e.target.value) })} /></Field>
              </div>
              <Field label="Attribution Window (days)"><input type="number" className={inputClass} value={affiliate.cookie_window_days} onChange={e => setAffiliate({ ...affiliate, cookie_window_days: Number(e.target.value) })} /></Field>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={affiliate.auto_approve_applications} onChange={e => setAffiliate({ ...affiliate, auto_approve_applications: e.target.checked })} className="rounded border-border" />
                <span className="text-sm text-card-foreground">Auto-approve affiliate applications</span>
              </label>
            </Section>
          </TabsContent>

          <TabsContent value="notifications" className="mt-5 space-y-6">
            <Section icon={Bell} title="Notification Preferences" desc="Choose which events email the team.">
              <Field label="Notification Email" hint="All selected alerts are sent here."><input className={inputClass} value={notif.notify_email} onChange={e => setNotif({ ...notif, notify_email: e.target.value })} /></Field>
              <div className="space-y-3">
                {[
                  ["notify_on_new_lead", "New lead submitted"],
                  ["notify_on_conversion", "Lead converted (won)"],
                  ["notify_on_order", "New order placed"],
                  ["notify_on_affiliate_application", "Affiliate application received"],
                  ["notify_on_payout_request", "Affiliate payout request"],
                ].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={notif[k as keyof NotificationPrefs] as boolean}
                      onChange={e => setNotif({ ...notif, [k]: e.target.checked } as NotificationPrefs)}
                      className="rounded border-border" />
                    <span className="text-sm text-card-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="seo" className="mt-5 space-y-6">
            <Section icon={Search} title="SEO & Analytics" desc="Default meta tags and tracking identifiers.">
              <Field label="Default Meta Title"><input className={inputClass} value={seo.meta_title} onChange={e => setSeo({ ...seo, meta_title: e.target.value })} /></Field>
              <Field label="Default Meta Description"><textarea className={`${inputClass} min-h-[60px] resize-none`} value={seo.meta_description} onChange={e => setSeo({ ...seo, meta_description: e.target.value })} /></Field>
              <Field label="Open Graph Image URL"><input className={inputClass} value={seo.og_image_url} onChange={e => setSeo({ ...seo, og_image_url: e.target.value })} /></Field>
              <Field label="Google Analytics ID" hint="e.g. G-XXXXXXX"><input className={inputClass} value={seo.google_analytics_id} onChange={e => setSeo({ ...seo, google_analytics_id: e.target.value })} /></Field>
              <Field label="Meta Pixel ID"><input className={inputClass} value={seo.meta_pixel_id} onChange={e => setSeo({ ...seo, meta_pixel_id: e.target.value })} /></Field>
            </Section>
          </TabsContent>

          <TabsContent value="social" className="mt-5 space-y-6">
            <Section icon={Share2} title="Social Media" desc="Shown in the footer and on contact pages.">
              {(["facebook","instagram","twitter","linkedin","tiktok","youtube","telegram"] as const).map((k) => (
                <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1) + " URL"}>
                  <input className={inputClass} value={social[k]} onChange={e => setSocial({ ...social, [k]: e.target.value })} placeholder={`https://${k}.com/...`} />
                </Field>
              ))}
            </Section>
          </TabsContent>

          <TabsContent value="admins" className="mt-5 space-y-6">
            <CreateAdminCard />
          </TabsContent>
        </Tabs>

        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40">
          <Save size={16} />
          {saving ? "Saving..." : "Save All Settings"}
        </button>
      </div>
    </AdminLayout>
  );
};

const CreateAdminCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!email || password.length < 8) {
      toast.error("Email and password (min 8 chars) required");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("create-admin", { body: { email, password } });
    setCreating(false);
    const payload = data as { error?: string; promoted?: boolean; message?: string } | null;
    if (error || payload?.error) {
      toast.error(payload?.error ?? error?.message ?? "Failed to create admin");
      return;
    }
    toast.success(payload?.message ?? `Admin ${email} ready`);
    setEmail("");
    setPassword("");
  };

  return (
    <Section icon={UserPlus} title="Create New Admin" desc="Add another administrator by setting their login email and password manually. They can sign in immediately at /admin/login.">
      <Field label="Email"><input className={inputClass} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="newadmin@tiogatechnologies.com" /></Field>
      <Field label="Password (min 8 chars)"><input className={inputClass} type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Strong password" /></Field>
      <button onClick={handleCreate} disabled={creating}
        className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90 transition-all disabled:opacity-40">
        <UserPlus size={14} />
        {creating ? "Creating..." : "Create Admin Account"}
      </button>
    </Section>
  );
};

export default AdminSettings;
