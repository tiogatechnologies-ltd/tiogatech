import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, ExternalLink, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import AuthGatePrompt from "@/components/AuthGatePrompt";
import { trackConversion } from "@/lib/tracking";

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const STORAGE_KEY = "tioga_ai_chat_v2";

type Msg = { id: string; role: "user" | "assistant"; text: string; tool_events?: any[] };

const loadInitial = (): Msg[] => {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
};

const AiChatWidget = () => {
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>(loadInitial);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const needsAuth = !authLoading && !user;

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {} }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, loading]);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    if (needsAuth) {
      try { sessionStorage.setItem("draft:ai_chat_pending", text); } catch {}
      return;
    }
    setInput("");
    const userMsg: Msg = { id: `u${Date.now()}`, role: "user", text };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);
    trackConversion("ai_chat_message", { chars: text.length });
    try {
      const payload = history.map((m) => ({ id: m.id, role: m.role, parts: [{ type: "text", text: m.text }] }));
      const r = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: payload, user: user ? { id: user.id, email: user.email } : null }),
      });
      const j = await r.json();
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: "assistant", text: j.text || j.error || "Sorry, something went wrong.", tool_events: j.tool_events || [] }]);
    } catch (e: any) {
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: "assistant", text: "Network error. Please try again." }]);
    } finally { setLoading(false); inputRef.current?.focus(); }
  };

  const reset = () => { setMessages([]); try { localStorage.removeItem(STORAGE_KEY); } catch {} };

  return (
    <>
      {!open && (
        <button
          onClick={() => { setOpen(true); trackConversion("ai_chat_open"); }}
          aria-label="Open AI assistant"
          className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform"
        >
          <MessageCircle size={20} className="sm:w-[22px] sm:h-[22px]" />
          <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-primary" />
        </button>
      )}

      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] hidden md:block" aria-hidden />
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-50 md:h-[640px] md:w-[400px] md:max-h-[85vh] bg-background md:rounded-2xl md:border md:border-border md:shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>

          <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary text-primary-foreground md:rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary-foreground/15 flex items-center justify-center font-display font-bold">V</div>
              <div>
                <p className="text-sm font-display font-bold leading-tight">Volt · Tioga Assistant</p>
                <p className="text-[10px] opacity-80">Solar, smart home & financing help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && <button onClick={reset} title="Reset" className="p-1.5 rounded hover:bg-primary-foreground/10"><RotateCcw size={14} /></button>}
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-1.5 rounded hover:bg-primary-foreground/10"><X size={18} /></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/20">
            {needsAuth && (
              <AuthGatePrompt
                title="Sign in to chat with Volt"
                description="Volt is free - create an account to start chatting. We'll bring you right back here."
                next={window.location.pathname + window.location.search}
                compact
              />
            )}
            {!needsAuth && messages.length === 0 && (
              <div className="text-sm space-y-3">
                <p className="font-semibold text-foreground text-base">Hi 👋 I'm Volt. I can help with:</p>
                <ul className="space-y-1.5 text-foreground/90 font-medium">
                  <li>• Finding the right solar package</li>
                  <li>• Flexible Payment monthly estimates</li>
                  <li>• Smart locks and security gear</li>
                  <li>• Connecting you with our team</li>
                </ul>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {["Recommend a solar package", "Calculate a 6-month plan for ₦1.2M", "Show me smart locks"].map((s) => (
                    <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-foreground font-semibold hover:bg-primary hover:text-white shadow-xs transition-colors">{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${m.role === "user" ? "bg-primary text-white font-medium" : "bg-card border border-border text-foreground font-normal"}`}>
                  {m.text && (
                    <div className={`prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 ${
                      m.role === "user"
                        ? "text-white [&_*]:text-white [&_p]:text-white [&_strong]:text-white [&_strong]:font-bold [&_a]:text-amber-200 [&_a]:font-bold [&_li]:text-white"
                        : "text-foreground [&_*]:text-foreground [&_p]:text-foreground [&_strong]:text-foreground [&_strong]:font-bold [&_a]:text-primary [&_a]:font-semibold [&_li]:text-foreground"
                    }`}>
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline font-semibold">{children}<ExternalLink size={11} /></a>
                          ),
                        }}
                      >{m.text}</ReactMarkdown>
                    </div>
                  )}
                  {(m.tool_events || []).map((tp: any, i: number) => {
                    const out = tp.result;
                    if (out?.url) return <a key={i} href={out.url} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs font-semibold px-3 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-center shadow-sm">Open WhatsApp →</a>;
                    if (Array.isArray(out?.results)) return (
                      <div key={i} className="mt-2 space-y-1.5">
                        {out.results.slice(0, 5).map((r: any, j: number) => (
                          <div key={j} className="text-xs p-2.5 rounded-xl bg-muted/80 border border-border/60 text-foreground">
                            <p className="font-bold text-foreground">{r.name}</p>
                            <p className="text-muted-foreground font-medium mt-0.5">{r.price || "Price on request"}{r.best_for ? ` · ${r.best_for}` : ""}</p>
                          </div>
                        ))}
                      </div>
                    );
                    if (out?.monthly_payment) return (
                      <div key={i} className="mt-2 text-xs p-2.5 rounded-xl bg-muted/80 border border-border/60 text-foreground font-medium space-y-1">
                        <p className="text-foreground">Deposit: <strong className="font-bold text-foreground text-sm">₦{out.deposit.toLocaleString()}</strong></p>
                        <p className="text-foreground">{out.months} × <strong className="font-bold text-primary text-sm">₦{out.monthly_payment.toLocaleString()}</strong>/mo</p>
                      </div>
                    );
                    if (out?.lead_id) return <p key={i} className="text-xs mt-1.5 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">✓ {out.message}</p>;
                    return null;
                  })}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3.5 py-2.5 bg-card border border-border">
                  <Loader2 size={14} className="animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-border bg-background p-3 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={needsAuth ? "Sign in above to start chatting…" : "Ask about solar, packages, financing…"}
              rows={1}
              disabled={needsAuth}
              className="flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground font-medium placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32 disabled:opacity-60"
            />
            <button type="submit" disabled={loading || !input.trim() || needsAuth} className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 shadow-sm">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
        </>
      )}
    </>
  );
};


export default AiChatWidget;
