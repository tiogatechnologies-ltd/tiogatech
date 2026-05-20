import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import AdminSEO from "@/components/AdminSEO";

const AdminSetup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);

    // Sign up user
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    if (data.user) {
      // Assign admin role via edge function
      const { error: roleError } = await supabase.functions.invoke("assign-admin-role", {
        body: { user_id: data.user.id },
      });

      if (roleError) {
        toast.error("Account created but failed to assign admin role. Contact support.");
      } else {
        toast.success("Admin account created! Signing you in...");
        // Sign in
        await supabase.auth.signInWithPassword({ email, password });
        navigate("/admin");
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <AdminSEO title="Admin Setup" />
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Admin Setup</h1>
          <p className="text-sm text-muted-foreground">Create your admin account for the first time</p>
        </div>

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
              placeholder="admin@tiogatechnologies.com" required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
              placeholder="Min 6 characters" required
            />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-40">
            <UserPlus size={16} />
            {submitting ? "Creating..." : "Create Admin Account"}
          </button>
        </form>
        <button onClick={() => navigate("/admin/login")} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
};

export default AdminSetup;
