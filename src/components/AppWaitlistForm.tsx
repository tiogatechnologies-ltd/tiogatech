import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Smartphone } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  platform: z.enum(["ios", "android", "both"]),
});

const platforms: { value: "ios" | "android" | "both"; label: string }[] = [
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
  { value: "both", label: "Both" },
];

const AppWaitlistForm = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState<"ios" | "android" | "both">("both");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ full_name: fullName, email, platform });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("app_waitlist").insert(parsed.data);
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        toast.success("You are already on the waitlist. We will be in touch.");
        setDone(true);
        return;
      }
      toast.error("Something went wrong. Please try again.");
      return;
    }
    toast.success("You are on the waitlist!");
    setDone(true);
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto rounded-2xl bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 p-6 text-center text-primary-foreground">
        <CheckCircle2 size={40} className="mx-auto text-gold mb-3" />
        <h3 className="font-display font-bold text-xl mb-1">You are in.</h3>
        <p className="text-sm text-primary-foreground/80">We will email you the moment the app goes live.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-md mx-auto rounded-2xl bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 p-5 sm:p-6 space-y-3 text-left">
      <div className="flex items-center gap-2 text-primary-foreground/85 text-xs uppercase tracking-[0.18em] font-semibold">
        <Smartphone size={14} /> Join the launch waitlist
      </div>
      <input
        type="text"
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full name"
        className="w-full rounded-xl bg-primary-foreground/15 border border-primary-foreground/25 px-4 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/55 focus:outline-none focus:ring-2 focus:ring-gold/60"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        className="w-full rounded-xl bg-primary-foreground/15 border border-primary-foreground/25 px-4 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/55 focus:outline-none focus:ring-2 focus:ring-gold/60"
      />
      <div className="grid grid-cols-3 gap-2">
        {platforms.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPlatform(p.value)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold border transition-all ${
              platform === p.value
                ? "bg-gold text-midnight border-gold"
                : "bg-primary-foreground/10 text-primary-foreground border-primary-foreground/25 hover:bg-primary-foreground/15"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gold text-midnight font-bold text-sm py-3 hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-gold/30 disabled:opacity-60"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
        {submitting ? "Joining..." : "Notify me at launch"}
      </button>
      <p className="text-[10px] text-primary-foreground/55 text-center">
        We will only email you about the app launch. No spam.
      </p>
    </form>
  );
};

export default AppWaitlistForm;
