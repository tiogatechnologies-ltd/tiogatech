import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { invalidateLandingCache } from "@/hooks/useLandingContent";

// Static-page hero CMS. Each page reads from `landing_content` table by section_key.
const PAGES: { key: string; label: string; defaults: { eyebrow?: string; title?: string; subtitle?: string } }[] = [
  { key: "page_about", label: "About", defaults: { eyebrow: "About Tioga Technologies", title: "Powering Africa's clean energy transition", subtitle: "Tioga Technologies Ltd is an IoT infrastructure and embedded systems company building the intelligent backbone of Africa's renewable energy future." } },
  { key: "page_voltai", label: "VoltAi", defaults: { eyebrow: "A Tioga Sub-brand · Smart Automation", title: "VoltAi — your home, intelligently automated", subtitle: "Locks, lights, cameras and sensors orchestrated through one app. Built to work seamlessly with LumiVolt solar." } },
  { key: "page_lumivolt", label: "LumiVolt", defaults: { eyebrow: "A Tioga Sub-brand · Residential", title: "LumiVolt — Solar that powers your home, day and night", subtitle: "Rooftop solar, lithium batteries and hybrid inverters engineered for Nigerian homes." } },
  { key: "page_finance", label: "Finance", defaults: { eyebrow: "Finance", title: "Flexible payment plans that work for you", subtitle: "Start your energy journey with just 30% down. Spread the rest over 3, 6, or 12 months with zero hidden fees." } },
  { key: "page_contact", label: "Contact", defaults: { eyebrow: "Contact", title: "Talk to a Tioga expert", subtitle: "We are here to help you choose the right solar, smart lock or automation system." } },
  { key: "page_career", label: "Careers", defaults: { eyebrow: "Careers", title: "Build with the team powering Nigeria.", subtitle: "We are a small, deeply technical team. We hire engineers, installers and operators who care about craft." } },
  { key: "page_coming_soon", label: "Coming Soon", defaults: { eyebrow: "Coming Soon", title: "Something exciting is on the way", subtitle: "Our store experience is being polished. Leave your details and we will let you know the moment it launches." } },
];

const AdminContent = () => {
  const [active, setActive] = useState(PAGES[0].key);
  const [content, setContent] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("landing_content").select("*").in("section_key", PAGES.map((p) => p.key));
      const map: Record<string, any> = {};
      (data ?? []).forEach((row: any) => { map[row.section_key] = row.content; });
      setContent(map);
      setLoading(false);
    })();
  }, []);

  const current = PAGES.find((p) => p.key === active)!;
  const data = { ...current.defaults, ...(content[active] || {}) };

  const update = (field: string, value: string) => {
    setContent((c) => ({ ...c, [active]: { ...(c[active] || {}), [field]: value } }));
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("landing_content").upsert({
      section_key: active,
      content: content[active] || {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "section_key" });
    if (error) toast.error("Failed to save");
    else { toast.success(`${current.label} saved`); invalidateLandingCache(); }
    setSaving(false);
  };

  const input = "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground";

  if (loading) return <AdminLayout><div className="text-center py-10 text-muted-foreground">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-3xl">
        <p className="text-sm text-muted-foreground">Edit hero copy on each static page. Leave a field blank to use the default.</p>

        <div className="flex flex-wrap gap-2">
          {PAGES.map((p) => (
            <button
              key={p.key}
              onClick={() => setActive(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${active === p.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >{p.label}</button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Eyebrow</label>
            <input className={input} value={data.eyebrow || ""} onChange={(e) => update("eyebrow", e.target.value)} placeholder={current.defaults.eyebrow} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
            <input className={input} value={data.title || ""} onChange={(e) => update("title", e.target.value)} placeholder={current.defaults.title} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Subtitle</label>
            <textarea className={`${input} min-h-[80px] resize-none`} value={data.subtitle || ""} onChange={(e) => update("subtitle", e.target.value)} placeholder={current.defaults.subtitle} />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Page"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContent;
