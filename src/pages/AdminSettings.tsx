import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, Bell, UserPlus } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

interface SiteSettings {
  hero_title: string;
  hero_subtitle: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
}

interface NotificationPrefs {
  notify_email: string;
  notify_on_new_lead: boolean;
  notify_on_conversion: boolean;
}

const defaultSettings: SiteSettings = {
  hero_title: "Reliable Power. Smarter Living.",
  hero_subtitle: "Solar, smart home, and security solutions for homes and businesses across Nigeria.",
  phone: "+234 817 800 0023",
  email: "sales@tiogatechnologies.com",
  address: "Ikeja, Lagos, Nigeria",
  whatsapp: "+2348178000023",
};

const defaultNotifPrefs: NotificationPrefs = {
  notify_email: "sales@tiogatechnologies.com",
  notify_on_new_lead: true,
  notify_on_conversion: true,
};

const AdminSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(defaultNotifPrefs);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const [generalRes, notifRes] = await Promise.all([
        supabase.from("site_settings").select("*").eq("key", "general").single(),
        supabase.from("site_settings").select("*").eq("key", "notification_preferences").single(),
      ]);
      if (generalRes.data?.value) {
        setSettings({ ...defaultSettings, ...(generalRes.data.value as Record<string, string>) });
      }
      if (notifRes.data?.value) {
        setNotifPrefs({ ...defaultNotifPrefs, ...(notifRes.data.value as unknown as NotificationPrefs) });
      }
      setLoaded(true);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const [r1, r2] = await Promise.all([
      supabase.from("site_settings").upsert({ key: "general", value: settings as unknown as Record<string, string>, updated_at: now }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "notification_preferences", value: notifPrefs as unknown as Record<string, string>, updated_at: now }, { onConflict: "key" }),
    ]);

    if (r1.error || r2.error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved");
    }
    setSaving(false);
  };

  const inputClass = "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground";

  if (!loaded) {
    return <AdminLayout><div className="text-center py-10 text-muted-foreground">Loading settings...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="max-w-xl space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
          <h2 className="font-display font-bold text-card-foreground">Hero Section</h2>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
            <input className={inputClass} value={settings.hero_title} onChange={e => setSettings({ ...settings, hero_title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Subtitle</label>
            <textarea className={`${inputClass} min-h-[60px] resize-none`} value={settings.hero_subtitle} onChange={e => setSettings({ ...settings, hero_subtitle: e.target.value })} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
          <h2 className="font-display font-bold text-card-foreground">Contact Information</h2>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
            <input className={inputClass} value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <input className={inputClass} value={settings.email} onChange={e => setSettings({ ...settings, email: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Address</label>
            <input className={inputClass} value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">WhatsApp Number (with country code)</label>
            <input className={inputClass} value={settings.whatsapp} onChange={e => setSettings({ ...settings, whatsapp: e.target.value })} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
          <h2 className="font-display font-bold text-card-foreground flex items-center gap-2"><Bell size={18} /> Notification Preferences</h2>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notification Email</label>
            <input className={inputClass} value={notifPrefs.notify_email} onChange={e => setNotifPrefs({ ...notifPrefs, notify_email: e.target.value })} placeholder="email@example.com" />
            <p className="text-[10px] text-muted-foreground mt-1">Email address that receives lead notifications</p>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={notifPrefs.notify_on_new_lead}
                onChange={e => setNotifPrefs({ ...notifPrefs, notify_on_new_lead: e.target.checked })}
                className="rounded border-border" />
              <span className="text-sm text-card-foreground">Notify on new lead</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={notifPrefs.notify_on_conversion}
                onChange={e => setNotifPrefs({ ...notifPrefs, notify_on_conversion: e.target.checked })}
                className="rounded border-border" />
              <span className="text-sm text-card-foreground">Notify on conversion</span>
            </label>
          </div>
        </div>

        <CreateAdminCard />

        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40">
          <Save size={16} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </AdminLayout>
  );
};

const CreateAdminCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const inputClass = "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground";

  const handleCreate = async () => {
    if (!email || password.length < 8) {
      toast.error("Email and password (min 8 chars) required");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("create-admin", { body: { email, password } });
    setCreating(false);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Failed to create admin");
      return;
    }
    toast.success(`Admin ${email} created`);
    setEmail("");
    setPassword("");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
      <h2 className="font-display font-bold text-card-foreground flex items-center gap-2"><UserPlus size={18} /> Create New Admin</h2>
      <p className="text-xs text-muted-foreground">Add another administrator by setting their login email and password manually. They can sign in immediately at /admin/login.</p>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
        <input className={inputClass} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="newadmin@tiogatechnologies.com" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Password (min 8 chars)</label>
        <input className={inputClass} type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Strong password" />
      </div>
      <button onClick={handleCreate} disabled={creating}
        className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90 transition-all disabled:opacity-40">
        <UserPlus size={14} />
        {creating ? "Creating..." : "Create Admin Account"}
      </button>
    </div>
  );
};


export default AdminSettings;
