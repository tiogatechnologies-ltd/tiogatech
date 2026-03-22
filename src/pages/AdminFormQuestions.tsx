import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, GripVertical, Save, ToggleLeft, ToggleRight } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

interface FormQuestion {
  id: string;
  category: string;
  step_key: string;
  question_text: string;
  subtitle: string | null;
  question_type: string;
  options: any[];
  sort_order: number;
  is_active: boolean;
}

const categories = ["solar", "automation", "security"];

const AdminFormQuestions = () => {
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("solar");
  const [editing, setEditing] = useState<FormQuestion | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    step_key: "",
    question_text: "",
    subtitle: "",
    question_type: "single_select",
    options: [] as string[],
    sort_order: 0,
    is_active: true,
  });
  const [optionInput, setOptionInput] = useState("");

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from("form_questions")
      .select("*")
      .order("sort_order");
    setQuestions((data as FormQuestion[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, []);

  const filtered = questions.filter((q) => q.category === activeTab);

  const openCreate = () => {
    setForm({
      step_key: "",
      question_text: "",
      subtitle: "",
      question_type: "single_select",
      options: [],
      sort_order: filtered.length,
      is_active: true,
    });
    setOptionInput("");
    setCreating(true);
    setEditing(null);
  };

  const openEdit = (q: FormQuestion) => {
    setForm({
      step_key: q.step_key,
      question_text: q.question_text,
      subtitle: q.subtitle ?? "",
      question_type: q.question_type,
      options: (q.options as any[]).map((o: any) => typeof o === "string" ? o : o.label || String(o)),
      sort_order: q.sort_order,
      is_active: q.is_active,
    });
    setOptionInput("");
    setEditing(q);
    setCreating(false);
  };

  const closeForm = () => { setEditing(null); setCreating(false); };

  const addOption = () => {
    if (!optionInput.trim()) return;
    setForm((f) => ({ ...f, options: [...f.options, optionInput.trim()] }));
    setOptionInput("");
  };

  const removeOption = (idx: number) => {
    setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    const payload = {
      category: activeTab,
      step_key: form.step_key.trim(),
      question_text: form.question_text.trim(),
      subtitle: form.subtitle.trim() || null,
      question_type: form.question_type,
      options: form.options,
      sort_order: form.sort_order,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    if (!payload.step_key || !payload.question_text) {
      toast.error("Step key and question text are required");
      return;
    }

    if (editing) {
      const { error } = await supabase.from("form_questions").update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Question updated");
    } else {
      const { error } = await supabase.from("form_questions").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Question created");
    }
    closeForm();
    fetchQuestions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await supabase.from("form_questions").delete().eq("id", id);
    toast.success("Question deleted");
    fetchQuestions();
  };

  const toggleActive = async (q: FormQuestion) => {
    await supabase.from("form_questions").update({ is_active: !q.is_active }).eq("id", q.id);
    fetchQuestions();
  };

  const inputClass = "w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground";
  const isFormOpen = editing || creating;

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Category tabs */}
        <div className="flex gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveTab(c)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                activeTab === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} questions in {activeTab} flow</p>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
            <Plus size={16} /> Add Question
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((q, i) => (
              <div key={q.id} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
                <div className="flex items-center gap-2 text-muted-foreground pt-1">
                  <GripVertical size={16} />
                  <span className="text-xs font-mono">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{q.question_type}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">{q.step_key}</span>
                    {!q.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Inactive</span>}
                  </div>
                  <p className="font-medium text-card-foreground text-sm">{q.question_text}</p>
                  {q.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{q.subtitle}</p>}
                  {(q.options as any[]).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(q.options as any[]).map((o: any, oi: number) => (
                        <span key={oi} className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-foreground">
                          {typeof o === "string" ? o : o.label || String(o)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggleActive(q)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                    {q.is_active ? <ToggleRight size={16} className="text-primary" /> : <ToggleLeft size={16} />}
                  </button>
                  <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                    <Save size={14} />
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">No questions yet for this flow. Click "Add Question" to get started.</div>
            )}
          </div>
        )}
      </div>

      {/* Form modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 backdrop-blur-sm px-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h3 className="font-display font-bold text-card-foreground text-lg">{editing ? "Edit Question" : "Add Question"}</h3>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">✕</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Step Key *</label>
                <input className={inputClass} value={form.step_key} onChange={(e) => setForm({ ...form, step_key: e.target.value })} placeholder="e.g. solar_appliances" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Question Text *</label>
                <input className={inputClass} value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Subtitle</label>
                <input className={inputClass} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                  <select className={inputClass} value={form.question_type} onChange={(e) => setForm({ ...form, question_type: e.target.value })}>
                    <option value="single_select">Single Select</option>
                    <option value="multi_select">Multi Select</option>
                    <option value="text_input">Text Input</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort Order</label>
                  <input type="number" className={inputClass} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              {/* Options */}
              {form.question_type !== "text_input" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Options</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      className={inputClass}
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                      placeholder="Type option and press Enter"
                    />
                    <button onClick={addOption} className="px-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium shrink-0">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {form.options.map((o, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-muted text-foreground">
                        {o}
                        <button onClick={() => removeOption(i)} className="text-muted-foreground hover:text-destructive"><Trash2 size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded accent-primary" />
                <span className="text-sm text-foreground">Active</span>
              </label>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={closeForm} className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-all">Cancel</button>
              <button onClick={handleSave} className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">Save</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminFormQuestions;
