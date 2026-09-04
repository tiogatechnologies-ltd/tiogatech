import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, Upload, Image as ImageIcon, Loader2, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { invalidateLandingCache } from "@/hooks/useLandingContent";

type Field = "eyebrow" | "title" | "subtitle" | "body" | "image" | "ctaLabel" | "ctaHref" | "name" | "role";

interface SectionDef {
  key: string;       // section_key in landing_content
  label: string;     // section name shown to admin
  fields: Field[];
  hint?: string;
}

interface PageDef {
  label: string;
  sections: SectionDef[];
}

// Section registry. Each section_key maps to a slot the public site reads via useLandingContent.
// Wired = currently consumed by the public page. Other sections are reserved for upcoming wiring.
const PAGES: PageDef[] = [
  {
    label: "Home",
    sections: [
      { key: "home_hero", label: "Hero (above the fold)", fields: ["eyebrow", "title", "subtitle", "image", "ctaLabel"] },
      { key: "home_problem", label: "Problem section", fields: ["eyebrow", "title", "body", "image"] },
      { key: "home_solution", label: "Solution section", fields: ["eyebrow", "title", "body", "image"] },
      { key: "home_offer", label: "Offer / value props", fields: ["eyebrow", "title", "body"] },
      { key: "home_trust", label: "Trust / social proof", fields: ["eyebrow", "title", "body"] },
      { key: "home_final_cta", label: "Final CTA", fields: ["eyebrow", "title", "subtitle", "ctaLabel", "ctaHref"] },
    ],
  },
  {
    label: "About",
    sections: [
      { key: "page_about", label: "Hero", fields: ["eyebrow", "title", "subtitle", "image"] },
      { key: "about_intro", label: "Intro - Who we are", fields: ["eyebrow", "title", "body"] },
      { key: "about_mission", label: "Mission card", fields: ["title", "body"] },
      { key: "about_vision", label: "Vision card", fields: ["title", "body"] },
      { key: "about_pillars", label: "Pillars headline", fields: ["eyebrow", "title", "subtitle"] },
      { key: "about_team_banner", label: "Team banner", fields: ["eyebrow", "title", "body", "image"] },
      { key: "about_founder", label: "Founder section", fields: ["eyebrow", "name", "role", "body", "image"], hint: "Body supports paragraphs (blank line to separate)." },
      { key: "about_impact", label: "Impact section", fields: ["eyebrow", "title", "body", "ctaLabel"] },
    ],
  },
  {
    label: "VoltAi",
    sections: [
      { key: "page_voltai", label: "Hero", fields: ["eyebrow", "title", "subtitle", "image"] },
      { key: "voltai_intro", label: "Intro", fields: ["eyebrow", "title", "body", "image"] },
      { key: "voltai_features", label: "Features headline", fields: ["eyebrow", "title", "subtitle"] },
      { key: "voltai_cta", label: "Bottom CTA", fields: ["title", "subtitle", "ctaLabel"] },
    ],
  },
  {
    label: "LumiVolt",
    sections: [
      { key: "page_lumivolt", label: "Hero", fields: ["eyebrow", "title", "subtitle", "image"] },
      { key: "lumivolt_intro", label: "Intro", fields: ["eyebrow", "title", "body", "image"] },
      { key: "lumivolt_benefits", label: "Benefits headline", fields: ["eyebrow", "title", "subtitle"] },
      { key: "lumivolt_cta", label: "Bottom CTA", fields: ["title", "subtitle", "ctaLabel"] },
    ],
  },
  {
    label: "Finance",
    sections: [
      { key: "page_finance", label: "Hero", fields: ["eyebrow", "title", "subtitle", "image"] },
      { key: "finance_intro", label: "Intro", fields: ["eyebrow", "title", "body"] },
      { key: "finance_terms", label: "Terms headline", fields: ["eyebrow", "title", "subtitle"] },
    ],
  },
  {
    label: "Contact",
    sections: [
      { key: "page_contact", label: "Hero", fields: ["eyebrow", "title", "subtitle", "image"] },
      { key: "contact_intro", label: "Intro card", fields: ["title", "body"] },
    ],
  },
  {
    label: "Careers",
    sections: [
      { key: "page_career", label: "Hero", fields: ["eyebrow", "title", "subtitle", "image"] },
      { key: "career_intro", label: "Intro", fields: ["eyebrow", "title", "body"] },
    ],
  },
  {
    label: "Packages",
    sections: [
      { key: "page_packages", label: "Hero", fields: ["eyebrow", "title", "subtitle", "image"] },
      { key: "packages_intro", label: "Category intro", fields: ["eyebrow", "title", "subtitle"] },
    ],
  },
  {
    label: "Coming Soon",
    sections: [
      { key: "page_coming_soon", label: "Hero", fields: ["eyebrow", "title", "subtitle", "image"] },
    ],
  },
];

const FIELD_META: Record<Field, { label: string; multiline?: boolean; type?: string }> = {
  eyebrow: { label: "Eyebrow" },
  title: { label: "Title" },
  subtitle: { label: "Subtitle", multiline: true },
  body: { label: "Body", multiline: true },
  image: { label: "Image" },
  ctaLabel: { label: "CTA label" },
  ctaHref: { label: "CTA link", type: "url" },
  name: { label: "Name" },
  role: { label: "Role / title" },
};

const inputCls = "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground";

const ImageUpload = ({ value, onChange, sectionKey }: { value?: string; onChange: (url: string) => void; sectionKey: string }) => {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `cms/${sectionKey}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type });
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success("Image uploaded");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        {value ? (
          <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
            <img src={value} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
            <button type="button" onClick={() => onChange("")} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/90 grid place-items-center text-foreground hover:text-destructive">
              <X size={11} />
            </button>
          </div>
        ) : (
          <div className="w-32 h-20 rounded-lg border border-dashed border-border grid place-items-center text-muted-foreground shrink-0">
            <ImageIcon size={18} />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium cursor-pointer hover:bg-muted">
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {uploading ? "Uploading..." : "Upload image"}
            <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
          </label>
          <input
            className={`${inputCls} text-xs`}
            placeholder="...or paste an image URL"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

const AdminContent = () => {
  const [activePage, setActivePage] = useState(PAGES[0].label);
  const [activeSection, setActiveSection] = useState(PAGES[0].sections[0].key);
  const [content, setContent] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const allKeys = PAGES.flatMap((p) => p.sections.map((s) => s.key));
      const { data } = await supabase.from("landing_content").select("*").in("section_key", allKeys);
      const map: Record<string, any> = {};
      (data ?? []).forEach((row: any) => { map[row.section_key] = row.content; });
      setContent(map);
      setLoading(false);
    })();
  }, []);

  const page = PAGES.find((p) => p.label === activePage)!;
  const section = page.sections.find((s) => s.key === activeSection) ?? page.sections[0];
  const data = content[section.key] || {};

  const updateField = (field: string, value: string) => {
    setContent((c) => ({ ...c, [section.key]: { ...(c[section.key] || {}), [field]: value } }));
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("landing_content").upsert({
      section_key: section.key,
      content: content[section.key] || {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "section_key" });
    if (error) toast.error("Failed to save");
    else { toast.success(`${section.label} saved`); invalidateLandingCache(); }
    setSaving(false);
  };

  if (loading) return <AdminLayout><div className="text-center py-10 text-muted-foreground">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">Site Content</h1>
          <p className="text-sm text-muted-foreground">Edit any page's hero, body sections, images and CTAs. Leave a field blank to use the default.</p>
        </div>

        {/* Page tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {PAGES.map((p) => (
            <button
              key={p.label}
              onClick={() => { setActivePage(p.label); setActiveSection(p.sections[0].key); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activePage === p.label ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >{p.label}</button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          {/* Section list */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Sections on {activePage}</p>
            {page.sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeSection === s.key ? "bg-primary/10 text-primary border border-primary/30" : "bg-card border border-border text-foreground/80 hover:bg-muted"}`}
              >{s.label}</button>
            ))}
          </div>

          {/* Editor */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="text-xs text-muted-foreground">Editing</p>
                <p className="text-sm font-bold text-foreground">{activePage} → {section.label}</p>
              </div>
              <code className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded">{section.key}</code>
            </div>

            {section.hint && <p className="text-xs text-muted-foreground italic">{section.hint}</p>}

            {section.fields.map((field) => {
              const meta = FIELD_META[field];
              if (field === "image") {
                return (
                  <div key={field}>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{meta.label}</label>
                    <ImageUpload value={data[field]} onChange={(url) => updateField(field, url)} sectionKey={section.key} />
                  </div>
                );
              }
              return (
                <div key={field}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{meta.label}</label>
                  {meta.multiline ? (
                    <textarea
                      className={`${inputCls} min-h-[120px] resize-y`}
                      value={data[field] || ""}
                      onChange={(e) => updateField(field, e.target.value)}
                    />
                  ) : (
                    <input
                      type={meta.type || "text"}
                      className={inputCls}
                      value={data[field] || ""}
                      onChange={(e) => updateField(field, e.target.value)}
                    />
                  )}
                </div>
              );
            })}

            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save Section"}
              </button>
              <p className="text-xs text-muted-foreground">Changes go live immediately on the public site.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-200">
          <strong>Wiring status:</strong> Hero sections on every page, plus the About page (Intro, Founder, Mission, Vision, Impact) read from this editor today. Additional body sections (marked above) save successfully and are queued to be wired into the public pages in the next pass. Ask the AI to "wire section X on page Y" to activate any specific block.
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContent;
