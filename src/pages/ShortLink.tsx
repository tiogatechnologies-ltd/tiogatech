import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const FUNCTIONS_ORIGIN = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

/** /r/:slug - resolves an affiliate short link, logs the click, then redirects. */
export default function ShortLink() {
  const { slug } = useParams<{ slug: string }>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const go = async () => {
      try {
        const res = await fetch(`${FUNCTIONS_ORIGIN}/affiliate-redirect?json=1&s=${encodeURIComponent(slug || "")}`);
        const data = await res.json();
        if (cancelled) return;
        if (data?.destination) {
          window.location.replace(data.destination);
        } else {
          setFailed(true);
          setTimeout(() => window.location.replace("/"), 1500);
        }
      } catch {
        if (!cancelled) window.location.replace("/");
      }
    };
    go();
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <h1 className="text-lg font-semibold">
        {failed ? "That link is no longer active" : "Taking you to Tioga Technologies…"}
      </h1>
      <p className="text-sm text-muted-foreground">Redirecting you now.</p>
    </main>
  );
}
