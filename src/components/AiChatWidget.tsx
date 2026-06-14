import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageCircle, X, Send, Loader2, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const STORAGE_KEY = "tioga.ai-chat.v1";

const loadInitial = (): UIMessage[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UIMessage[]) : [];
  } catch { return []; }
};

const renderText = (m: UIMessage) =>
  m.parts?.map((p) => (p.type === "text" ? p.text : p.type?.startsWith("tool-") ? "" : "")).join("") || "";

const AiChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [transport] = useState(() => new DefaultChatTransport({
    api: ENDPOINT,
    headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
  }));
  const { messages, sendMessage, status, setMessages } = useChat({
    id: "tioga-ai-chat-singleton",
    messages: loadInitial(),
    transport,
  });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, status]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || status === "submitted" || status === "streaming") return;
    setInput("");
    await sendMessage({ text });
  };

  const resetChat = () => {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const busy = status === "submitted" || status === "streaming";

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-105 transition-transform"
        >
          <MessageCircle size={22} />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent animate-pulse" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-50 md:h-[640px] md:w-[400px] md:max-h-[85vh] bg-background md:rounded-2xl md:border md:border-border md:shadow-2xl flex flex-col">
          <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary to-primary/80 text-primary-foreground md:rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary-foreground/15 flex items-center justify-center font-display font-bold">V</div>
              <div>
                <p className="text-sm font-display font-bold leading-tight">Volt · Tioga Assistant</p>
                <p className="text-[10px] opacity-80">Solar, smart home & financing help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button onClick={resetChat} className="text-[10px] px-2 py-1 rounded hover:bg-primary-foreground/10 opacity-80">Reset</button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-1.5 rounded hover:bg-primary-foreground/10"><X size={18} /></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/20">
            {messages.length === 0 && (
              <div className="text-sm text-muted-foreground space-y-3">
                <p className="font-medium text-foreground">Hi 👋 I'm Volt. I can help with:</p>
                <ul className="space-y-1.5">
                  <li>• Find the right solar package for your home</li>
                  <li>• Estimate Flexible Payment monthly fees</li>
                  <li>• Pick smart locks or security gear</li>
                  <li>• Connect you with our team</li>
                </ul>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {["Recommend a solar package", "Calculate a 6-month plan for ₦1.2M", "Show me smart locks"].map((s) => (
                    <button key={s} onClick={() => sendMessage({ text: s })} className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-primary hover:text-primary-foreground transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const text = renderText(m);
              const toolParts = (m.parts || []).filter((p: any) => p.type?.startsWith("tool-"));
              return (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"}`}>
                    {text && (
                      <div className="prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_a]:text-primary [&_strong]:font-semibold">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline">
                                {children}<ExternalLink size={11} />
                              </a>
                            ),
                          }}
                        >{text}</ReactMarkdown>
                      </div>
                    )}
                    {toolParts.map((tp: any, i: number) => {
                      const out = tp.output;
                      if (!out) return <p key={i} className="text-[11px] opacity-60 mt-1 italic">Looking that up…</p>;
                      if (out.url) return (
                        <a key={i} href={out.url} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs px-3 py-2 rounded-lg bg-accent/15 text-accent-foreground hover:bg-accent/25">
                          Open WhatsApp →
                        </a>
                      );
                      if (Array.isArray(out.results)) return (
                        <div key={i} className="mt-2 space-y-1">
                          {out.results.slice(0, 5).map((r: any, j: number) => (
                            <div key={j} className="text-xs p-2 rounded-lg bg-muted/50">
                              <p className="font-semibold">{r.name}</p>
                              <p className="opacity-70">{r.price || "Price on request"}{r.best_for ? ` · ${r.best_for}` : ""}</p>
                            </div>
                          ))}
                        </div>
                      );
                      if (out.monthly_payment) return (
                        <div key={i} className="mt-2 text-xs p-2 rounded-lg bg-muted/50">
                          <p>Deposit: <strong>₦{out.deposit.toLocaleString()}</strong></p>
                          <p>{out.months} × <strong>₦{out.monthly_payment.toLocaleString()}</strong>/mo</p>
                        </div>
                      );
                      if (out.lead_id) return <p key={i} className="text-xs mt-1 text-primary">✓ {out.message}</p>;
                      return null;
                    })}
                  </div>
                </div>
              );
            })}
            {busy && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3.5 py-2.5 bg-card border border-border">
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="border-t border-border bg-background p-3 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Ask about solar, packages, financing…"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
            />
            <button type="submit" disabled={busy || !input.trim()} className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AiChatWidget;
