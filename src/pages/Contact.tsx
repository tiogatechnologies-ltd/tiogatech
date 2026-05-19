import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import heroBg from "@/assets/hero-bg.jpg";
import { Mail, MessageCircle, MapPin, Clock, Send, Loader2, CheckCircle2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackConversion } from "@/lib/tracking";
import { toast } from "@/hooks/use-toast";
import { useLandingContent } from "@/hooks/useLandingContent";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { content: cms } = useLandingContent("page_contact");
  const c = (cms || {}) as { eyebrow?: string; title?: string; subtitle?: string };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast({ title: "Name and phone are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("leads").insert({
      full_name: form.name,
      email: form.email || null,
      phone: form.phone,
      location: "Not specified",
      products: [],
      notes: form.message || null,
      consent: true,
      source: "contact_page",
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not send message", description: error.message, variant: "destructive" });
      return;
    }
    trackConversion("contact_submitted", { source: "contact_page" });
    setDone(true);
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Contact Tioga Technologies"
        description="Talk to Tioga Technologies about solar, smart locks or home automation. Call +234 903 596 6388, WhatsApp, or visit our Jos office."
        path="/contact"
      />
      <SiteHeader />
      <PageHero
        eyebrow={c.eyebrow || "Contact"}
        title={c.title || "Let us start your project"}
        subtitle={c.subtitle || "Tell us about your space and what you would like to power. Our team will get back to you within one business day."}
        backgroundImage={heroBg}
        backgroundAlt="Tioga Technologies workspace"
      />

      <section className="section-padding">
        <div className="section-container grid gap-8 lg:grid-cols-5">
          {/* Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="text-primary" size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Email</p>
                  <a href="mailto:sales@tiogatechnologies.com" className="text-foreground font-medium hover:text-primary">
                    sales@tiogatechnologies.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="text-primary" size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">WhatsApp</p>
                  <a
                    href="https://wa.me/2348178000023"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackConversion("whatsapp_click", { source: "contact_page" })}
                    className="text-foreground font-medium hover:text-primary"
                  >
                    +234 817 800 0023
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="text-primary" size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Phone</p>
                  <a href="tel:+2349035966388" className="text-foreground font-medium hover:text-primary">
                    0903 596 6388
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="text-primary" size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Office</p>
                  <p className="text-foreground font-medium leading-relaxed">
                    No 7, Commercial Layout, Abattoir Rd, LGA,<br />
                    behind Airforce Primary School,<br />
                    Jos 930103, Plateau State, Nigeria
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="text-primary" size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Hours</p>
                  <p className="text-foreground font-medium">Mon to Fri · 10:00 AM to 6:00 PM WAT</p>
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/2348178000023"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion("whatsapp_click", { source: "contact_page_card" })}
              className="block rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground hover:brightness-110 transition-all shadow-md shadow-primary/20"
            >
              <MessageCircle size={22} className="mb-3" />
              <p className="font-display font-bold text-lg mb-1">Chat with us instantly</p>
              <p className="text-sm text-primary-foreground/80">Get answers on WhatsApp in minutes.</p>
            </a>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-card)]">
              {done ? (
                <div className="text-center py-10">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="text-primary" size={28} />
                  </div>
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">Message received</h3>
                  <p className="text-muted-foreground">Thanks for reaching out. Our team will contact you within one business day.</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 block">Full Name *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Adeola Adekunle"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 block">Phone *</label>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        required
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 block">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 block">How can we help?</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={5}
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                      placeholder="Tell us about your project, location, or what you would like to power..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-primary/20 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                    {submitting ? "Sending..." : "Send Message"}
                  </button>
                  <p className="text-xs text-muted-foreground text-center">We respond within 1 business day.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Contact;
