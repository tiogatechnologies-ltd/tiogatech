import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";

const FN_URL = "https://yqeayhukgjtbptblvmhd.supabase.co/functions/v1/unsubscribe-newsletter";

const NewsletterUnsubscribe = () => {
  const [params] = useSearchParams();
  const [state, setState] = useState<"loading" | "ok" | "fail">("loading");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setState("fail"); return; }
    fetch(`${FN_URL}?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) { setState("ok"); setEmail(data.email); }
        else setState("fail");
      })
      .catch(() => setState("fail"));
  }, [params]);

  return (
    <div className="min-h-screen">
      <SEO title="Unsubscribe from Newsletter" description="Unsubscribe from the Tioga Technologies newsletter." path="/newsletter/unsubscribe" />
      <SiteHeader />
      <section className="pt-28 sm:pt-32 pb-20">
        <div className="section-container max-w-md text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted text-foreground mb-5">
            {state === "loading" ? <Loader2 className="animate-spin" /> : state === "ok" ? <CheckCircle2 size={28} className="text-primary" /> : <XCircle size={28} className="text-destructive" />}
          </div>
          <h1 className="font-display text-3xl font-bold no-clip">
            {state === "loading" ? "Unsubscribing…" : state === "ok" ? "You're unsubscribed" : "Link invalid"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {state === "loading" && "One moment."}
            {state === "ok" && (<>{email ? <strong>{email}</strong> : "You"} will no longer receive newsletter emails. Sorry to see you go.</>)}
            {state === "fail" && "We couldn't process this unsubscribe request. The link may be invalid."}
          </p>
          <div className="mt-7">
            <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold">
              Back to site
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
};

export default NewsletterUnsubscribe;
