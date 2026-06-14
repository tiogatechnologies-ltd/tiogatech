import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Send, Loader2, Sparkles, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Task = { id: string; label: string; needs?: string[] };
const TASKS: Task[] = [
  { id: "analyze_period", label: "Analyze last 30 days" },
  { id: "generate_blog", label: "Generate a blog post", needs: ["topic"] },
  { id: "summarize_lead", label: "Summarize a lead", needs: ["lead_id"] },
  { id: "draft_email", label: "Draft a follow-up email", needs: ["lead_id"] },
  { id: "write_product_description", label: "Write product description", needs: ["product_id"] },
];

const AdminCopilot = () => {
  const [task, setTask] = useState<string>("analyze_period");
  const [input, setInput] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setResult("");
    const cfg = TASKS.find((t) => t.id === task)!;
    const params: any = {};
    if (cfg.id === "analyze_period") params.days = 30;
    if (cfg.id === "generate_blog") { params.topic = input; params.keywords = []; }
    if (cfg.id === "summarize_lead" || cfg.id === "draft_email") params.lead_id = input.trim();
    if (cfg.id === "write_product_description") params.product_id = input.trim();

    const { data, error } = await supabase.functions.invoke("ai-copilot", { body: { task: cfg.id, params } });
    setLoading(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || "Failed"); return; }
    setResult((data as any).result || "");
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground"><Bot size={22} /></div>
          <div><h1 className="font-display text-2xl font-bold flex items-center gap-2">Admin Copilot <Sparkles size={16} className="text-accent" /></h1><p className="text-sm text-muted-foreground">AI helpers for analysis, content, and lead follow-up.</p></div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold block mb-1.5">Task</label>
              <select value={task} onChange={(e) => setTask(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
                {TASKS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            {TASKS.find((t) => t.id === task)?.needs && (
              <div><label className="text-xs font-semibold block mb-1.5">{TASKS.find((t) => t.id === task)?.needs?.[0]}</label>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="…" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
              </div>
            )}
          </div>
          <button onClick={run} disabled={loading} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Run
          </button>
        </div>

        {result && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Result</p>
              <button onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied"); }} className="p-1.5 rounded hover:bg-muted"><Copy size={14} /></button>
            </div>
            <div className="prose prose-sm max-w-none"><ReactMarkdown>{result}</ReactMarkdown></div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCopilot;
