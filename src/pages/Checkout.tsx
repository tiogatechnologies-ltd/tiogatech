import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp, Lock, MessageCircle, CreditCard, Building2, Wallet, Loader2, ShoppingBag, ArrowLeft } from "lucide-react";
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
  const { user, profile } = useAuth();

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [delivery, setDelivery] = useState<"ship" | "pickup">("ship");
  const [payment, setPayment] = useState<"bank_transfer" | "whatsapp" | "paystack" | "flexible">("paystack");
  const [billingSame, setBillingSame] = useState(true);
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
    state: "Lagos",
    postal: "",
    phone: "",
  });

  useEffect(() => {
    if (user && !form.email) setForm((f) => ({ ...f, email: user.email || "" }));
    if (profile?.full_name && !form.first_name) {
      const [fn, ...rest] = profile.full_name.split(" ");
      setForm((f) => ({ ...f, first_name: fn || "", last_name: rest.join(" ") || "" }));
    }
    if (profile?.phone && !form.phone) setForm((f) => ({ ...f, phone: profile.phone || "" }));
  }, [user, profile]); // eslint-disable-line

  const subtotal = useMemo(() => items.reduce((s, i) => s + ((i.numericPrice || 0) * i.quantity), 0), [items]);
  const shippingFee = useMemo(() => {
    if (delivery === "pickup") return 0;
    if (subtotal >= 500000) return 0;
    return subtotal > 0 ? 6000 : 0;
  }, [subtotal, delivery]);
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
        billing_address: billingSame ? shippingAddress : null,
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
      clear();
      window.location.href = (init.data as any).authorization_url;
      return;
    }

    if (payment === "whatsapp") {
      const msg = items.map((i, n) => `${n + 1}. ${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}${i.price ? ` — ${i.price}` : ""}`).join("\n");
      const text = encodeURIComponent(`Hi Tioga, I just placed order ${orderNumber}.\n\n${msg}\n\nTotal: ${formNGN(total)}\nName: ${form.first_name} ${form.last_name}\nPhone: ${form.phone}\nAddress: ${form.address}, ${form.city}, ${form.state}`);
      window.open(`https://wa.me/${WHATSAPP}?text=${text}`, "_blank", "noopener,noreferrer");
    }

    clear();
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
              <button onClick={() => setDelivery("ship")} className={`rounded-xl border p-3 text-sm font-semibold ${delivery === "ship" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>Ship</button>
              <button onClick={() => setDelivery("pickup")} className={`rounded-xl border p-3 text-sm font-semibold ${delivery === "pickup" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>Pickup (Lagos)</button>
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
                Pick up at our Lagos office. We'll text you when your order is ready.
                <div className="grid grid-cols-2 gap-2.5 mt-3">
                  <input value={form.first_name} onChange={(e) => setF("first_name", e.target.value)} placeholder="First name" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                  <input value={form.last_name} onChange={(e) => setF("last_name", e.target.value)} placeholder="Last name" className="rounded-xl border border-border bg-background px-4 py-3 text-sm" />
                </div>
                <input value={form.phone} onChange={(e) => setF("phone", e.target.value)} placeholder="Phone" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm mt-2.5" />
              </div>
            )}
          </section>

          {/* Shipping method */}
          {delivery === "ship" && (
            <section>
              <h2 className="text-sm font-bold text-foreground mb-2">Shipping method</h2>
              <div className="rounded-xl border border-primary bg-primary/5 p-4 flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">Standard Shipping</span>
                <span className={shippingFee === 0 ? "text-primary font-bold" : "text-foreground font-bold"}>{shippingFee === 0 ? "FREE" : formNGN(shippingFee)}</span>
              </div>
              {shippingFee === 0 && subtotal > 0 && <p className="text-[11px] text-muted-foreground mt-1">Free shipping on orders ₦500,000 and above.</p>}
            </section>
          )}

          {/* Payment */}
          <section>
            <h2 className="text-lg font-display font-bold text-foreground mb-1">Payment</h2>
            <p className="text-xs text-muted-foreground mb-3">All transactions are secure. <Lock size={10} className="inline" /></p>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${payment === "bank_transfer" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <input type="radio" checked={payment === "bank_transfer"} onChange={() => setPayment("bank_transfer")} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2"><Building2 size={16} className="text-primary" /><span className="font-semibold text-sm text-foreground">Bank Transfer</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Receive our bank details after placing the order. Send payment confirmation to seal the order.</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${payment === "whatsapp" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <input type="radio" checked={payment === "whatsapp"} onChange={() => setPayment("whatsapp")} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2"><MessageCircle size={16} className="text-primary" /><span className="font-semibold text-sm text-foreground">WhatsApp Confirmation</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Place the order and complete payment over WhatsApp with our sales team.</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${payment === "paystack" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <input type="radio" checked={payment === "paystack"} onChange={() => setPayment("paystack")} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2"><CreditCard size={16} className="text-primary" /><span className="font-semibold text-sm text-foreground">Card / Paystack</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Pay securely with debit card, bank transfer or USSD via Paystack.</p>
                </div>
              </label>
              <Link to="/finance" className="flex items-start gap-3 rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4 hover:bg-accent/10 transition-colors">
                <Wallet size={16} className="text-accent-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">Need a flexible payment plan?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Spread payments over 3, 6 or 12 months. Learn how it works →</p>
                </div>
              </Link>
            </div>
          </section>

          {/* Billing address */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-2">Billing address</h2>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer ${billingSame ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <input type="radio" checked={billingSame} onChange={() => setBillingSame(true)} />
                <span className="text-sm">Same as shipping address</span>
              </label>
              <label className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer ${!billingSame ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <input type="radio" checked={!billingSame} onChange={() => setBillingSame(false)} />
                <span className="text-sm">Use a different billing address</span>
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
      <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="font-semibold text-foreground">{shippingFee === 0 ? "FREE" : formNGN(shippingFee)}</span></div>
      <div className="flex justify-between pt-2 border-t border-border"><span className="font-display font-bold text-base text-foreground">Total</span><span className="font-display font-bold text-xl text-foreground">{formNGN(total)}</span></div>
    </div>
  </div>
);

export default Checkout;
