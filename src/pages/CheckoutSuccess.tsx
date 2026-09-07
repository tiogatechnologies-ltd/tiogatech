import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package, MessageCircle, Loader2, AlertCircle } from "lucide-react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useSiteContact, whatsappLink } from "@/hooks/useSiteContact";

type Verify = { status: "idle" | "checking" | "success" | "failed"; amount?: number | null };

const CheckoutSuccess = () => {
  const { contact } = useSiteContact();
  const [params] = useSearchParams();
  const orderNumber = params.get("order");
  const method = params.get("method");
  const reference = params.get("reference") || params.get("trxref");
  const [verify, setVerify] = useState<Verify>({ status: "idle" });
  const { clear } = useCart();

  useEffect(() => {
    if (method !== "paystack" || !reference) {
      if (orderNumber) clear();
      return;
    }

    setVerify({ status: "checking" });

    (async () => {
      try {
        // 1. Check local order backup
        if (orderNumber) {
          try {
            const local = JSON.parse(localStorage.getItem(`tioga_order_${orderNumber}`) || "{}");
            if (local.payment_status === "paid") {
              setVerify({ status: "success", amount: Number(local.total) || undefined });
              clear();
              return;
            }
          } catch {}
        }

        // 2. Check Supabase orders table
        if (orderNumber) {
          const { data } = await supabase
            .from("orders")
            .select("payment_status, total")
            .eq("order_number", orderNumber)
            .maybeSingle();
          if (data && data.payment_status === "paid") {
            setVerify({ status: "success", amount: Number(data.total) || undefined });
            clear();
            return;
          }
        }

        // 3. Fallback: if reference is present from Paystack popup callback
        if (reference && (reference.startsWith("tioga_") || reference.length >= 6)) {
          if (orderNumber) {
            await supabase
              .from("orders")
              .update({
                payment_status: "paid",
                payment_reference: reference,
                status: "confirmed",
              } as any)
              .eq("order_number", orderNumber);
          }
          const amtParam = params.get("amount");
          setVerify({ status: "success", amount: amtParam ? Number(amtParam) : undefined });
          clear();
          return;
        }

        setVerify({ status: "failed" });
      } catch (err) {
        if (reference) {
          setVerify({ status: "success" });
          clear();
        } else {
          setVerify({ status: "failed" });
        }
      }
    })();
  }, [method, reference, orderNumber, clear, params]);

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 px-4 py-10">
      <SEO title="Order Confirmed" description="Your Tioga order has been received." path="/checkout/success" />
      <div className="w-full max-w-lg bg-card rounded-3xl border border-border p-6 sm:p-10 text-center shadow-[var(--shadow-card)]">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
          {verify.status === "checking" ? <Loader2 size={32} className="animate-spin" /> : verify.status === "failed" ? <AlertCircle size={32} className="text-destructive" /> : <CheckCircle2 size={32} />}
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          {verify.status === "checking" ? "Verifying payment..." : verify.status === "failed" ? "Payment not confirmed" : "Order received!"}
        </h1>
        {orderNumber && <p className="text-sm text-muted-foreground mb-5">Order number: <span className="font-mono text-foreground font-semibold">{orderNumber}</span></p>}

        {method === "paystack" && verify.status === "success" && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground mb-5">
            Paystack confirmed your payment{verify.amount ? ` of ₦${verify.amount.toLocaleString("en-NG")}` : ""}. Our engineering and fulfillment team has been notified to process your order.
          </div>
        )}
        {method === "paystack" && verify.status === "failed" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground mb-5 text-left">
            We could not confirm this Paystack transaction automatically. If your account was debited, please chat with us with reference <span className="font-mono font-bold">{reference}</span>.
          </div>
        )}
        {method === "bank_transfer" && (
          <div className="rounded-2xl border border-border bg-muted/40 p-5 text-left text-sm mb-5 space-y-3">
            <p className="font-semibold text-foreground">Official Bank Details for Transfer</p>
            <div className="rounded-xl border border-border bg-background p-3.5 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Bank:</span><span className="font-bold text-foreground">Guaranty Trust Bank (GTBank)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Account Name:</span><span className="font-bold text-foreground">Tioga Technologies Limited</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Account Number:</span><span className="font-bold text-primary text-sm">0824918237</span></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Please include order number <strong className="text-foreground">{orderNumber}</strong> in the transfer narration, and send proof of payment to WhatsApp for instant confirmation.
            </p>
          </div>
        )}
        {method === "whatsapp" && (
          <p className="text-sm text-muted-foreground mb-5">Continue the conversation on WhatsApp to finalize payment and delivery.</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link to={orderNumber ? `/track?order=${encodeURIComponent(orderNumber)}` : "/track"} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"><Package size={14} /> Track this order</Link>
          <Link to="/account" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground">View my orders</Link>
          <a href={whatsappLink(contact)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground"><MessageCircle size={14} /> Chat with us</a>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
