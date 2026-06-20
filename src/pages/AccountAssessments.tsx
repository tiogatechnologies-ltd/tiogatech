import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { Sun, ArrowRight, Plus } from "lucide-react";

const AccountAssessments = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [credits, setCredits] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: list }, { data: c }] = await Promise.all([
        supabase.from("solar_assessments" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("assessment_credits" as any).select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setItems(list || []);
      setCredits(c);
    })();
  }, [user]);

  const remaining = credits ? (credits.total_credits + credits.purchased_credits) - credits.used_credits : 3;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="My Solar Assessments - Tioga" description="Your saved solar assessments and reports." path="/account/assessments" />
      <SiteHeader />
      <main className="flex-1 py-10 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-display font-bold">My Solar Assessments</h1>
            <Link to="/solar-assessment" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Plus size={14} /> New assessment</Link>
          </div>

          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 mb-6 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Free analyses remaining</div>
              <div className="text-2xl font-display font-bold">{remaining} of {credits ? credits.total_credits + credits.purchased_credits : 3}</div>
            </div>
            <Sun size={28} className="text-primary" />
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No assessments yet. <Link to="/solar-assessment" className="text-primary underline">Start one</Link>.</div>
          ) : (
            <div className="space-y-3">
              {items.map((a) => (
                <div key={a.id} className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-display font-bold truncate">{a.recommendation?.inverter_kva || "?"}kVA · {a.recommendation?.battery_kwh || "?"}kWh · {a.recommendation?.panel_count || "?"} panels</div>
                    <div className="text-xs text-muted-foreground">{a.location} • {a.daily_kwh} kWh/day • {new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                  <Link to={`/solar-assessment/${a.id}/full`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary shrink-0">
                    {a.is_full_unlocked ? "View report" : "Unlock"} <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default AccountAssessments;
