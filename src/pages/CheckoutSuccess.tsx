import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package, MessageCircle, Loader2, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useSiteContact, whatsappLink } from "@/hooks/useSiteContact";

type Verify = { status: "idle" | "checking" | "success" | "failed"; amount?: number | null };

const CheckoutSuccess = () => {
  const { contact } = useSiteContact();
  const [params] = useSearchParams();
  const orderNumber = params.get("order");
  const trackingParam = params.get("tracking");
  const method = params.get("method");
  const reference = params.get("reference") || params.get("trxref");
  const [verify, setVerify] = useState<Verify>({ status: "idle" });
  const [trackingId, setTrackingId] = useState<string | null>(trackingParam || null);
  const { clear } = useCart();

  useEffect(() => {
    // Check local storage for trackingId if not in URL param
    if (!trackingId && orderNumber) {
      try {
        const local = JSON.parse(localStorage.getItem(`tioga_order_${orderNumber}`) || "{}");
        if (local.tracking_id || local.tracking_number) {
          setTrackingId(local.tracking_id || local.tracking_number);
        }
      } catch {}
    }

    // Verify whenever Paystack sent us back a reference. The `method` param is
    // absent when Paystack uses the dashboard-level callback URL, and skipping
    // verification there showed an unverified "Order received!" screen.
    if (!reference) {
      if (orderNumber) clear();
      return;
    }

    setVerify({ status: "checking" });

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("paystack-verify", {
          // order_number may be absent on a bare dashboard callback; the function
          // then resolves it from the transaction metadata.
          body: orderNumber ? { reference, order_number: orderNumber } : { reference },
        });
        if (error || !data?.success) {
          throw new Error(data?.error || error?.message || "Payment was not confirmed");
        }
        if (orderNumber && data?.order_number !== orderNumber) {
          throw new Error("Payment did not match this order");
        }
        const confirmedOrder = orderNumber || data?.order_number || null;
        if (confirmedOrder) {
          try {
            const local = JSON.parse(localStorage.getItem(`tioga_order_${confirmedOrder}`) || "{}");
            local.payment_status = "paid";
            local.payment_reference = data.reference;
            localStorage.setItem(`tioga_order_${confirmedOrder}`, JSON.stringify(local));
          } catch {}
        }
        setVerify({ status: "success", amount: Number(data.amount_ngn) || undefined });
        clear();
      } catch (err) {
        console.error("Payment verification failed:", err);
        setVerify({ status: "failed" });
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
        {orderNumber && <p className="text-sm text-muted-foreground mb-3">Order number: <span className="font-mono text-foreground font-semibold">{orderNumber}</span></p>}

        {trackingId && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground mb-5 flex items-center justify-between gap-3 text-left">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-primary block">Automated Tracking ID</span>
              <span className="font-mono text-base font-bold text-foreground">{trackingId}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(trackingId);
                toast.success("Tracking ID copied to clipboard!");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <Copy size={13} /> Copy ID
            </button>
          </div>
        )}

        {verify.status === "success" && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground mb-5">
            Paystack confirmed your payment{verify.amount ? ` of ₦${verify.amount.toLocaleString("en-NG")}` : ""}. Our engineering and fulfillment team has been notified to process your order.
          </div>
        )}
        {verify.status === "failed" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground mb-5 text-left">
            We could not confirm this Paystack transaction automatically. If your account was debited, please chat with us with reference <span className="font-mono font-bold">{reference}</span>.
          </div>
        )}
        {method === "whatsapp" && (
          <p className="text-sm text-muted-foreground mb-5">Continue the conversation on WhatsApp to finalize payment and delivery.</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link to={trackingId ? `/track?order=${encodeURIComponent(trackingId)}` : orderNumber ? `/track?order=${encodeURIComponent(orderNumber)}` : "/track"} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"><Package size={14} /> Track this order</Link>
          <Link to="/account" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground">View my orders</Link>
          <a href={whatsappLink(contact)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground"><MessageCircle size={14} /> Chat with us</a>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
