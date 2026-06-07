import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const CHANNELS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Twitter / X",
  "Facebook",
  "WhatsApp groups",
  "LinkedIn",
  "Blog / Website",
  "Email list",
  "In person referrals",
];

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(40),
  location: z.string().trim().max(120).optional(),
  audienceSize: z.string().trim().max(80).optional(),
  socialLinks: z.string().trim().max(1000).optional(),
  why: z.string().trim().max(2000).optional(),
});

type Values = z.infer<typeof schema>;

const AffiliateApplicationDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [channels, setChannels] = useState<string[]>([]);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      audienceSize: "",
      socialLinks: "",
      why: "",
    },
  });

  const toggleChannel = (c: string) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const submit = async (values: Values) => {
    if (submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from("affiliate_applications" as any).insert({
      full_name: values.fullName,
      email: values.email,
      phone: values.phone,
      location: values.location || null,
      audience_size: values.audienceSize || null,
      channels,
      social_links: values.socialLinks || null,
      why: values.why || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Application could not be submitted");
      return;
    }
    toast.success("Thanks! We'll review and reach out within a few business days.");
    form.reset();
    setChannels([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl no-clip flex items-center gap-2">
            <Sparkles className="text-accent" size={20} /> Become a Tioga Affiliate
          </DialogTitle>
          <DialogDescription>
            Earn commission on every solar, smart lock, or automation deal that closes through your unique link. Tell us about you and we'll set you up.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone / WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="0903 596 6388" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Lagos, Nigeria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="audienceSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audience size</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 12k followers" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel className="block mb-2">Where will you promote Tioga?</FormLabel>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((c) => {
                  const active = channels.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleChannel(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground/80 border-border hover:border-primary/40"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <FormField
              control={form.control}
              name="socialLinks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Social / Website links</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="https://instagram.com/yourhandle, https://yoursite.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="why"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why are you a great fit?</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Tell us about your audience and how you plan to promote Tioga (solar, smart locks, automation)."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-2xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
              Once approved, you'll receive a unique referral code, a tracked link, marketing assets, and a payout setup. Commission is paid on confirmed installations.
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-accent text-accent-foreground hover:brightness-110"
            >
              {submitting ? "Submitting…" : (<><Send size={16} /> Submit Application</>)}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AffiliateApplicationDialog;
