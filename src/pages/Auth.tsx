import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, LogIn, UserPlus, Mail, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
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

const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const Auth = () => {
  const { user, loading, isAdmin, isStaff, isAffiliate, hasRole, signIn, signInWithGoogle, signUp } = useAuth();
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
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Capture and display any OAuth callback errors from query or hash
  useEffect(() => {
    const errorDesc = params.get("error_description") || params.get("error");
    if (errorDesc) {
      setError(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
      return;
    }
    // Also check hash params in case provider redirects with hash error
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashErr = hashParams.get("error_description") || hashParams.get("error");
      if (hashErr) {
        setError(decodeURIComponent(hashErr.replace(/\+/g, " ")));
      }
    }
  }, [location.search, location.hash]);

  useEffect(() => {
    // Safety net: if a session exists (e.g. after an OAuth round-trip) but the
    // role-based redirect below hasn't fired, leave /auth anyway.
    let timer: ReturnType<typeof setTimeout>;
    const bounce = (session: unknown) => {
      if (!session) return;
      clearTimeout(timer);
      timer = setTimeout(() => navigate(from || "/", { replace: true }), 1200);
    };
    supabase.auth.getSession().then(({ data: { session } }) => bounce(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => bounce(session));
    return () => { clearTimeout(timer); subscription.unsubscribe(); };
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

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleSubmitting(true);
    const redirectTarget = from ? `${window.location.origin}${from}` : `${window.location.origin}/auth`;
    const { error: err } = await signInWithGoogle(redirectTarget);
    if (err) {
      setError(err);
      setGoogleSubmitting(false);
    }
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
              <div className="grid grid-cols-2 gap-2 mb-5 p-1 rounded-xl bg-muted">
                <button onClick={() => setTab("signin")} className={`py-2 rounded-lg text-sm font-semibold transition-all ${tab === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Sign in</button>
                <button onClick={() => setTab("signup")} className={`py-2 rounded-lg text-sm font-semibold transition-all ${tab === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Sign up</button>
              </div>
            )}

            {/* Google SSO Button */}
            {tab !== "forgot" && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleSubmitting || submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background hover:bg-muted/60 text-foreground px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
                >
                  {googleSubmitting ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
                  {tab === "signin" ? "Continue with Google" : "Sign up with Google"}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>
            )}

            {tab === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-3">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="submit" disabled={submitting || googleSubmitting} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
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
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 characters)" className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="submit" disabled={submitting || googleSubmitting} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50">
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
