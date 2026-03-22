import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { invalidateLandingCache } from "@/hooks/useLandingContent";

interface SectionData {
  section_key: string;
  content: any;
  id?: string;
}

const sectionLabels: Record<string, string> = {
  problems: "Problem Section",
  solution: "Solution Section",
  offers: "What We Offer",
  stats: "Stats Bar",
  how_it_works: "How It Works",
  faq: "FAQ Section",
  trust: "Why Tioga / Trust",
  target_users: "Who We Serve",
};

const defaultContent: Record<string, any> = {
  problems: {
    heading: "Sound familiar?",
    subtitle: "Millions of Nigerians deal with these challenges daily.",
    items: [
      { title: "Unreliable Electricity", desc: "Nigeria averages just 4–6 hours of grid power daily." },
      { title: "Skyrocketing Fuel Costs", desc: "Many homes spend ₦50,000–₦200,000+ monthly on fuel." },
      { title: "Outdated Security", desc: "Traditional locks won't stop modern threats." },
      { title: "Wasted Productivity", desc: "Every outage means lost revenue." },
    ],
  },
  solution: {
    heading: "Stable power, smart automation, and security — all in one system.",
    description: "Tioga combines solar energy, intelligent home automation, and modern security into a seamless experience.",
  },
  offers: {
    items: [
      { title: "Solar Inverter Systems", desc: "Say goodbye to generator noise and fuel costs.", highlights: ["Custom-sized for your load", "Lithium battery technology", "5–25 year warranty", "Starts from ₦350,000"] },
      { title: "Smart Home Automation", desc: "Transform your space into an intelligent environment.", highlights: ["Mobile & voice control", "Scene scheduling", "Works with existing wiring", "Single room to full house"] },
      { title: "CCTV & Smart Security", desc: "Protect what matters with smart locks and HD cameras.", highlights: ["Biometric access", "24/7 HD recording", "Motion alerts", "Remote viewing"] },
    ],
  },
  stats: {
    items: [
      { value: "100+", label: "Happy Customers" },
      { value: "250+", label: "Installations Completed" },
      { value: "₦0", label: "Monthly Fuel Cost After Solar" },
      { value: "24/7", label: "Support & Monitoring" },
    ],
  },
  how_it_works: {
    items: [
      { title: "Tell us what you need", desc: "Answer a few quick questions." },
      { title: "Get a custom recommendation", desc: "Our team designs a tailored solution." },
      { title: "Professional installation", desc: "Certified technicians handle everything." },
      { title: "Ongoing support", desc: "Dedicated support and maintenance." },
    ],
  },
  faq: {
    items: [
      { q: "How much does a solar system cost?", a: "A basic backup starts from ₦350,000." },
      { q: "How long does installation take?", a: "1–3 days for residential." },
    ],
  },
  trust: {
    items: [
      { title: "Certified Products Only", desc: "Brands like Deye, Growatt, Tuya." },
      { title: "Trained Technicians", desc: "In-house certified professionals." },
      { title: "Transparent Pricing", desc: "No hidden fees." },
      { title: "Ongoing Maintenance", desc: "Post-installation support." },
    ],
  },
  target_users: {
    items: [
      { label: "Homes", desc: "Enjoy uninterrupted power and smart living." },
      { label: "Businesses", desc: "Cut energy costs and protect assets." },
      { label: "Schools", desc: "Keep classrooms powered." },
      { label: "Offices", desc: "Stay productive with reliable power." },
    ],
  },
};

const AdminLandingPage = () => {
  const [sections, setSections] = useState<Record<string, SectionData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("landing_content").select("*");
      const map: Record<string, SectionData> = {};
      (data ?? []).forEach((row: any) => {
        map[row.section_key] = { section_key: row.section_key, content: row.content, id: row.id };
      });
      // Fill defaults for missing sections
      Object.keys(sectionLabels).forEach((key) => {
        if (!map[key]) {
          map[key] = { section_key: key, content: defaultContent[key] || {} };
        }
      });
      setSections(map);
      setLoading(false);
    };
    fetch();
  }, []);

  const updateContent = (key: string, content: any) => {
    setSections((s) => ({ ...s, [key]: { ...s[key], content } }));
  };

  const saveSection = async (key: string) => {
    setSaving(key);
    const section = sections[key];
    const { error } = await supabase.from("landing_content").upsert({
      section_key: key,
      content: section.content,
      updated_at: new Date().toISOString(),
      ...(section.id ? { id: section.id } : {}),
    }, { onConflict: "section_key" });

    if (error) toast.error("Failed to save");
    else {
      toast.success(`${sectionLabels[key]} saved`);
      invalidateLandingCache();
    }
    setSaving(null);
  };

  const toggle = (key: string) => setExpanded(expanded === key ? null : key);

  const inputClass = "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground";

  if (loading) return <AdminLayout><div className="text-center py-10 text-muted-foreground">Loading...</div></AdminLayout>;

  const renderItemsEditor = (key: string, fields: string[], addLabel: string) => {
    const items = sections[key]?.content?.items || [];
    return (
      <div className="space-y-3">
        {items.map((item: any, i: number) => (
          <div key={i} className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
              <button onClick={() => {
                const newItems = items.filter((_: any, idx: number) => idx !== i);
                updateContent(key, { ...sections[key].content, items: newItems });
              }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                <Trash2 size={12} />
              </button>
            </div>
            {fields.map((field) => (
              <div key={field}>
                <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block capitalize">{field}</label>
                {field === "highlights" ? (
                  <textarea
                    className={`${inputClass} min-h-[60px] resize-none`}
                    value={(item[field] || []).join("\n")}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[i] = { ...newItems[i], [field]: e.target.value.split("\n").filter(Boolean) };
                      updateContent(key, { ...sections[key].content, items: newItems });
                    }}
                    placeholder="One per line"
                  />
                ) : (
                  <input
                    className={inputClass}
                    value={item[field] || ""}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[i] = { ...newItems[i], [field]: e.target.value };
                      updateContent(key, { ...sections[key].content, items: newItems });
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
        <button
          onClick={() => {
            const emptyItem: any = {};
            fields.forEach((f) => { emptyItem[f] = f === "highlights" ? [] : ""; });
            updateContent(key, { ...sections[key].content, items: [...items, emptyItem] });
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Plus size={12} /> {addLabel}
        </button>
      </div>
    );
  };

  const renderSection = (key: string) => {
    const content = sections[key]?.content || {};
    const isOpen = expanded === key;

    return (
      <div key={key} className="rounded-2xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => toggle(key)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        >
          <h3 className="font-display font-bold text-card-foreground text-sm">{sectionLabels[key]}</h3>
          {isOpen ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
        </button>

        {isOpen && (
          <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
            {/* Section-specific editors */}
            {key === "problems" && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Heading</label>
                  <input className={inputClass} value={content.heading || ""} onChange={(e) => updateContent(key, { ...content, heading: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Subtitle</label>
                  <textarea className={`${inputClass} min-h-[50px] resize-none`} value={content.subtitle || ""} onChange={(e) => updateContent(key, { ...content, subtitle: e.target.value })} />
                </div>
                {renderItemsEditor(key, ["title", "desc"], "Add Problem")}
              </>
            )}

            {key === "solution" && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Heading</label>
                  <input className={inputClass} value={content.heading || ""} onChange={(e) => updateContent(key, { ...content, heading: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                  <textarea className={`${inputClass} min-h-[80px] resize-none`} value={content.description || ""} onChange={(e) => updateContent(key, { ...content, description: e.target.value })} />
                </div>
              </>
            )}

            {key === "offers" && renderItemsEditor(key, ["title", "desc", "highlights"], "Add Offer")}
            {key === "stats" && renderItemsEditor(key, ["value", "label"], "Add Stat")}
            {key === "how_it_works" && renderItemsEditor(key, ["title", "desc"], "Add Step")}
            {key === "faq" && renderItemsEditor(key, ["q", "a"], "Add FAQ")}
            {key === "trust" && renderItemsEditor(key, ["title", "desc"], "Add Reason")}
            {key === "target_users" && renderItemsEditor(key, ["label", "desc"], "Add Segment")}

            <button
              onClick={() => saveSection(key)}
              disabled={saving === key}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40"
            >
              <Save size={14} />
              {saving === key ? "Saving..." : "Save Section"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-3 max-w-2xl">
        <p className="text-sm text-muted-foreground mb-4">
          Edit content for each section of the landing page. Changes are saved per section.
        </p>
        {Object.keys(sectionLabels).map(renderSection)}
      </div>
    </AdminLayout>
  );
};

export default AdminLandingPage;
