import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { Download, Share2, Loader2, Sun, MessageCircle, ArrowRight, FileSignature, Wrench, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CustomSolutionDialog from "@/components/CustomSolutionDialog";
import AiUpgradeDialog from "@/components/AiUpgradeDialog";

const SolarAssessmentReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [customOpen, setCustomOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate(`/auth?next=/solar-assessment/${id}/full`); return; }
    (async () => {
      const { data: a } = await supabase.from("solar_assessments" as any).select("*").eq("id", id).maybeSingle();
      if (!a) { toast.error("Assessment not found"); navigate("/account"); return; }
      setAssessment(a);
      if (!(a as any).is_full_unlocked) {
        // Try to unlock
        const { data, error } = await supabase.functions.invoke("solar-assess", { body: { mode: "full", assessment_id: id } });
        if (error) {
          const msg = (error as any).message || "";
          if (msg.includes("subscription_required") || msg.includes("no_credits") || msg.includes("402")) { setPaywall(true); setLoading(false); return; }
          toast.error(msg || "Could not unlock");
          setLoading(false); return;
        }
        if (data?.error === "subscription_required" || data?.error === "no_credits") { setPaywall(true); setLoading(false); return; }
        const { data: refreshed } = await supabase.from("solar_assessments" as any).select("*").eq("id", id).maybeSingle();
        setAssessment(refreshed);
      }
      const fr = (assessment?.full_report || (a as any).full_report) as any;
      const slugs: string[] = fr?.recommended_package_slugs || [];
      if (slugs.length) {
        const { data: pkgs } = await (supabase.from("solar_packages") as any).select("*").in("slug", slugs).eq("is_active", true);
        setPackages(pkgs || []);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, authLoading]);

  const downloadPDF = () => {
    if (!assessment?.full_report) return;
    const fr = assessment.full_report;
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Tioga Technologies - Solar System Report", 14, 18);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Prepared for: ${assessment.full_name} (${assessment.email})`, 14, 26);
    doc.text(`Location: ${assessment.location || "Nigeria"} • ${new Date().toLocaleDateString()}`, 14, 32);
    doc.setTextColor(0);

    let y = 42;
    const section = (title: string) => { doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.text(title, 14, y); y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(10); };

    section("Load Analysis");
    autoTable(doc, { startY: y, theme: "grid", styles: { fontSize: 9 }, body: Object.entries(fr.load_analysis || {}).map(([k, v]) => [k.replace(/_/g, " "), String(v)]) });
    y = (doc as any).lastAutoTable.finalY + 8;

    section("Solar Sizing");
    autoTable(doc, { startY: y, theme: "grid", styles: { fontSize: 9 }, body: Object.entries(fr.solar_sizing || {}).map(([k, v]) => [k.replace(/_/g, " "), String(v)]) });
    y = (doc as any).lastAutoTable.finalY + 8;

    section("Inverter & Battery");
    autoTable(doc, { startY: y, theme: "grid", styles: { fontSize: 9 }, body: [
      ...Object.entries(fr.inverter_spec || {}).map(([k, v]) => ["Inverter " + k.replace(/_/g, " "), Array.isArray(v) ? v.join(", ") : String(v)]),
      ...Object.entries(fr.battery_spec || {}).map(([k, v]) => ["Battery " + k.replace(/_/g, " "), String(v)]),
    ] });
    y = (doc as any).lastAutoTable.finalY + 8;

    section("Electrical Components");
    autoTable(doc, { startY: y, theme: "grid", styles: { fontSize: 9 }, body: Object.entries(fr.electrical_components || {}).map(([k, v]) => [k.replace(/_/g, " "), String(v)]) });
    y = (doc as any).lastAutoTable.finalY + 8;

    if (fr.bill_of_materials?.length) {
      section("Bill of Materials");
      autoTable(doc, { startY: y, head: [["Item", "Qty", "Notes"]], body: fr.bill_of_materials.map((b: any) => [b.item, b.qty, b.notes || ""]), styles: { fontSize: 9 } });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (fr.engineer_summary) {
      section("Engineer Summary");
      doc.text(doc.splitTextToSize(fr.engineer_summary, 180), 14, y);
    }

    doc.save(`tioga-solar-report-${assessment.id.slice(0, 8)}.pdf`);
  };

  const shareWhatsApp = () => {
    const fr = assessment?.full_report;
    const url = `${window.location.origin}/solar-assessment/${assessment?.id}/full`;
    const msg = `My Tioga solar recommendation: ${fr?.inverter_spec?.size_kva}kVA inverter, ${fr?.battery_spec?.capacity_kwh}kWh battery, ${fr?.solar_sizing?.panel_count} panels. View: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading || authLoading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (paywall) {
    return (
      <div className="min-h-screen flex flex-col">
        <SEO title="Upgrade to continue - Tioga Technologies" description="Unlock additional solar assessments." path={`/solar-assessment/${id}/full`} />
        <SiteHeader />
        <main className="flex-1 grid place-items-center p-6 bg-muted/30">
          <div />
        </main>
        <AiUpgradeDialog open onOpenChange={(o) => { if (!o) navigate("/account/assessments"); }} />
        <SiteFooter />
      </div>
    );
  }

  const fr = assessment?.full_report;
  if (!fr) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title={`Full Solar Report - ${assessment.full_name}`} description="Complete solar engineering specification with bill of materials." path={`/solar-assessment/${id}/full`} />
      <SiteHeader />
      <main className="flex-1 pt-24 sm:pt-28 pb-10 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 text-xs text-primary font-semibold uppercase tracking-wider mb-1"><Sun size={14} /> Full Engineering Report</div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold">{assessment.full_name}'s Solar System</h1>
              <p className="text-sm text-muted-foreground">{assessment.location} • {new Date(assessment.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={downloadPDF} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Download size={16} /> PDF</button>
              <button onClick={shareWhatsApp} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold"><Share2 size={16} /> Share</button>
            </div>
          </div>

          <Section title="Load Analysis" obj={fr.load_analysis} />
          <Section title="Solar Sizing" obj={fr.solar_sizing} />
          <Section title="Inverter Specification" obj={fr.inverter_spec} />
          <Section title="Battery Specification" obj={fr.battery_spec} />
          <Section title="Electrical Components" obj={fr.electrical_components} />
          <Section title="Installation Notes" obj={fr.installation_notes} />

          {fr.bill_of_materials?.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-display font-bold text-lg mb-3">Bill of Materials</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground uppercase border-b border-border"><tr><th className="text-left py-2">Item</th><th className="text-center">Qty</th><th className="text-left">Notes</th></tr></thead>
                  <tbody>{fr.bill_of_materials.map((b: any, i: number) => (
                    <tr key={i} className="border-b border-border/50"><td className="py-2">{b.item}</td><td className="text-center">{b.qty}</td><td className="text-muted-foreground">{b.notes}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {packages.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-display font-bold text-lg mb-3">Recommended Tioga Packages</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {packages.map((p) => (
                  <Link key={p.id} to={`/packages?category=solar`} className="rounded-xl border border-border bg-background p-4 hover:border-primary transition-colors">
                    <div className="font-display font-bold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.capacity_kva}kVA / {p.battery_kwh}kWh</div>
                    <div className="text-primary font-bold mt-2">₦{Number(p.price_ngn).toLocaleString()}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(() => {
            const sizeKva = Number(fr?.inverter_spec?.size_kva || assessment?.recommendation?.inverter_kva || 0);
            const totalCost = (fr?.bill_of_materials || []).reduce((s: number, b: any) => s + (Number(b.estimated_cost_ngn) || 0), 0);
            const matchedAmount = totalCost || 5000000;
            const waMsg = encodeURIComponent(`Hi Tioga, I'd like to schedule installation for my solar assessment ${assessment.id.slice(0, 8)} (${sizeKva}kVA / ${fr?.battery_spec?.capacity_kwh}kWh).`);
            return (
              <div className="bg-card rounded-2xl border border-primary/30 p-6">
                <h2 className="font-display font-bold text-lg mb-1">Next steps</h2>
                <p className="text-sm text-muted-foreground mb-4">Three ways to move forward with this design.</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <button onClick={() => setCustomOpen(true)} className="rounded-xl border border-border bg-background p-4 text-left hover:border-primary transition-colors">
                    <FileSignature className="text-primary mb-2" size={20} />
                    <div className="font-display font-bold text-sm">Get formal quote</div>
                    <div className="text-xs text-muted-foreground mt-1">Engineer-reviewed quotation with itemized pricing.</div>
                  </button>
                  <Link to={`/finance/apply?assessment=${assessment.id}&amount=${matchedAmount}&months=3&item=${encodeURIComponent(`${sizeKva}kVA Tioga Solar System`)}`} className="rounded-xl border border-border bg-background p-4 text-left hover:border-primary transition-colors block">
                    <Wallet className="text-primary mb-2" size={20} />
                    <div className="font-display font-bold text-sm">Apply for Flex Pay</div>
                    <div className="text-xs text-muted-foreground mt-1">30% deposit, then 3, 6, 12 or 24 monthly installments.</div>
                  </Link>
                  <a href={`https://wa.me/2348000000000?text=${waMsg}`} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border bg-background p-4 text-left hover:border-primary transition-colors block">
                    <Wrench className="text-primary mb-2" size={20} />
                    <div className="font-display font-bold text-sm">Schedule installation</div>
                    <div className="text-xs text-muted-foreground mt-1">Book a site visit + commissioning slot.</div>
                  </a>
                </div>
              </div>
            );
          })()}

          {fr.engineer_summary && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg mb-2">Engineer Summary</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{fr.engineer_summary}</p>
            </div>
          )}

          <div className="text-center pt-2 text-xs text-muted-foreground">
            <Link to="/ai-pricing" className="inline-flex items-center gap-1 text-primary hover:underline">Manage AI subscription</Link>
          </div>

        </div>
      </main>
      <CustomSolutionDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        assessmentId={assessment.id}
        defaults={{ full_name: assessment.full_name, email: assessment.email, phone: assessment.phone, location: assessment.location }}
      />
      <SiteFooter />
    </div>
  );
};

const Section = ({ title, obj }: { title: string; obj: any }) => {
  if (!obj || typeof obj !== "object") return null;
  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h2 className="font-display font-bold text-lg mb-3">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {Object.entries(obj).map(([k, v]) => (
          <div key={k} className="rounded-lg bg-muted/50 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.replace(/_/g, " ")}</div>
            <div className="text-sm font-medium">{Array.isArray(v) ? v.join(", ") : String(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SolarAssessmentReport;
