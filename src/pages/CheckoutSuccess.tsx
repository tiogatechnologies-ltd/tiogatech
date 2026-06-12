import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package, MessageCircle } from "lucide-react";
import SEO from "@/components/SEO";

const CheckoutSuccess = () => {
  const [params] = useSearchParams();
  const orderNumber = params.get("order");
  const method = params.get("method");

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 px-4">
      <SEO title="Order Confirmed" path="/checkout/success" />
      <div className="w-full max-w-lg bg-card rounded-3xl border border-border p-8 sm:p-10 text-center shadow-[var(--shadow-card)]">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">Order received</h1>
        {orderNumber && <p className="text-sm text-muted-foreground mb-5">Order number: <span className="font-mono text-foreground">{orderNumber}</span></p>}

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
