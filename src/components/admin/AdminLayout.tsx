import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { LayoutDashboard, Package, Users, Settings, LogOut, Menu, X, FileText, Layout, Mail, BarChart3, Briefcase, UserRoundCheck, Sun, Lock, Home, Smartphone, Newspaper, Send, ShoppingBag, Share2, Wallet, LineChart, Globe, Tag, ScrollText, Calendar, Search, Calculator, Zap } from "lucide-react";

interface AdminLayoutProps { children: React.ReactNode; }

type NavItem = { label: string; icon: typeof LayoutDashboard; path: string; roles?: AppRole[] };
type NavGroup = { label: string; roles?: AppRole[]; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
      { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", icon: ShoppingBag, path: "/admin/orders" },
      { label: "Customers", icon: Users, path: "/admin/customers" },
      { label: "Leads", icon: Users, path: "/admin/leads" },
      { label: "Discounts", icon: Tag, path: "/admin/discounts" },
      { label: "App Waitlist", icon: Smartphone, path: "/admin/waitlist" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Applications", icon: Wallet, path: "/admin/finance/applications" },
      { label: "Schedules", icon: Calendar, path: "/admin/finance/schedules" },
    ],
  },
  {
    label: "Assessments",
    roles: ["admin", "staff", "engineer"],
    items: [
      { label: "Solar Assessments", icon: Sun, path: "/admin/assessments" },
      { label: "LumiVolt Sizings", icon: Calculator, path: "/admin/lumivolt-sizings" },
      { label: "Custom Requests", icon: FileText, path: "/admin/custom-requests" },
      { label: "AI Subscriptions", icon: Zap, path: "/admin/ai-subscriptions", roles: ["admin", "staff"] },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", icon: Package, path: "/admin/products" },
      { label: "Inventory", icon: Package, path: "/admin/inventory" },
      { label: "Solar Packages", icon: Sun, path: "/admin/solar-packages" },
      { label: "Smart Locks", icon: Lock, path: "/admin/smart-locks" },
      { label: "Home Automation", icon: Home, path: "/admin/home-automation" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Blog", icon: Newspaper, path: "/admin/blog" },
      { label: "Landing Sections", icon: Layout, path: "/admin/landing" },
      { label: "Static Pages", icon: FileText, path: "/admin/content" },
      { label: "Form Builder", icon: FileText, path: "/admin/forms", roles: ["admin"] },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Newsletter", icon: Send, path: "/admin/newsletter" },
      { label: "Email", icon: Mail, path: "/admin/email" },
    ],
  },
  {
    label: "Affiliates",
    roles: ["admin"],
    items: [
      { label: "Affiliates", icon: Share2, path: "/admin/affiliates" },
      { label: "Payouts", icon: Wallet, path: "/admin/affiliates/payouts" },
      { label: "Analytics", icon: LineChart, path: "/admin/affiliates/analytics" },
    ],
  },
  {
    label: "Careers",
    items: [
      { label: "Job Listings", icon: Briefcase, path: "/admin/careers" },
      { label: "Applications", icon: UserRoundCheck, path: "/admin/career-applications" },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Reports", icon: FileText, path: "/admin/reports" },
      { label: "Media Library", icon: Layout, path: "/admin/storage" },
    ],
  },
  {
    label: "System",
    roles: ["admin"],
    items: [
      { label: "Users & Roles", icon: UserRoundCheck, path: "/admin/users" },
      { label: "Audit Log", icon: ScrollText, path: "/admin/audit-log" },
      { label: "Settings", icon: Settings, path: "/admin/settings" },
    ],
  },
];

const allNavItems = navGroups.flatMap((g) => g.items);

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { signOut, user, roles, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const can = (required?: AppRole[]) => {
    if (!required || required.length === 0) return true;
    if (isAdmin) return true;
    return required.some((r) => roles.includes(r));
  };

  const visibleGroups = navGroups
    .filter((g) => can(g.roles))
    .map((g) => ({ ...g, items: g.items.filter((i) => can(i.roles)) }))
    .filter((g) => g.items.length > 0);

  const handleSignOut = async () => { await signOut(); navigate("/admin/login"); };

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (<div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />)}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary text-secondary-foreground transform transition-transform lg:translate-x-0 lg:static lg:z-auto flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-secondary-foreground/10 shrink-0">
          <span className="font-display text-lg font-bold tracking-tight">Tioga<span className="text-accent">.</span> Admin</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-secondary-foreground/10"><X size={18} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-5">
          {loading ? (
            <div className="space-y-2 px-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-secondary-foreground/5 animate-pulse" />
              ))}
            </div>
          ) : visibleGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-4 text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground/40 mb-1.5">{group.label}</p>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path === "/admin/landing" && location.pathname.startsWith("/admin/content"));
                return (
                  <button key={item.path} onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-primary/20 text-primary-foreground" : "text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-secondary-foreground"}`}>
                    <item.icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="shrink-0 p-4 border-t border-secondary-foreground/10 space-y-1">
          <div className="text-xs text-secondary-foreground/50 mb-2 truncate px-4">{user?.email}</div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-secondary-foreground transition-all">
            <LogOut size={18} /> Sign Out
          </button>
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-secondary-foreground transition-all">
            <Globe size={18} /> Back to Website
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"><Menu size={20} /></button>
          <h1 className="font-display font-bold text-foreground text-base sm:text-lg truncate">{allNavItems.find((n) => n.path === location.pathname)?.label ?? "Admin"}</h1>
          <div className="ml-auto"><AdminSearch items={visibleGroups.flatMap(g => g.items.map(i => ({ ...i, group: g.label })))} /></div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

// ---- Quick search ----
function AdminSearch({ items }: { items: Array<{ label: string; path: string; group: string; icon: any }> }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else setQ("");
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items.slice(0, 8);
    return items.filter(i => i.label.toLowerCase().includes(term) || i.group.toLowerCase().includes(term)).slice(0, 10);
  }, [q, items]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-sm text-muted-foreground min-w-[180px] sm:min-w-[240px]">
        <Search size={15} />
        <span className="hidden sm:inline">Search admin…</span>
        <span className="sm:hidden">Search</span>
        <kbd className="ml-auto hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-background border border-border">⌘K</kbd>
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] bg-foreground/40 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Search size={16} className="text-muted-foreground" />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages, sections…" className="flex-1 bg-transparent outline-none text-sm" />
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto py-2">
              {results.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No matches</div>
              ) : results.map((r) => (
                <button key={r.path} onClick={() => { navigate(r.path); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left">
                  <r.icon size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium">{r.label}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">{r.group}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminLayout;
