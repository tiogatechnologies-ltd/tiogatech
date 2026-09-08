import { attributionForOrder } from "@/lib/attribution";
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
import { resolveProductImage } from "@/lib/productImages";
import { calcPlan, formatNGN as formatPlanNGN, DEFAULT_FINANCE_CONFIG, normalizeFinanceConfig, type FinanceConfig } from "@/lib/financeCalc";
import { useSiteContact, whatsappDigits } from "@/hooks/useSiteContact";
import { useSiteSetting, parseServiceAreas } from "@/hooks/useSiteSetting";

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
  const { contact } = useSiteContact();
  const { settings: shipping } = useSiteSetting("shipping");
  const { settings: paymentSettings } = useSiteSetting("payment");
  const { settings: features } = useSiteSetting("features");
  const { settings: discountSettings } = useSiteSetting("discounts");
  const navigate = useNavigate();
  const { items, count, clear } = useCart();
  const { user, profile, loading: authLoading } = useAuth();

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [delivery, setDelivery] = useState<"ship" | "pickup">("ship");
  const [payment, setPayment] = useState<"paystack" | "whatsapp" | "flexible">("paystack");
  const [discountCode, setDiscountCode] = useState("");
  // The Apply button had no handler: a customer could type a valid code, click
  // it, and still be charged full price. Codes are checked by the
  // validate-discount function, which owns the expiry / usage-cap / minimum
  // rules, so the browser never decides what a code is worth.
  const [discount, setDiscount] = useState<{ code: string; amount_off: number; description?: string } | null>(null);
  const [applyingCode, setApplyingCode] = useState(false);

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

  // Restore any draft saved if the customer visited auth
  useEffect(() => {
    import("@/lib/authGate").then(({ loadDraft, clearDraft }) => {
      const d = loadDraft<any>("checkout");
      if (d) {
        setForm((f) => ({ ...f, ...d }));
        clearDraft("checkout");
      }
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

  // Pre-fill the saved delivery address from the customer's profile (set on their last order).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("profiles").select("default_address").eq("id", user.id).maybeSingle();
      const saved = (data as any)?.default_address;
      if (cancelled || !saved) return;
      setForm((f) => (f.address ? f : { ...f, ...saved, email: f.email || saved.email || "" }));
    })();
    return () => { cancelled = true; };
  }, [user]);

  const subtotal = useMemo(() => items.reduce((s, i) => s + ((i.numericPrice || 0) * i.quantity), 0), [items]);
  // Delivery pricing comes from Admin > Settings > Delivery, Tax & Promotions.
  // "Service areas" are the states we cover from our own offices, so they ship
  // free; everywhere else pays the default fee unless the order clears the
  // free-shipping threshold (a threshold of 0 disables that rule).
  const freeAreas = useMemo(() => parseServiceAreas(shipping.service_areas), [shipping.service_areas]);
  const isFreeDeliveryState = (s: string) => {
    const v = (s || "").toLowerCase();
    return freeAreas.some((area) => v.includes(area));
  };
  const shippingFee = useMemo(() => {
    if (delivery === "pickup") return 0;
    if (subtotal <= 0) return 0;
    if (isFreeDeliveryState(form.state)) return 0;
    const threshold = Number(shipping.free_shipping_threshold_ngn) || 0;
    if (threshold > 0 && subtotal >= threshold) return 0;
    return Math.max(0, Number(shipping.default_shipping_fee_ngn) || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal, delivery, form.state, freeAreas, shipping.free_shipping_threshold_ngn, shipping.default_shipping_fee_ngn]);
  // A discount can never exceed the goods value, and never eats the delivery fee.
  const discountAmount = Math.min(discount?.amount_off ?? 0, subtotal);
  const total = Math.max(0, subtotal - discountAmount) + shippingFee;
  const flexBreakdown = useMemo(() => calcPlan(total, flexMonths, financeConfig), [total, flexMonths, financeConfig]);

  // The code was validated against the old subtotal, so drop it when the cart
  // changes rather than silently honouring a minimum-spend code below its
  // minimum.
  useEffect(() => {
    if (discount) setDiscount(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const applyDiscount = async () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) { toast.error("Enter a discount code"); return; }
    if (subtotal <= 0) { toast.error("Add something to your cart first"); return; }
    setApplyingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-discount", {
        body: { code, subtotal_ngn: subtotal, email: form.email?.trim() || undefined },
      });
      if (error) throw error;
      if (!data?.valid) {
        setDiscount(null);
        toast.error(data?.reason || "That code is not valid");
        return;
      }
      setDiscount({ code: data.code, amount_off: Number(data.amount_off) || 0, description: data.description });
      toast.success(`Code ${data.code} applied`, {
        description: `You save ${formNGN(Number(data.amount_off) || 0)}.`,
      });
    } catch (e: any) {
      setDiscount(null);
      toast.error(e?.message || "Could not check that code right now");
    } finally {
      setApplyingCode(false);
    }
  };

  // Paystack's hosted page bundles card, bank transfer and USSD into one
  // checkout, so the two admin toggles gate that single option together and
  // only change how it is described.
  const onlineEnabled = paymentSettings.accept_card || paymentSettings.accept_bank_transfer;
  const onlineLabel = paymentSettings.accept_card && paymentSettings.accept_bank_transfer
    ? "Card / Bank Transfer"
    : paymentSettings.accept_card ? "Card payment" : "Bank Transfer";
  const onlineChannels = paymentSettings.accept_card && paymentSettings.accept_bank_transfer
    ? "card, bank transfer"
    : paymentSettings.accept_card ? "card" : "bank transfer";

  // If an admin switches off whatever is currently selected, fall back to a
  // method that is still live rather than leaving a dead radio checked.
  useEffect(() => {
    if (payment === "paystack" && !onlineEnabled) setPayment("whatsapp");
    if (payment === "flexible" && !features.flexible_payment_enabled) {
      setPayment(onlineEnabled ? "paystack" : "whatsapp");
    }
  }, [payment, onlineEnabled, features.flexible_payment_enabled]);

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

    const effectiveAddress = delivery === "pickup" ? (form.address.trim() || "Tioga Office Pickup (Jos/Abuja)") : form.address.trim();
    const effectiveCity = delivery === "pickup" ? (form.city.trim() || "Abuja/Jos") : form.city.trim();

    const dataToValidate = {
      ...form,
      address: effectiveAddress,
      city: effectiveCity,
    };

    const parsed = schema.safeParse(dataToValidate);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }

    // Card payment is verified server-side against the signed-in owner of the
    // order, so stop guests here instead of creating an orphan pending order
    // they can never pay for. Admin > Settings can additionally require an
    // account for every method, not just card.
    if (!user && (payment === "paystack" || !paymentSettings.allow_guest_checkout)) {
      toast.error("Please sign in to continue", {
        description: payment === "paystack" && paymentSettings.allow_guest_checkout
          ? "Card payments need an account. WhatsApp checkout works without one."
          : "An account is required to place an order.",
      });
      navigate(`/auth?next=${encodeURIComponent("/checkout")}`);
      return;
    }

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
        address: effectiveAddress,
        state: form.state,
        city: effectiveCity,
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
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      address: effectiveAddress,
      apartment: form.apartment.trim(),
      city: effectiveCity,
      state: form.state,
      postal: form.postal.trim(),
      phone: form.phone.trim(),
      country: "Nigeria",
    };

    const orderNumber = `TOG-${Math.floor(100000 + Math.random() * 900000)}`;
    const trackingId = `TRK-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const itemsSummary = items
      .map((i, n) => `${n + 1}. ${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}${i.price ? ` (${i.price})` : ""}`)
      .join("\n");
    const itemCount = Math.min(200, Math.max(1, items.reduce((s, i) => s + (i.quantity || 1), 0)));

    const orderPayload = {
      order_number: orderNumber,
      // NOTE: `orders` has no tracking_id column - inserting one made PostgREST
      // reject the whole INSERT, so every checkout failed before Paystack ran.
      tracking_number: trackingId,
      full_name: `${form.first_name} ${form.last_name}`.trim(),
      phone: form.phone.trim(),
      email: form.email?.trim() || null,
      location: `${effectiveAddress}, ${effectiveCity}, ${form.state}`.trim(),
      notes: form.apartment ? `Apt/Suite: ${form.apartment}` : null,
      items_summary: itemsSummary,
      item_count: itemCount,
      source: "cart_checkout",
      payment_method: payment,
      payment_status: "pending",
      shipping_method: delivery === "pickup" ? "pickup" : "standard",
      shipping_fee: shippingFee,
      subtotal,
      total,
      shipping_address: shippingAddress,
      billing_address: shippingAddress,
      user_id: user?.id || null,
      // Only record a code that actually validated - the raw input box used to
      // be stored even when the code was wrong or had expired.
      discount_code: discount?.code ?? null,
      discount_amount: discountAmount || null,
      ...attributionForOrder(),
    };

    const { error: orderError } = await supabase.from("orders").insert(orderPayload as any);
    if (orderError) {
      setSubmitting(false);
      toast.error("We couldn't create your order. Please try again.");
      console.error("Order creation failed:", orderError);
      return;
    }

    // Save order in local storage cache for instant offline & client lookup
    try {
      const existingOrders = JSON.parse(localStorage.getItem("tioga_recent_orders") || "[]");
      localStorage.setItem("tioga_recent_orders", JSON.stringify([orderPayload, ...existingOrders.filter((o: any) => o.order_number !== orderNumber)].slice(0, 20)));
      localStorage.setItem(`tioga_order_${orderNumber}`, JSON.stringify(orderPayload));
      localStorage.setItem(`tioga_order_${trackingId}`, JSON.stringify(orderPayload));
    } catch {}

    // Remember address for authenticated users
    if (user) {
      supabase
        .from("profiles")
        .update({ default_address: { ...shippingAddress, email: form.email } } as any)
        .eq("id", user.id)
        .then(() => {});
    }

    trackConversion("cart_checkout_lead", { item_count: count, order_number: orderNumber });
    trackConversion("checkout_step", { step: "payment", method: payment, total });

    if (payment === "paystack") {
      const ref = `tioga_${orderNumber}_${Date.now()}`;
      try {
        const callbackUrl = new URL("/checkout/success", window.location.origin);
        callbackUrl.searchParams.set("order", orderNumber);
        callbackUrl.searchParams.set("tracking", trackingId);
        callbackUrl.searchParams.set("method", "paystack");

        const { data, error } = await supabase.functions.invoke("paystack-init", {
          body: {
            order_number: orderNumber,
            reference: ref,
            callback_url: callbackUrl.toString(),
            metadata: {
              purpose: "order_checkout",
              order_number: orderNumber,
              tracking_id: trackingId,
              full_name: `${form.first_name} ${form.last_name}`.trim(),
              phone: form.phone,
            },
          },
        });
        if (error || !data?.authorization_url) {
          throw new Error(data?.error || error?.message || "Paystack could not start the payment.");
        }
        try {
          const local = JSON.parse(localStorage.getItem(`tioga_order_${orderNumber}`) || "{}");
          local.payment_reference = data.reference || ref;
          localStorage.setItem(`tioga_order_${orderNumber}`, JSON.stringify(local));
        } catch {}
        window.location.assign(data.authorization_url);
      } catch (paystackErr: any) {
        setSubmitting(false);
        console.error("Paystack launch error:", paystackErr);
        // The order row is already saved, so the customer never loses the order -
        // point them at a channel that works instead of a dead end.
        toast.error(paystackErr?.message || "Could not open Paystack.", {
          description: `Your order ${orderNumber} is saved. Choose "WhatsApp assistance" to finish payment with our team.`,
          duration: 9000,
        });
      }
      return;
    }

    if (payment === "whatsapp") {
      clear();
      const msg = items.map((i, n) => `${n + 1}. ${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}${i.price ? ` - ${i.price}` : ""}`).join("\n");
      const text = encodeURIComponent(`Hi Tioga, I just placed order ${orderNumber} (Tracking: ${trackingId}).\n\n${msg}\n\nTotal: ${formNGN(total)}\nName: ${form.first_name} ${form.last_name}\nPhone: ${form.phone}\nAddress: ${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state}`);
      window.open(`https://wa.me/${whatsappDigits(contact)}?text=${text}`, "_blank", "noopener,noreferrer");
      setSubmitting(false);
      toast.success("Order placed! Connecting with sales team on WhatsApp...");
      navigate(`/checkout/success?order=${orderNumber}&tracking=${trackingId}&method=whatsapp`);
      return;
    }

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
          <OrderSummary items={items} subtotal={subtotal} shippingFee={shippingFee} total={total} discountCode={discountCode} setDiscountCode={setDiscountCode} discount={discount} discountAmount={discountAmount} applyingCode={applyingCode} onApplyDiscount={applyDiscount} showCodeField={discountSettings.show_code_field} />
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                  ? `Free local delivery - ${shipping.service_areas} are covered from our own offices.`
                  : `Flat ${formNGN(Number(shipping.default_shipping_fee_ngn) || 0)} delivery fee outside ${shipping.service_areas}.`}
                {shipping.delivery_eta_days ? ` Estimated ${shipping.delivery_eta_days} working days.` : ""}
              </p>
            </section>
          )}

          {/* Payment */}
          <section>
            <h2 className="text-lg font-display font-bold text-foreground mb-1">Payment</h2>
            <p className="text-xs text-muted-foreground mb-3">All transactions are secure. <Lock size={10} className="inline" /></p>
            <div className="space-y-2">
              {/* 1. Card / Bank Transfer through Paystack */}
              {onlineEnabled && (
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${payment === "paystack" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <input type="radio" checked={payment === "paystack"} onChange={() => setPayment("paystack")} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2"><CreditCard size={16} className="text-primary" /><span className="font-semibold text-sm text-foreground">{onlineLabel}</span><span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Instant</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Secure checkout on Paystack. Pay by {onlineChannels}, USSD or another available channel.</p>
                </div>
              </label>
              )}
              {onlineEnabled && payment === "paystack" && !user && !authLoading && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 ml-2 text-xs text-foreground space-y-2">
                  <p className="font-semibold">Sign in to pay by card</p>
                  <p className="text-muted-foreground">
                    Card payments are tied to your account so we can verify the transaction and show it in your order history.
                    You can also place the order and finish payment over{" "}
                    <button type="button" onClick={() => setPayment("whatsapp")} className="underline font-semibold text-foreground">WhatsApp</button>{" "}
                    without an account.
                  </p>
                  <Link
                    to={`/auth?next=${encodeURIComponent("/checkout")}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground"
                  >
                    Sign in / Create account
                  </Link>
                </div>
              )}



              {/* 3. Flexible payment plan */}
              {features.flexible_payment_enabled && (
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${payment === "flexible" ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <input type="radio" checked={payment === "flexible"} onChange={() => setPayment("flexible")} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2"><Wallet size={16} className="text-primary" /><span className="font-semibold text-sm text-foreground">Flexible payment plan</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Pay 30% deposit today, then spread the balance across 3, 6 or 12 months. Minimum ₦1,000,000.</p>
                </div>
              </label>
              )}
              {features.flexible_payment_enabled && payment === "flexible" && (
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
                    ✓ Liquidate anytime - pay only this month's interest + remaining principal. <strong>No prepayment penalty.</strong>
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

              {/* 4. WhatsApp - human-assisted fallback */}
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
          <OrderSummary items={items} subtotal={subtotal} shippingFee={shippingFee} total={total} discountCode={discountCode} setDiscountCode={setDiscountCode} discount={discount} discountAmount={discountAmount} applyingCode={applyingCode} onApplyDiscount={applyDiscount} showCodeField={discountSettings.show_code_field} />
        </aside>
      </div>
    </div>
  );
};

const OrderSummary = ({ items, subtotal, shippingFee, total, discountCode, setDiscountCode, discount, discountAmount, applyingCode, onApplyDiscount, showCodeField }: any) => (
  <div className="space-y-4">
    <ul className="space-y-3">
      {items.map((i: any) => (
        <li key={i.id} className="flex gap-3">
          <div className="relative shrink-0">
            {i.image ? (
              <img
                src={resolveProductImage(i.image, i.category)}
                alt=""
                className="h-14 w-14 rounded-lg object-contain bg-card border border-border p-1"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-muted" />
            )}
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] grid place-items-center font-bold">{i.quantity}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground line-clamp-2">{i.name}</p>
            {i.price && <p className="text-[11px] text-muted-foreground mt-0.5">{i.price}</p>}
          </div>
          <p className="text-xs font-semibold text-foreground shrink-0">{i.numericPrice ? formNGN(i.numericPrice * i.quantity) : i.price || "-"}</p>
        </li>
      ))}
    </ul>
    {showCodeField && (
      <div className="pt-2 space-y-2">
        <div className="flex gap-2">
          <input
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onApplyDiscount(); } }}
            placeholder="Discount code"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono uppercase"
          />
          <button
            type="button"
            onClick={onApplyDiscount}
            disabled={applyingCode}
            className="rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60"
          >
            {applyingCode ? "Checking…" : "Apply"}
          </button>
        </div>
        {discount && (
          <p className="text-[11px] font-semibold text-primary">
            Code {discount.code} applied{discount.description ? ` — ${discount.description}` : ""}.
          </p>
        )}
      </div>
    )}
    <div className="pt-3 space-y-1.5 text-sm border-t border-border">
      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold text-foreground">{formNGN(subtotal)}</span></div>
      {discountAmount > 0 && (
        <div className="flex justify-between"><span className="text-muted-foreground">Discount ({discount?.code})</span><span className="font-semibold text-primary">-{formNGN(discountAmount)}</span></div>
      )}
      <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-semibold text-foreground">{shippingFee === 0 ? "FREE" : formNGN(shippingFee)}</span></div>
      <div className="flex justify-between pt-2 border-t border-border"><span className="font-display font-bold text-base text-foreground">Total</span><span className="font-display font-bold text-xl text-foreground">{formNGN(total)}</span></div>
    </div>
  </div>
);

export default Checkout;
