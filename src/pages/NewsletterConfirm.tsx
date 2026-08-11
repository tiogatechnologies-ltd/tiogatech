import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle, Mail } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-newsletter`;

const NewsletterConfirm = () => {
  const [params] = useSearchParams();
  const [state, setState] = useState<"loading" | "ok" | "fail">("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setState("fail"); setError("Missing confirmation token."); return; }
    fetch(`${FN_URL}?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) { setState("ok"); setEmail(data.email); }
        else { setState("fail"); setError(data?.error ?? "Could not confirm."); }
      })
      .catch(() => { setState("fail"); setError("Network error."); });
  }, [params]);

  return (
    <div className="min-h-screen">
      <SEO title="Confirm Newsletter Subscription" description="Confirm your Tioga Technologies newsletter subscription." path="/newsletter/confirm" />
      <SiteHeader />
      <section className="pt-28 sm:pt-32 pb-20">
        <div className="section-container max-w-md text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-5">
            {state === "loading" ? <Loader2 className="animate-spin" /> : state === "ok" ? <CheckCircle2 size={28} /> : <XCircle size={28} className="text-destructive" />}
          </div>
          <h1 className="font-display text-3xl font-bold no-clip">
            {state === "loading" ? "Confirming…" : state === "ok" ? "You're in!" : "Confirmation failed"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {state === "loading" && "Hang tight, this only takes a second."}
            {state === "ok" && (<>Thanks {email ? <strong>{email}</strong> : "for confirming"}. Energy tips and grid alerts will land in your inbox.</>)}
            {state === "fail" && (error ?? "The link is invalid or has expired.")}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold">
              <Mail size={14} /> Back to site
            </Link>
            {state === "fail" && (
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm">Contact support</Link>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
};

export default NewsletterConfirm;
