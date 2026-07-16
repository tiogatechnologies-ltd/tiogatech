import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp, Lock, MessageCircle, CreditCard, Wallet, Loader2, ShoppingBag, ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { z } from "zod";
import { trackConversion } from "@/lib/tracking";
import DirectDebitConsent from "@/components/DirectDebitConsent";
import { calcPlan, formatNGN as formatPlanNGN, DEFAULT_FINANCE_CONFIG, normalizeFinanceConfig, type FinanceConfig } from "@/lib/financeCalc";

const WHATSAPP = "2348178000023";

const NG_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

const formNGN = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const schema = z.object({
  email: z.string().trim().email("Valid email required").max(255),
  first_name: z.string().trim().min(1, "First name required").max(60),
  last_name: z.string().trim().min(1, "Last name required").max(60),
  address: z.string().trim().min(3, "Address required").max(200),
  city: z.string().trim().min(2, "City required").max(80),
  state: z.string().trim().min(2, "State required"),
  phone: z.string().trim().min(7, "Phone required").max(40),
});

const Checkout = () => {
  const navigate = useNavigate();
  const { items, count, clear } = useCart();
  const { user, profile, loading: authLoading } = useAuth();

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [delivery, setDelivery] = useState<"ship" | "pickup">("ship");
  const [payment, setPayment] = useState<"whatsapp" | "paystack" | "flexible">("paystack");
  const [discountCode, setDiscountCode] = useState("");

  // Flexible plan state
  const [flexMonths, setFlexMonths] = useState<number>(6);
  const [flexMode, setFlexMode] = useState<"manual" | "auto_debit">("manual");
  const [flexConsent, setFlexConsent] = useState(false);
  const [financeConfig, setFinanceConfig] = useState<FinanceConfig>(DEFAULT_FINANCE_CONFIG);

  const [form, setForm] = useState({
    email: user?.email || "",
    first_name: "",
    last_name: "",
    address: "",
    apartment: "",
    city: "",
    state: "FCT - Abuja",
    postal: "",
    phone: "",
  });

  // Gate: guests must sign in before checkout (preserve form + cart).
  useEffect(() => {
    if (!authLoading && !user) {
      import("@/lib/authGate").then(({ saveDraft }) => saveDraft("checkout", form));
      navigate(`/auth?mode=signup&next=${encodeURIComponent("/checkout")}`, { replace: true });
    }
  }, [authLoading, user]); // eslint-disable-line

  useEffect(() => {
    // Restore any draft saved before auth redirect
    import("@/lib/authGate").then(({ loadDraft, clearDraft }) => {
      const d = loadDraft<any>("checkout");
      if (d && user) { setForm((f) => ({ ...f, ...d })); clearDraft("checkout"); }
    });
  }, [user]);

  // Fire checkout_view once per mount (only for authed users actually on the page)
  useEffect(() => {
    if (user) trackConversion("checkout_view", { item_count: items.length });
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (user && !form.email) setForm((f) => ({ ...f, email: user.email || "" }));
    if (profile?.full_name && !form.first_name) {
      const [fn, ...rest] = profile.full_name.split(" ");
      setForm((f) => ({ ...f, first_name: fn || "", last_name: rest.join(" ") || "" }));
    }
    if (profile?.phone && !form.phone) setForm((f) => ({ ...f, phone: profile.phone || "" }));
  }, [user, profile]); // eslint-disable-line

  const subtotal = useMemo(() => items.reduce((s, i) => s + ((i.numericPrice || 0) * i.quantity), 0), [items]);
  // Free delivery only in Abuja (FCT) and Jos (Plateau) — our office locations. Elsewhere: ₦15,000 flat.
  const isFreeDeliveryState = (s: string) => {
    const v = (s || "").toLowerCase();
    return v.includes("abuja") || v.includes("fct") || v.includes("plateau") || v.includes("jos");
  };
  const shippingFee = useMemo(() => {
    if (delivery === "pickup") return 0;
    if (subtotal <= 0) return 0;
    return isFreeDeliveryState(form.state) ? 0 : 15000;
  }, [subtotal, delivery, form.state]);
  const total = subtotal + shippingFee;
  const flexBreakdown = useMemo(() => calcPlan(total, flexMonths, financeConfig), [total, flexMonths, financeConfig]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "finance").maybeSingle();
      if (data?.value) setFinanceConfig(normalizeFinanceConfig(data.value as any));
    })();
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      // Allow viewing checkout briefly without forced redirect
    }
  }, [items.length]);

  const submit = async () => {
    if (items.length === 0) { toast.error("Your cart is empty"); return; }
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }

    // Flexible payment plan → create a finance_applications row (admin-approved before any charge)
    if (payment === "flexible") {
      if (total < 1_000_000) { toast.error("Flexible payment requires a total of at least ₦1,000,000."); return; }
      if (flexMode === "auto_debit" && !flexConsent) { toast.error("Please confirm the direct-debit authorization to continue."); return; }
      setSubmitting(true);
      const payload: Record<string, any> = {
        user_id: user?.id ?? null,
        full_name: `${form.first_name} ${form.last_name}`.trim(),
        email: form.email,
        phone: form.phone,
        address: form.address,
        state: form.state,
        city: form.city,
        item_name: items.map((i) => i.name).join(", ").slice(0, 200) || "Cart order",
        total_amount_ngn: flexBreakdown.total,
        deposit_ngn: flexBreakdown.deposit,
        financed_ngn: flexBreakdown.financed,
        months: flexBreakdown.tenure_months,
        monthly_payment_ngn: flexBreakdown.monthly_payment,
        interest_rate_pct: flexBreakdown.interest_rate,
        insurance_fee_ngn: flexBreakdown.insurance_fee,
        management_fee_ngn: flexBreakdown.management_fee,
        total_repayment_ngn: flexBreakdown.total_repayment,
        consent: true,
        direct_debit_consent: flexMode === "auto_debit" ? flexConsent : false,
        consent_timestamp: flexMode === "auto_debit" ? new Date().toISOString() : null,
        effective_payment_method: flexMode,
        is_asset_financing: true,
      };
      const { data: appRow, error: appErr } = await supabase.from("finance_applications").insert(payload as any).select("id").maybeSingle();
      setSubmitting(false);
      if (appErr) { toast.error(appErr.message); return; }
      try {
        await supabase.functions.invoke("notify-new-lead", {
          body: { source: "checkout_flexible", application_id: appRow?.id, full_name: payload.full_name, email: payload.email, phone: payload.phone, summary: `${payload.item_name} · ${formNGN(total)} · ${flexMonths}mo · ${flexMode}` },
        });
      } catch { /* non-fatal */ }
      trackConversion("cart_checkout_lead", { item_count: count, payment_method: "flexible" });
      clear();
      toast.success("Application submitted! We'll review and reach out within 24 hours.");
      navigate("/account/finance");
      return;
    }

    setSubmitting(true);
    const shippingAddress = {
      first_name: form.first_name, last_name: form.last_name,
      address: form.address, apartment: form.apartment,
      city: form.city, state: form.state, postal: form.postal,
      phone: form.phone, country: "Nigeria",
    };

    const { data, error } = await supabase.functions.invoke("submit-order", {
      body: {
        full_name: `${form.first_name} ${form.last_name}`.trim(),
        phone: form.phone,
        email: form.email,
        location: `${form.address}, ${form.city}, ${form.state}`,
        source: "checkout",
        payment_method: payment,
        shipping_method: delivery === "pickup" ? "pickup" : "standard",
        shipping_fee: shippingFee,
        subtotal,
        total,
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
        user_id: user?.id || null,
        discount_code: discountCode || null,
        items: items.map((i) => ({
          product_name: i.name,
          product_type: i.type,
          price_label: i.price,
          quantity: i.quantity,
          image_url: i.image,
        })),
      },
    });

    if (error || (data && (data as any).error)) {
      setSubmitting(false);
      toast.error("Could not place order. Please try again.");
      return;
    }
    const orderNumber = (data as any)?.order_number || "";
    trackConversion("cart_checkout_lead", { item_count: count, order_number: orderNumber });
    trackConversion("checkout_step", { step: "payment", method: payment, total });

    if (payment === "paystack") {
      // Launch Paystack hosted checkout
      const callback = `${window.location.origin}/checkout/success?order=${orderNumber}&method=paystack`;
      const init = await supabase.functions.invoke("paystack-init", {
        body: {
          amount_ngn: total,
          email: form.email,
          callback_url: callback,
          reference: `tioga_${orderNumber || Date.now()}`,
          metadata: { order_number: orderNumber, full_name: `${form.first_name} ${form.last_name}` },
        },
      });
      if (init.error || (init.data as any)?.error) {
        setSubmitting(false);
        toast.error((init.data as any)?.error || "Could not start Paystack checkout. Try another method.");
        return;
      }
      // NOTE: Do NOT clear the cart here. Cart is cleared only after the webhook
      // confirms charge.success OR the success page verifies payment_status = 'paid'.
      window.location.href = (init.data as any).authorization_url;
      return;
    }

    if (payment === "whatsapp") {
      const msg = items.map((i, n) => `${n + 1}. ${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}${i.price ? ` — ${i.price}` : ""}`).join("\n");
      const text = encodeURIComponent(`Hi Tioga, I just placed order ${orderNumber}.\n\n${msg}\n\nTotal: ${formNGN(total)}\nName: ${form.first_name} ${form.last_name}\nPhone: ${form.phone}\nAddress: ${form.address}, ${form.city}, ${form.state}`);
      window.open(`https://wa.me/${WHATSAPP}?text=${text}`, "_blank", "noopener,noreferrer");
    }

    // Cart is NOT cleared here — only cleared after verified payment success.
    setSubmitting(false);
    navigate(`/checkout/success?order=${orderNumber}&method=${payment}`);
  };

  const setF = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Checkout" description="Complete your Tioga order securely." path="/checkout" />

      {/* Top bar */}
      <header className="border-b border-border bg-background sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="font-display font-bold text-base sm:text-lg text-foreground">Tioga<span className="text-primary">.</span></Link>
          <Link to="/catalog" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft size={12} /> Continue shopping</Link>
        </div>
      </header>

      {/* Mobile summary bar */}
      <button onClick={() => setSummaryOpen((v) => !v)} className="lg:hidden w-full bg-muted/60 border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm text-foreground"><ShoppingBag size={14} />Order summary {summaryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
        <span className="font-display font-bold text-foreground">{formNGN(total)}</span>
      </button>
      {summaryOpen && (
        <div className="lg:hidden border-b border-border bg-muted/30 p-4">
          <OrderSummary items={items} subtotal={subtotal} shippingFee={shippingFee} total={total} discountCode={discountCode} setDiscountCode={setDiscountCode} />
        </div>
      )}

      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_400px] gap-0">
        {/* Left: form */}
        <main className="p-4 sm:p-8 lg:p-10 space-y-7">
          {/* Contact */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-display font-bold text-foreground">Contact</h2>
              {!user && <Link to="/auth" className="text-xs text-primary underline">Sign in</Link>}
            </div>
            <input type="email" required value={form.email} onChange={(e) => setF("email", e.target.value)} placeholder="Email" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </section>

          {/* Delivery */}
          <section>
            <h2 className="text-lg font-display font-bold text-foreground mb-3">Delivery</h2>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button onClick={() => setDelivery("ship")} className={`rounded-xl border p-3 text-sm font-semibold ${delivery === "ship" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>Deliver to me</button>
              <button onClick={() => setDelivery("pickup")} className={`rounded-xl border p-3 text-sm font-semibold ${delivery === "pickup" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>Pickup (Jos / Abuja)</button>
            </div>
            {delivery === "ship" && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <input value={form.first_name} onChange={(e) => setF("first_name", e.target.value)} placeholder="First name" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  <input value={form.last_name} onChange={(e) => setF("last_name", e.target.value)} placeholder="Last name" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                </div>
                <input value={form.address} onChange={(e) => setF("address", e.target.value)} placeholder="Address" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                <input value={form.apartment} onChange={(e) => setF("apartment", e.target.value)} placeholder="Apartment, suite, etc. (optional)" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                <div className="grid grid-cols-3 gap-2.5">
                  <input value={form.city} onChange={(e) => setF("city", e.target.value)} placeholder="City" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  <select value={form.state} onChange={(e) => setF("state", e.target.value)} className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
                    {NG_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input value={form.postal} onChange={(e) => setF("postal", e.target.value)} placeholder="Postal (optional)" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                </div>
                <input value={form.phone} onChange={(e) => setF("phone", e.target.value)} placeholder="Phone" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm" />
              </div>
            )}
            {delivery === "pickup" && (
              <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Pick up at our Jos or Abuja office. We'll text you when your order is ready and share the address.
                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  <input value={form.first_name} onChange={(e) => setF("first_name", e.target.value)} placeholder="First name" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  <input value={form.last_name} onChange={(e) => setF("last_name", e.target.value)} placeholder="Last name" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                </div>
                <input value={form.phone} onChange={(e) => setF("phone", e.target.value)} placeholder="Phone" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm mt-2.5" />
              </div>
            )}
          </section>

          {/* Delivery method */}
          {delivery === "ship" && (
            <section>
              <h2 className="text-sm font-bold text-foreground mb-2">Delivery method</h2>
              <div className="rounded-xl border border-primary bg-primary/5 p-4 flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">{isFreeDeliveryState(form.state) ? "Local delivery" : "Standard delivery"}</span>
                <span className={shippingFee === 0 ? "text-primary font-bold" : "text-foreground font-bold"}>{shippingFee === 0 ? "FREE" : formNGN(shippingFee)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isFreeDeliveryState(form.state)
                  ? "Free local delivery — you're in one of our office cities (Abuja / Jos)."
                  : "Flat ₦15,000 delivery fee outside Abuja and Jos. Select an Abuja or Plateau address to qualify for free delivery."}
              </p>
            </section>
          )}

          {/* Payment */}
          <section>
            <h2 className="text-lg font-display font-bold text-foreground mb-1">Payment</h2>
            <p className="text-xs text-muted-foreground mb-3">All transactions are secure. <Lock size={10} className="inline" /></p>
            <div className="space-y-2">
              {/* 1. Card / Paystack (default, fully automated) */}
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${payment === "paystack" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <input type="radio" checked={payment === "paystack"} onChange={() => setPayment("paystack")} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2"><CreditCard size={16} className="text-primary" /><span className="font-semibold text-sm text-foreground">Card / Bank Transfer</span><span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Recommended</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Pay securely with debit card, bank transfer or USSD via Paystack. Instant confirmation.</p>
                </div>
              </label>



              {/* 3. Flexible payment plan */}
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${payment === "flexible" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <input type="radio" checked={payment === "flexible"} onChange={() => setPayment("flexible")} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2"><Wallet size={16} className="text-primary" /><span className="font-semibold text-sm text-foreground">Flexible payment plan</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Pay 30% deposit today, then spread the balance across 3, 6 or 12 months. Minimum ₦1,000,000.</p>
                </div>
              </label>
              {payment === "flexible" && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 ml-2">
                  {total < 1_000_000 && (
                    <p className="text-xs text-destructive">Flexible payment requires a total of at least ₦1,000,000. Your cart total is {formNGN(total)}.</p>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Repayment length</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[3, 6, 12].map((m) => (
                        <button key={m} type="button" onClick={() => setFlexMonths(m)} className={`p-2.5 rounded-lg border text-sm font-semibold ${flexMonths === m ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-muted"}`}>
                          {m} months
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-background border border-border p-3 text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Deposit (30%) today</span><span className="font-semibold">{formNGN(flexBreakdown.deposit)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Financed balance</span><span className="font-semibold">{formNGN(flexBreakdown.financed)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Interest ({(flexBreakdown.interest_rate * 100).toFixed(0)}%)</span><span className="font-semibold">{formNGN(flexBreakdown.interest_amount)}</span></div>
                    <div className="flex justify-between pt-1 border-t border-border"><span className="text-foreground font-semibold">Monthly × {flexMonths}</span><span className="font-display font-bold text-primary">{formNGN(flexBreakdown.monthly_payment)}</span></div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    ✓ Liquidate anytime — pay only this month's interest + remaining principal. <strong>No prepayment penalty.</strong>
                  </p>
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Payment style</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setFlexMode("manual")} className={`p-2.5 rounded-lg border text-xs font-semibold ${flexMode === "manual" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}>
                        Manual installments
                      </button>
                      <button type="button" onClick={() => setFlexMode("auto_debit")} className={`p-2.5 rounded-lg border text-xs font-semibold ${flexMode === "auto_debit" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}>
                        Auto-debit my card
                      </button>
                    </div>
                  </div>
                  {flexMode === "auto_debit" && (
                    <DirectDebitConsent checked={flexConsent} onChange={setFlexConsent} amountLabel={formNGN(flexBreakdown.monthly_payment)} />
                  )}
                  <p className="text-[11px] text-muted-foreground">Your application is reviewed within 24 hours before any charge is initiated.</p>
                </div>
              )}

              {/* 4. WhatsApp — human-assisted fallback */}
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${payment === "whatsapp" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <input type="radio" checked={payment === "whatsapp"} onChange={() => setPayment("whatsapp")} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2"><MessageCircle size={16} className="text-primary" /><span className="font-semibold text-sm text-foreground">WhatsApp assistance</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Prefer a human? Place the order and finish payment over WhatsApp with our sales team.</p>
                </div>
              </label>
            </div>
          </section>


          <button onClick={submit} disabled={submitting || items.length === 0} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background py-4 text-base font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} />}
            {submitting ? "Placing order..." : "Pay now"}
          </button>
          <p className="text-[11px] text-center text-muted-foreground">By placing your order you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy</Link>.</p>
        </main>

        {/* Right: summary */}
        <aside className="hidden lg:block bg-muted/30 border-l border-border p-8">
          <OrderSummary items={items} subtotal={subtotal} shippingFee={shippingFee} total={total} discountCode={discountCode} setDiscountCode={setDiscountCode} />
        </aside>
      </div>
    </div>
  );
};

const OrderSummary = ({ items, subtotal, shippingFee, total, discountCode, setDiscountCode }: any) => (
  <div className="space-y-4">
    <ul className="space-y-3">
      {items.map((i: any) => (
        <li key={i.id} className="flex gap-3">
          <div className="relative shrink-0">
            {i.image ? <img src={i.image} alt="" className="h-14 w-14 rounded-lg object-cover bg-muted border border-border" /> : <div className="h-14 w-14 rounded-lg bg-muted" />}
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-muted-foreground text-background text-[10px] grid place-items-center font-bold">{i.quantity}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground line-clamp-2">{i.name}</p>
            {i.price && <p className="text-[11px] text-muted-foreground mt-0.5">{i.price}</p>}
          </div>
          <p className="text-xs font-semibold text-foreground shrink-0">{i.numericPrice ? formNGN(i.numericPrice * i.quantity) : i.price || "—"}</p>
        </li>
      ))}
    </ul>
    <div className="flex gap-2 pt-2">
      <input value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="Discount code" className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
      <button className="rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted">Apply</button>
    </div>
    <div className="pt-3 space-y-1.5 text-sm border-t border-border">
      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold text-foreground">{formNGN(subtotal)}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-semibold text-foreground">{shippingFee === 0 ? "FREE" : formNGN(shippingFee)}</span></div>
      <div className="flex justify-between pt-2 border-t border-border"><span className="font-display font-bold text-base text-foreground">Total</span><span className="font-display font-bold text-xl text-foreground">{formNGN(total)}</span></div>
    </div>
  </div>
);

export default Checkout;
