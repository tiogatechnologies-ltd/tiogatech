import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

type State = "loading" | "valid" | "invalid" | "already" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!token) return setState("invalid");
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const data = await res.json();
        if (data?.valid) setState("valid");
        else if (data?.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("error");
      }
    };
    run();
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setBusy(false);
    if (error) return setState("error");
    if ((data as any)?.success) setState("done");
    else if ((data as any)?.reason === "already_unsubscribed") setState("already");
    else setState("error");
  };

  return (
    <>
      <SEO title="Unsubscribe | Tioga Technologies" description="Manage your email preferences with Tioga Technologies." />
      <main className="min-h-screen flex items-center justify-center px-4 py-24 bg-background">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center space-y-4">
          <h1 className="font-display text-xl font-bold text-card-foreground">Email preferences</h1>

          {state === "loading" && <p className="text-sm text-muted-foreground">Checking your link...</p>}

          {state === "valid" && (
            <>
              <p className="text-sm text-muted-foreground">
                Confirm that you want to stop receiving emails from Tioga Technologies.
              </p>
              <button onClick={confirm} disabled={busy} className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40">
                {busy ? "Processing..." : "Confirm unsubscribe"}
              </button>
            </>
          )}

          {state === "done" && <p className="text-sm text-muted-foreground">You have been unsubscribed. We're sorry to see you go.</p>}
          {state === "already" && <p className="text-sm text-muted-foreground">This address is already unsubscribed.</p>}
          {state === "invalid" && <p className="text-sm text-muted-foreground">This unsubscribe link is invalid or has expired.</p>}
          {state === "error" && <p className="text-sm text-destructive">Something went wrong. Please try again later.</p>}

          <a href="/" className="inline-block text-xs text-primary hover:underline">Back to tiogatechnologies.com</a>
        </div>
      </main>
    </>
  );
};

export default Unsubscribe;
