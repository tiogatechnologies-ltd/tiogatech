import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogIn, LogOut, Package, ShieldCheck, Share2, Sun, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const AccountButton = ({ onDark = false }: { onDark?: boolean }) => {
  const { user, profile, isAdmin, isStaff, isAffiliate, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!user) {
    return (
      <Link
        to="/auth"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
          onDark ? "text-primary-foreground hover:bg-primary-foreground/10" : "text-foreground hover:bg-muted"
        )}
        aria-label="Sign in"
      >
        <LogIn size={14} />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  const initial = (profile?.full_name || user.email || "?")[0]?.toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full p-1.5 transition-colors",
          onDark ? "hover:bg-primary-foreground/10" : "hover:bg-muted"
        )}
        aria-label="Account menu"
      >
        <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold grid place-items-center">{initial}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || user.email}</p>
          </div>
          <div className="py-1">
            <Link to="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted">
              <User size={14} /> My account
            </Link>
            <Link to="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted">
              <Package size={14} /> My orders
            </Link>
            <Link to="/account/assessments" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted">
              <Sun size={14} /> My AI assessments
            </Link>
            <Link to="/account/subscription" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted">
              <Zap size={14} /> AI plan & credits
            </Link>
            {isAffiliate && (
              <Link to="/affiliate" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted">
                <Share2 size={14} /> Affiliate
              </Link>
            )}
            {isStaff && (
              <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted">
                <ShieldCheck size={14} /> {isAdmin ? "Admin" : "Staff"} dashboard
              </Link>
            )}
          </div>
          <button onClick={() => { setOpen(false); signOut(); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 border-t border-border">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountButton;
