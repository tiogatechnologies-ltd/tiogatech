import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Minus, Plus, Trash2, MessageCircle, Send, Loader2, ShoppingBag, CheckCircle2, CreditCard } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { trackConversion } from "@/lib/tracking";
import { toast } from "sonner";
import { z } from "zod";

const WHATSAPP = "2348178000023";

const leadSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(40),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  location: z.string().trim().min(2).max(160),
});

const CartDrawer = () => {
  const { items, open, setOpen, remove, updateQty, clear, count } = useCart();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [mode, setMode] = useState<"whatsapp" | "lead" | "paystack">("whatsapp");
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", location: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const reset = () => { setStep("cart"); setDone(false); setForm({ full_name: "", phone: "", email: "", location: "" }); };

  const buildMessage = () => {
    const lines = items.map((i, n) =>
      `${n + 1}. ${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}${i.price ? ` — ${i.price}` : ""}`
    );
    const header = form.full_name ? `Hi Tioga, this is ${form.full_name}. I would like to order:` : `Hi Tioga, I would like to order:`;
    const loc = form.location ? `\n\nLocation: ${form.location}` : "";
    const ph = form.phone ? `\nPhone: ${form.phone}` : "";
    return `${header}\n\n${lines.join("\n")}${loc}${ph}`;
  };

  const goWhatsApp = () => {
    const msg = encodeURIComponent(buildMessage());
    trackConversion("cart_checkout_whatsapp", { item_count: count });
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, "_blank", "noopener,noreferrer");
    clear();
    setOpen(false);
    reset();
  };

  const submitLead = async () => {
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) { toast.error("Please complete required fields"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("submit-order", {
      body: {
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        email: parsed.data.email || undefined,
        location: parsed.data.location,
        source: "cart_checkout",
        items: items.map((i) => ({
          product_name: i.name,
          product_type: i.type,
          price_label: i.price,
          quantity: i.quantity,
          image_url: i.image,
        })),
      },
    });
    setSubmitting(false);
    if (error || (data && (data as any).error)) {
      toast.error("Could not submit order");
      return;
    }
    trackConversion("cart_checkout_lead", { item_count: count, order_number: (data as any)?.order_number });
    setDone(true);
    clear();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-5 border-b border-border">
          <SheetTitle className="flex items-center gap-2 font-display">
            <ShoppingBag size={18} />
            {step === "cart" ? `Your Cart (${count})` : done ? "Order Sent" : "Checkout"}
          </SheetTitle>
        </SheetHeader>



        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <CheckCircle2 size={56} className="text-primary mb-4" />
            <h3 className="font-display text-xl font-bold text-foreground mb-1">Order received</h3>
            <p className="text-sm text-muted-foreground mb-6">Our sales team will contact you within one business day.</p>
            <button onClick={() => { setOpen(false); reset(); }} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">Close</button>
          </div>
        ) : items.length === 0 && step === "cart" ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <ShoppingBag size={48} className="text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          </div>
        ) : step === "cart" ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((i) => (
                <div key={i.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                  {i.image ? (
                    <img src={i.image} alt="" className="h-16 w-16 rounded-xl object-cover bg-muted shrink-0"  loading="lazy" decoding="async" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-muted shrink-0 grid place-items-center text-muted-foreground text-xs">
                      {i.type === "package" ? "Pkg" : "Item"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-2">{i.name}</p>
                    {i.price && <p className="text-xs text-primary font-bold mt-0.5">{i.price}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button onClick={() => updateQty(i.id, i.quantity - 1)} className="h-7 w-7 grid place-items-center text-muted-foreground hover:text-foreground"><Minus size={12} /></button>
                        <span className="text-xs font-semibold w-6 text-center">{i.quantity}</span>
                        <button onClick={() => updateQty(i.id, i.quantity + 1)} className="h-7 w-7 grid place-items-center text-muted-foreground hover:text-foreground"><Plus size={12} /></button>
                      </div>
                      <button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-4 space-y-2">
              <Link
                to="/finance"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors p-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid place-items-center h-8 w-8 rounded-full bg-primary/15 text-primary shrink-0">
                    <Wallet size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground leading-tight">Want flexible payments?</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">Click here to spread the cost over 3, 6 or 12 months.</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-primary shrink-0" />
              </Link>
              <p className="text-[11px] text-muted-foreground text-center">Final pricing confirmed after consultation. Installation and delivery added at checkout.</p>
              <button onClick={() => setStep("checkout")} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all">
                Proceed to Checkout
              </button>
              <button onClick={clear} className="w-full text-xs text-muted-foreground hover:text-foreground py-1">Clear cart</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">How would you like to order?</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setMode("whatsapp")} className={`rounded-xl border p-3 text-left ${mode === "whatsapp" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    <MessageCircle size={16} className="text-primary mb-1" />
                    <p className="text-xs font-bold text-foreground">WhatsApp</p>
                    <p className="text-[10px] text-muted-foreground">Send on chat</p>
                  </button>
                  <button onClick={() => setMode("lead")} className={`rounded-xl border p-3 text-left ${mode === "lead" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    <Send size={16} className="text-primary mb-1" />
                    <p className="text-xs font-bold text-foreground">Callback</p>
                    <p className="text-[10px] text-muted-foreground">We call back</p>
                  </button>
                  <button onClick={() => setMode("paystack")} className={`rounded-xl border p-3 text-left relative ${mode === "paystack" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    <CreditCard size={16} className="text-primary mb-1" />
                    <p className="text-xs font-bold text-foreground">Pay Online</p>
                    <p className="text-[10px] text-muted-foreground">Paystack — soon</p>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name *" className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone *" className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City / State *" className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                {mode === "lead" && (
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email (optional)" className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                )}
              </div>

              <div className="rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">{count} item{count !== 1 ? "s" : ""}</p>
                <ul className="space-y-0.5">
                  {items.map((i) => <li key={i.id} className="truncate">• {i.name}{i.quantity > 1 ? ` x${i.quantity}` : ""}</li>)}
                </ul>
              </div>
            </div>
            <div className="border-t border-border p-4 space-y-2">
              {mode === "whatsapp" ? (
                <button onClick={goWhatsApp} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
                  <MessageCircle size={14} /> Send Order on WhatsApp
                </button>
              ) : mode === "paystack" ? (
                <button
                  disabled
                  title="Online payment will be enabled once Paystack is configured."
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground opacity-60 cursor-not-allowed"
                >
                  <CreditCard size={14} /> Pay with Paystack (coming soon)
                </button>
              ) : (
                <button onClick={submitLead} disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-60">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {submitting ? "Submitting..." : "Submit Order Request"}
                </button>
              )}
              <button onClick={() => setStep("cart")} className="w-full text-xs text-muted-foreground hover:text-foreground py-1">← Back to cart</button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
