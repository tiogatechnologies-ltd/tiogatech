import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save } from "lucide-react";
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

const defaultSettings: SiteSettings = {
  hero_title: "Reliable Power. Smarter Living.",
  hero_subtitle: "Solar, smart home, and security solutions for homes and businesses across Nigeria.",
  phone: "+234 817 800 0023",
  email: "sales@tiogatechnologies.com",
  address: "Ikeja, Lagos, Nigeria",
  whatsapp: "+2348178000023",
};

const AdminSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("key", "general").single();
      if (data?.value) {
        setSettings({ ...defaultSettings, ...(data.value as Record<string, string>) });
      }
      setLoaded(true);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert({
      key: "general",
      value: settings as unknown as Record<string, string>,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });

    if (error) {
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
            <input className={inputClass} value={settings.hero_title} onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Subtitle</label>
            <textarea className={`${inputClass} min-h-[60px] resize-none`} value={settings.hero_subtitle} onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
          <h2 className="font-display font-bold text-card-foreground">Contact Information</h2>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
            <input className={inputClass} value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <input className={inputClass} value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Address</label>
            <input className={inputClass} value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">WhatsApp Number (with country code)</label>
            <input className={inputClass} value={settings.whatsapp} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })} />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
