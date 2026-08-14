import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, LogIn, Loader2 } from "lucide-react";
import AdminSEO from "@/components/AdminSEO";

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

const AdminLogin = () => {
  const { signIn, signInWithGoogle, loading, isStaff, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && isStaff) navigate("/admin", { replace: true });
  }, [loading, user, isStaff, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user && !isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-sm text-center space-y-3">
          <ShieldCheck className="mx-auto text-muted-foreground" size={32} />
          <p className="text-sm text-muted-foreground">This account does not have admin or staff access. Please contact your administrator.</p>
          <button onClick={() => navigate("/")} className="text-sm text-primary font-semibold">Back to website</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: err } = await signIn(email, password);
    if (err) {
      setError(err);
      setSubmitting(false);
      return;
    }
    await refreshProfile();
    setSubmitting(false);
    navigate("/admin", { replace: true });
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleSubmitting(true);
    const { error: err } = await signInWithGoogle(`${window.location.origin}/admin`);
    if (err) {
      setError(err);
      setGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <AdminSEO title="Admin Login" />
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage your Tioga dashboard</p>
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleSubmitting || submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background hover:bg-muted/60 text-foreground px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98] shadow-sm disabled:opacity-50"
        >
          {googleSubmitting ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
          Sign in with Google
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or with email password</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
              placeholder="admin@tiogatechnologies.com"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting || googleSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <button onClick={() => navigate("/")} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to website
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
