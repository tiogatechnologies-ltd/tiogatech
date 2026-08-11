import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ShieldCheck, LogIn, UserPlus, Mail, Loader2, ArrowLeft } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { z } from "zod";

type Tab = "signin" | "signup" | "forgot";

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

const Auth = () => {
  const { user, loading, isAdmin, isStaff, isAffiliate, hasRole, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialTab = (params.get("mode") as Tab) || "signin";
  const nextParam = params.get("next");
  const from = nextParam || ((location.state as any)?.from as string | undefined);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Catch a session that lands after an OAuth round-trip.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(from || "/", { replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate(from || "/", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate, from]);

  useEffect(() => {
    if (!loading && user) {
      // Role-based redirect (single source of truth: user_roles table).
      if (from) navigate(from, { replace: true });
      else if (isAdmin || isStaff) navigate("/admin", { replace: true });
      else if (hasRole("engineer")) navigate("/admin/assessments", { replace: true });
      else if (isAffiliate) navigate("/affiliate", { replace: true });
      else navigate("/account", { replace: true });
    }
  }, [user, loading, isAdmin, isStaff, isAffiliate, hasRole, navigate, from]);


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (err) setError(err);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = signUpSchema.safeParse({ full_name: fullName, email, password });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    const { error: err } = await signUp(parsed.data.email, parsed.data.password, parsed.data.full_name);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    toast.success("Account created! Please check your email to verify.");
    setTab("signin");
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    toast.success("Password reset link sent. Check your inbox.");
    setTab("signin");
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
       redirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
    }
  };




  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Sign in or create your Tioga account" description="Sign in to manage orders, financing applications, and your affiliate dashboard." path="/auth" />
      <SiteHeader />
      <main className="flex-1 grid place-items-center px-4 py-12 bg-muted/30">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft size={14} /> Back to website
          </Link>

          <div className="bg-card rounded-3xl border border-border shadow-[var(--shadow-card)] p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto mb-3">
                <ShieldCheck size={22} />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {tab === "signin" && "Welcome back"}
                {tab === "signup" && "Create your account"}
                {tab === "forgot" && "Reset your password"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {tab === "signin" && "Sign in to access your orders, financing and affiliate tools."}
                {tab === "signup" && "Start ordering, applying for financing, or join our affiliate program."}
                {tab === "forgot" && "We'll email you a secure link to reset your password."}
              </p>
            </div>

            {tab !== "forgot" && (
              <>
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-all disabled:opacity-50 mb-2"
                >
                  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.6l6.2 5.2C41.4 35.5 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z"/>
                  </svg>
                  Continue with Google
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth("apple")}
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-foreground bg-foreground px-6 py-3 text-sm font-semibold text-background hover:brightness-110 transition-all disabled:opacity-50 mb-3"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.05 20.28c-.98.95-2.05.86-3.08.4-1.09-.47-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continue with Apple
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-5 p-1 rounded-xl bg-muted">
                  <button onClick={() => setTab("signin")} className={`py-2 rounded-lg text-sm font-semibold transition-all ${tab === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Sign in</button>
                  <button onClick={() => setTab("signup")} className={`py-2 rounded-lg text-sm font-semibold transition-all ${tab === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Sign up</button>
                </div>
              </>
            )}



            {error && (
              <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>
            )}

            {tab === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-3">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                  {submitting ? "Signing in..." : "Sign in"}
                </button>
                <button type="button" onClick={() => setTab("forgot")} className="w-full text-xs text-muted-foreground hover:text-foreground py-1">Forgot password?</button>
              </form>
            )}

            {tab === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 characters)" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {submitting ? "Creating..." : "Create account"}
                </button>
                <p className="text-[11px] text-muted-foreground text-center">By signing up you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy</Link>.</p>
              </form>
            )}

            {tab === "forgot" && (
              <form onSubmit={handleForgot} className="space-y-3">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your account email" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  {submitting ? "Sending..." : "Send reset link"}
                </button>
                <button type="button" onClick={() => setTab("signin")} className="w-full text-xs text-muted-foreground hover:text-foreground py-1">← Back to sign in</button>
              </form>
            )}

          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Auth;
