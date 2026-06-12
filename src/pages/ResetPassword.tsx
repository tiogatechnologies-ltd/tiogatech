import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Loader2 } from "lucide-react";
import SEO from "@/components/SEO";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    toast.success("Password updated");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-muted/30">
      <SEO title="Reset your password" description="Set a new password for your Tioga account." path="/reset-password" />
      <div className="w-full max-w-sm bg-card rounded-3xl border border-border p-8 shadow-[var(--shadow-card)]">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3"><Lock size={22} /></div>
          <h1 className="text-xl font-display font-bold text-foreground">Set a new password</h1>
        </div>
        {error && <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            {submitting ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
