import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Send, Loader2, Sparkles, Copy, Plus, Trash2, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "tioga_admin_copilot_chat";

const QUICK_ACTIONS: { label: string; prompt: string }[] = [
  { label: "Analyze last 30 days", prompt: "Analyze the last 30 days of leads, orders and paid revenue. Give 5 insights and 3 concrete actions." },
  { label: "Draft a follow-up email", prompt: "Draft a warm, concise follow-up email for a Lagos customer who requested a 5kVA solar quote two days ago and hasn't responded. Include subject and body, sign off as 'The Tioga Team'." },
  { label: "Suggest a discount campaign", prompt: "Suggest a 7-day discount campaign to boost smart-lock sales. Include code, percentage, target audience, and 3 promo channels." },
  { label: "Write a blog post", prompt: "Write a 600-word SEO blog post for Tioga Technologies on 'How to size a solar system for a 3-bedroom Lagos flat'. Use H2/H3 and markdown." },
  { label: "Top-performing products", prompt: "Based on our platform, what would you recommend we feature on the home page this week to drive conversions?" },
  { label: "Operational checklist", prompt: "Give me a daily operations checklist for an admin running an e-commerce solar business in Nigeria." },
];

const AdminCopilot = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-copilot", {
        body: { task: "chat", messages: next.map((m) => ({ role: m.role, content: m.content })) },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      setMessages((m) => [...m, { role: "assistant", content: (data as any).result || "" }]);
    } catch (e: any) {
      toast.error(e?.message || "Copilot failed");
      setMessages((m) => [...m, { role: "assistant", content: "_Sorry, I hit an error. Please try again._" }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-7.5rem)]">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-md">
              <Bot size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-xl font-bold flex items-center gap-1.5 leading-tight">
                Admin Copilot <Sparkles size={14} className="text-accent" />
              </h1>
              <p className="text-xs text-muted-foreground truncate">Your AI assistant — analysis, copy, follow-ups, ideas.</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={reset} className="shrink-0 inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted">
              <Trash2 size={13} /> <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-5 space-y-5">
          {messages.length === 0 && (
            <div className="text-center py-6 sm:py-12">
              <div className="mx-auto h-14 w-14 rounded-3xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-primary mb-4">
                <Sparkles size={24} />
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold mb-1.5">How can I help you today?</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-md mx-auto">Ask anything about your business — or start with a quick action.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => send(a.prompt)}
                    className="text-left p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                  >
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary mb-1">{a.label}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{a.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground">
                  <Bot size={15} />
                </div>
              )}
              <div className={`group relative max-w-[85%] sm:max-w-[75%] ${m.role === "user" ? "" : ""}`}>
                {m.role === "user" ? (
                  <div className="rounded-2xl rounded-tr-md px-4 py-2.5 bg-primary text-primary-foreground text-sm whitespace-pre-wrap break-words">{m.content}</div>
                ) : (
                  <>
                    <div className="prose prose-sm dark:prose-invert max-w-none rounded-2xl rounded-tl-md px-4 py-3 bg-card border border-border text-sm break-words">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(m.content); toast.success("Copied"); }}
                      className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-background border border-border shadow-sm hover:bg-muted"
                      aria-label="Copy"
                    >
                      <Copy size={11} />
                    </button>
                  </>
                )}
              </div>
              {m.role === "user" && (
                <div className="h-8 w-8 shrink-0 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <User size={15} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground">
                <Bot size={15} />
              </div>
              <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-card border border-border text-sm flex items-center gap-2 text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border pt-3 pb-2 bg-background">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
                }}
                rows={1}
                placeholder="Ask Copilot anything… (Enter to send, Shift+Enter for newline)"
                className="w-full resize-none rounded-2xl border border-border bg-card pl-4 pr-12 py-3 text-sm max-h-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ minHeight: 48 }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 bottom-2 h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90"
                aria-label="Send"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="hidden sm:inline-flex h-12 px-3 items-center gap-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted"
              >
                <Plus size={13} /> New
              </button>
            )}
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-2">Copilot can make mistakes. Verify important details.</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCopilot;
