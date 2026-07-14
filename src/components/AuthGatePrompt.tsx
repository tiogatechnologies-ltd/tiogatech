import { Link } from "react-router-dom";
import { LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { authHref } from "@/lib/authGate";

interface Props {
  title?: string;
  description?: string;
  next?: string;
  compact?: boolean;
}

/**
 * Friendly sign-up prompt shown when guests hit a gated feature.
 * Preserves their current location via ?next= so they return here after auth.
 */
const AuthGatePrompt = ({
  title = "Sign in to continue",
  description = "Create a free account to continue. Your details are saved.",
  next,
  compact,
}: Props) => {
  return (
    <div className={`rounded-2xl border border-border bg-card ${compact ? "p-4" : "p-6"} text-center space-y-3`}>
      <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 text-primary inline-flex items-center justify-center">
        <ShieldCheck size={18} />
      </div>
      <div>
        <h3 className="font-display font-bold text-base">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Link to={authHref(next, "signup")} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110">
          <UserPlus size={13} /> Sign up free
        </Link>
        <Link to={authHref(next, "signin")} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-muted">
          <LogIn size={13} /> Sign in
        </Link>
      </div>
    </div>
  );
};

export default AuthGatePrompt;
