import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  LifeBuoy,
  Search,
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  AlertCircle,
  Loader2,
  HelpCircle,
  ShieldCheck,
  Send,
  Ticket as TicketIcon,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSiteSetting } from "@/hooks/useSiteSetting";

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-support-ticket`;

const STATUS_STYLE: Record<string, string> = {
  open: "bg-red-100 text-red-700 border-red-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const Support = () => {
  const [params] = useSearchParams();
  const initialTicket = params.get("ticket") || "";
  const [ticketNumber, setTicketNumber] = useState(initialTicket);
  const [searching, setSearching] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  // New ticket form
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<any>(null);

  const { settings: general } = useSiteSetting("general");
  const whatsappNumber = general?.whatsapp || "+234 817 800 0023";
  const phone = general?.phone || "+234 817 800 0023";

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = ticketNumber.trim();
    if (!raw) {
      toast.error("Please enter a ticket number");
      return;
    }
    setSearching(true);
    setNotFound(false);
    setTicketResult(null);

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "check", ticket_number: raw }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setNotFound(true);
      } else {
        setTicketResult(data.ticket);
      }
    } catch (err) {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !message.trim()) {
      toast.error("Please fill in your name, contact info, and issue description.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: name.trim(),
          userContact: contact.trim(),
          subject: subject.trim() || message.trim().slice(0, 60),
          message: message.trim(),
          channel: "web_support_page",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Failed to submit ticket");
      } else {
        setCreatedTicket(data.ticket);
        toast.success(`Ticket ${data.ticket.ticket_number} created successfully!`);
        setMessage("");
        setSubject("");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Support & Ticket Status | Tioga Technologies"
        description="Track your Tioga support ticket status, submit maintenance requests, or reach our technical engineering team directly."
        path="/support"
      />
      <SiteHeader />

      <PageHero
        eyebrow="Customer Support & SLA"
        title="How can our engineering team help you today?"
        subtitle="Track an existing support ticket reference, submit a technical inquiry, or reach out directly."
      >
        <a
          href={whatsappNumber.replace(/[^0-9]/g, "") ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}` : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent/90 px-6 py-3 text-sm font-semibold text-accent-foreground transition-all shadow-md"
        >
          <MessageCircle size={16} />
          Live WhatsApp Support
        </a>
        <a
          href={phone ? `tel:${phone.replace(/[^0-9+]/g, "")}` : "#"}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 px-6 py-3 text-sm font-medium text-white transition-all"
        >
          <Phone size={16} />
          Call Direct
        </a>
      </PageHero>

      <div className="section-padding flex-1">
        <div className="section-container max-w-6xl space-y-12">
          {/* Top Row: Ticket Tracker + Direct Help */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Ticket Lookup */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 sm:p-8 border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Search size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Check Support Ticket Status</h2>
                    <p className="text-xs text-muted-foreground">Enter your ticket reference (e.g. TKT-1006)</p>
                  </div>
                </div>

                <form onSubmit={handleLookup} className="flex gap-2.5 max-w-lg mb-6">
                  <Input
                    placeholder="Enter Ticket Number (e.g. TKT-1006)"
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value)}
                    className="uppercase"
                  />
                  <Button type="submit" disabled={searching} className="gap-2 shrink-0">
                    {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    Track
                  </Button>
                </form>

                {ticketResult && (
                  <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <TicketIcon size={18} className="text-primary" />
                        <span className="font-mono font-bold text-base text-foreground">
                          {ticketResult.ticket_number}
                        </span>
                      </div>
                      <Badge variant="outline" className={STATUS_STYLE[ticketResult.status] || ""}>
                        {ticketResult.status?.toUpperCase().replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Subject</p>
                        <p className="font-semibold text-foreground mt-0.5">{ticketResult.subject || "Support Request"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Logged Date</p>
                        <p className="text-foreground mt-0.5">
                          {ticketResult.created_at ? new Date(ticketResult.created_at).toLocaleDateString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                        </p>
                      </div>
                      {ticketResult.resolved_at && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase">Resolved Date</p>
                          <p className="text-emerald-600 font-medium mt-0.5">
                            {new Date(ticketResult.resolved_at).toLocaleDateString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>Need immediate escalation? Reference this ticket number on WhatsApp.</span>
                      <a
                        href={whatsappNumber.replace(/[^0-9]/g, "") ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hello, I am inquiring about ticket " + ticketResult.ticket_number)}` : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-semibold"
                      >
                        Follow up on WhatsApp →
                      </a>
                    </div>
                  </div>
                )}

                {notFound && (
                  <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-700 flex items-center gap-3">
                    <AlertCircle size={20} className="shrink-0" />
                    <div>
                      <p className="font-semibold">Ticket not found</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        Please verify the ticket reference number (format: TKT-XXXX) or contact our team if you need assistance.
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Submit Ticket Card */}
              <Card className="p-6 sm:p-8 border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <TicketIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Submit a Support Ticket</h2>
                    <p className="text-xs text-muted-foreground">Our technicians and customer service engineers respond within 1 business day.</p>
                  </div>
                </div>

                {createdTicket ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={24} />
                    </div>
                    <h3 className="font-bold text-emerald-900 text-lg">Support Request Logged</h3>
                    <p className="text-sm text-emerald-800 max-w-md mx-auto">
                      Your ticket has been opened under reference{" "}
                      <span className="font-mono font-bold">{createdTicket.ticket_number}</span>. Our team has been notified by email.
                    </p>
                    <div className="pt-2 flex justify-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTicketNumber(createdTicket.ticket_number);
                          setCreatedTicket(null);
                        }}
                      >
                        Track this ticket
                      </Button>
                      <Button size="sm" onClick={() => setCreatedTicket(null)}>
                        Submit another request
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Your Name *</label>
                        <Input
                          placeholder="e.g. Samuel Okon"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Phone or Email *</label>
                        <Input
                          placeholder="+234... or email@domain.com"
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Subject / Device</label>
                      <Input
                        placeholder="e.g. Solar inverter error code / Smart lock battery issue"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Problem Description *</label>
                      <Textarea
                        placeholder="Please describe what is happening, error codes, and what troubleshooting you have tried..."
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full gap-2">
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Submit Support Ticket
                    </Button>
                  </form>
                )}
              </Card>
            </div>

            {/* Sidebar / Quick Contacts */}
            <div className="space-y-6">
              <Card className="p-6 border border-border space-y-4 bg-muted/20">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary" /> Direct Channels
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  For emergency outages or active warranty claims, our customer care engineers are reachable across all channels.
                </p>

                <div className="space-y-3 pt-2">
                  <a
                    href={whatsappNumber.replace(/[^0-9]/g, "") ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
                  >
                    <MessageCircle size={18} className="text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">WhatsApp Engineering Desk</p>
                      <p className="text-xs text-muted-foreground truncate">{whatsappNumber}</p>
                    </div>
                  </a>

                  <a
                    href={phone ? `tel:${phone.replace(/[^0-9+]/g, "")}` : "#"}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
                  >
                    <Phone size={18} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">Direct Phone Support</p>
                      <p className="text-xs text-muted-foreground truncate">{phone}</p>
                    </div>
                  </a>

                  <Link
                    to="/contact"
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
                  >
                    <Clock size={18} className="text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">Office Hours & Site Visit</p>
                      <p className="text-xs text-muted-foreground">Mon-Fri: 8:00 AM - 5:30 PM</p>
                    </div>
                  </Link>
                </div>
              </Card>

              <Card className="p-6 border border-border bg-primary/5 text-foreground space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <HelpCircle size={16} className="text-primary" /> Ask Volt AI
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our AI assistant Volt in the bottom right corner can troubleshoot common solar inverter codes, check product compatibility, or check ticket status in seconds.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};

export default Support;
