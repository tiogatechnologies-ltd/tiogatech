import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package, MessageCircle, Loader2, AlertCircle } from "lucide-react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

type Verify = { status: "idle" | "checking" | "success" | "failed"; amount?: number | null };

const CheckoutSuccess = () => {
  const [params] = useSearchParams();
  const orderNumber = params.get("order");
  const method = params.get("method");
  const reference = params.get("reference") || params.get("trxref");
  const [verify, setVerify] = useState<Verify>({ status: "idle" });

  useEffect(() => {
    if (method !== "paystack" || !reference) return;
    setVerify({ status: "checking" });
    supabase.functions
      .invoke("paystack-verify", { body: { reference } })
      .then(({ data, error }) => {
        const ok = !error && (data as any)?.success;
        setVerify({ status: ok ? "success" : "failed", amount: (data as any)?.amount_ngn });
      })
      .catch(() => setVerify({ status: "failed" }));
  }, [method, reference]);

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 px-4 py-10">
      <SEO title="Order Confirmed" description="Your Tioga order has been received." path="/checkout/success" />
      <div className="w-full max-w-lg bg-card rounded-3xl border border-border p-6 sm:p-10 text-center shadow-[var(--shadow-card)]">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
          {verify.status === "checking" ? <Loader2 size={32} className="animate-spin" /> : verify.status === "failed" ? <AlertCircle size={32} className="text-destructive" /> : <CheckCircle2 size={32} />}
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          {verify.status === "checking" ? "Verifying payment..." : verify.status === "failed" ? "Payment not confirmed" : "Order received"}
        </h1>
        {orderNumber && <p className="text-sm text-muted-foreground mb-5">Order number: <span className="font-mono text-foreground">{orderNumber}</span></p>}

        {method === "paystack" && verify.status === "success" && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground mb-5">
            ✅ Paystack confirmed your payment{verify.amount ? ` of ₦${verify.amount.toLocaleString("en-NG")}` : ""}. Our team will contact you to schedule delivery or installation.
          </div>
        )}
        {method === "paystack" && verify.status === "failed" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground mb-5 text-left">
            We could not confirm this Paystack transaction. If you were charged, please contact us with reference <span className="font-mono">{reference}</span>.
          </div>
        )}
        {method === "bank_transfer" && (
          <div className="rounded-2xl border border-border bg-muted/40 p-4 text-left text-sm mb-5">
            <p className="font-semibold text-foreground mb-2">Next steps</p>
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>We'll email and WhatsApp you our bank details shortly.</li>
              <li>Send payment confirmation to seal your order.</li>
              <li>Our team contacts you to schedule delivery or installation.</li>
            </ol>
          </div>
        )}
        {method === "whatsapp" && (
          <p className="text-sm text-muted-foreground mb-5">Continue the conversation on WhatsApp to finalize payment and delivery.</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link to="/account" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"><Package size={14} /> View my orders</Link>
          <a href="https://wa.me/2348178000023" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground"><MessageCircle size={14} /> Chat with us</a>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
