import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import LumiVoltSizer from "@/components/LumiVoltSizer";
import cover from "@/assets/energy-calculator-cover.jpg";
import { Link } from "react-router-dom";
import {
  Calculator,
  Sun,
  Plug,
  BatteryCharging,
  Cpu,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const STEPS = [
  { icon: Plug, title: "List your appliances", body: "Add every device you want to power — TVs, fridges, ACs, fans, lights, pumps. Use the wattage on the label for accuracy." },
  { icon: Calculator, title: "Set your usage", body: "Pick days of autonomy, battery voltage, battery type, and average sunlight hours for your city." },
  { icon: Sparkles, title: "Get your sized system", body: "Instantly see the right solar panel size, inverter, battery bank, and charge controller for your load." },
];

const WHY = [
  { icon: Sun, title: "Avoid undersizing", body: "An undersized system fails during the rainy season and shortens battery life." },
  { icon: BatteryCharging, title: "Avoid overspending", body: "Oversized systems waste hundreds of thousands of naira on kit you'll never fully use." },
  { icon: ShieldCheck, title: "Engineer-verified", body: "The math behind this tool mirrors how our engineers size every Tioga installation." },
  { icon: Cpu, title: "Future-proof", body: "Plan for new appliances, EVs, or a workshop before you buy — not after." },
];

const FAQS = [
  { q: "Is the calculator accurate?", a: "Yes — it uses the same Wh-based load profile, depth-of-discharge and sunlight-hour formulas our engineers use. Real installations may vary ±10% based on roof orientation and shading." },
  { q: "Do I need to know my appliance wattage?", a: "Use the rating on the device label or its manual. For most homes, a fridge is 150–250W, ceiling fan 70W, LED bulb 9W, 1HP AC about 750W." },
  { q: "What's 'days of autonomy'?", a: "How many full days your battery should run your home with no sun at all. Most homes pick 1 day; off-grid sites pick 2." },
  { q: "Will Tioga see my calculation?", a: "Only if you save it and submit your contact details — then a Tioga engineer will reach out with a quote within 1 business day." },
];

const EnergyCalculator = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Tioga Energy Calculator",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "NGN" },
    description: "Free solar sizing calculator for Nigerian homes and businesses.",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Energy Calculator — Size Your Solar System Free"
        description="Free Nigerian solar sizing calculator. Add your appliances and get the exact panel, inverter, battery and charge-controller size you need — in under 60 seconds."
        path="/energy-calculator"
        jsonLd={jsonLd}
      />
      <SiteHeader />
      <PageHero
        eyebrow="Free Tool"
        title="Calculate your true power needs"
        subtitle="Stop guessing. In under 60 seconds, find the exact solar panel, inverter, battery and charge controller your home or business actually needs."
        backgroundImage={cover}
        backgroundAlt="Modern Nigerian home powered by rooftop solar at golden hour"
      >
        <a
          href="#calculator"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110 shadow-md shadow-accent/30"
        >
          <Calculator size={16} /> Start calculating
        </a>
        <Link
          to="/lumivolt"
          className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur-md px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/15"
        >
          <ArrowLeft size={16} /> Back to LumiVolt
        </Link>
        <Link
          to="/packages"
          className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur-md px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/15"
        >
          See ready-made packages <ArrowRight size={16} />
        </Link>
      </PageHero>

      {/* How it works */}
      <section className="section-padding bg-background">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight no-clip">Three quick steps</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <s.icon size={20} />
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="font-display font-bold text-lg mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="section-padding bg-muted/30 scroll-mt-24">
        <div className="section-container max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight no-clip">The Calculator</h2>
            <p className="mt-3 text-muted-foreground">Free. No sign-up. Your data is private until you choose to share it.</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-[var(--shadow-card)]">
            <LumiVoltSizer />
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="section-padding bg-background">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Why sizing matters</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight no-clip">Buy once, buy right</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-2xl border border-border bg-card p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary mb-3">
                  <w.icon size={18} />
                </span>
                <h3 className="font-semibold text-foreground mb-1.5">{w.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick reference */}
      <section className="section-padding bg-muted/30">
        <div className="section-container">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight no-clip">Typical appliance wattages</h2>
            <p className="mt-2 text-sm text-muted-foreground">Approximate values — always check your device label.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">Appliance</th>
                  <th className="px-4 py-3 font-semibold">Watts</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Typical hrs/day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["LED bulb", "9 W", "6"],
                  ["Ceiling fan", "70 W", "8"],
                  ["55″ LED TV", "120 W", "6"],
                  ["Fridge (medium)", "200 W", "10 (compressor cycle)"],
                  ["1 HP split AC (inverter)", "750 W", "6"],
                  ["1.5 HP split AC (inverter)", "1,100 W", "6"],
                  ["Microwave", "1,200 W", "0.3"],
                  ["Electric kettle", "1,800 W", "0.2"],
                  ["Water pump (0.5 HP)", "370 W", "1"],
                  ["Laptop", "65 W", "6"],
                  ["Wi-Fi router", "12 W", "24"],
                ].map(([name, w, h]) => (
                  <tr key={name as string}>
                    <td className="px-4 py-2.5 text-foreground font-medium">{name}</td>
                    <td className="px-4 py-2.5 text-foreground">{w}</td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{h}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-background">
        <div className="section-container max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight no-clip">Common questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-border bg-card p-5">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-3">
                  <span className="font-semibold text-foreground">{f.q}</span>
                  <span className="text-primary transition-transform group-open:rotate-45 shrink-0">＋</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-secondary text-primary-foreground">
        <div className="section-container max-w-3xl text-center">
          <CheckCircle2 className="mx-auto text-accent mb-4" size={36} />
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight no-clip">Ready to power up?</h2>
          <p className="mt-3 text-primary-foreground/80">Pick a ready-made package, or let our engineers build a custom system from your calculation.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/packages" className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:brightness-110">
              View packages <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur-md px-6 py-3 text-sm font-semibold hover:bg-primary-foreground/15">
              Talk to an engineer
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default EnergyCalculator;
