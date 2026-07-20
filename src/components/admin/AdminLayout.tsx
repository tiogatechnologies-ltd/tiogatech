import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Package, Users, Settings, LogOut, Menu, X, FileText, Layout,
  Mail, BarChart3, Briefcase, UserRoundCheck, Sun, Lock, Home, Smartphone,
  Newspaper, Send, ShoppingBag, Share2, Wallet, LineChart, Globe, Tag,
  ScrollText, Calendar, Search, Calculator, Zap, Plus, Minus, Pin, PinOff,
} from "lucide-react";

interface AdminLayoutProps { children: React.ReactNode; }

type NavSubItem = { label: string; path: string };
type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  roles?: AppRole[];
  children?: NavSubItem[];
};
type NavGroup = { label: string; roles?: AppRole[]; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    roles: ["admin", "staff"],
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
      { label: "Analytics", icon: BarChart3, path: "/admin/analytics", roles: ["admin", "staff"], children: [
        { label: "Overview", path: "/admin/analytics?tab=overview" },
        { label: "Revenue", path: "/admin/analytics?tab=revenue" },
        { label: "Traffic", path: "/admin/analytics?tab=traffic" },
        { label: "Funnels", path: "/admin/analytics?tab=funnels" },
        { label: "Leads", path: "/admin/analytics?tab=leads" },
      ] },
    ],
  },
  {
    label: "Sales",
    roles: ["admin", "staff"],
    items: [
      { label: "Orders", icon: ShoppingBag, path: "/admin/orders", children: [
        { label: "All Orders", path: "/admin/orders" },
        { label: "Pending", path: "/admin/orders?status=pending" },
        { label: "Paid", path: "/admin/orders?status=paid" },
        { label: "Cancelled", path: "/admin/orders?status=cancelled" },
      ] },
      { label: "Customers", icon: Users, path: "/admin/customers", children: [
        { label: "All Customers", path: "/admin/customers" },
        { label: "Segments", path: "/admin/customers?view=segments" },
      ] },
      { label: "Leads", icon: Users, path: "/admin/leads" },
      { label: "Support Tickets", icon: FileText, path: "/admin/tickets" },
      { label: "Discounts", icon: Tag, path: "/admin/discounts" },
      { label: "App Waitlist", icon: Smartphone, path: "/admin/waitlist" },
    ],
  },
  {
    label: "Finance",
    roles: ["admin", "staff"],
    items: [
      { label: "Applications", icon: Wallet, path: "/admin/finance/applications" },
      { label: "Schedules", icon: Calendar, path: "/admin/finance/schedules" },
    ],
  },
  {
    label: "Assessments",
    roles: ["admin", "staff", "engineer"],
    items: [
      { label: "Solar Assessments", icon: Sun, path: "/admin/assessments", children: [
        { label: "All", path: "/admin/assessments" },
        { label: "Basic", path: "/admin/assessments?tier=basic" },
        { label: "Full", path: "/admin/assessments?tier=full" },
      ] },
      { label: "LumiVolt Sizings", icon: Calculator, path: "/admin/lumivolt-sizings" },
      { label: "Custom Requests", icon: FileText, path: "/admin/custom-requests" },
      { label: "AI Subscriptions", icon: Zap, path: "/admin/ai-subscriptions", roles: ["admin"] },
      { label: "AI Credit Usage", icon: BarChart3, path: "/admin/ai-usage", roles: ["admin", "staff"] },
    ],
  },
  {
    label: "Catalog",
    roles: ["admin", "staff"],
    items: [
      { label: "Products", icon: Package, path: "/admin/products", children: [
        { label: "All Products", path: "/admin/products" },
        { label: "Inventory", path: "/admin/inventory" },
      ] },
      { label: "Solar Packages", icon: Sun, path: "/admin/solar-packages" },
      { label: "Smart Locks", icon: Lock, path: "/admin/smart-locks" },
      { label: "Home Automation", icon: Home, path: "/admin/home-automation" },
    ],
  },
  {
    label: "Content",
    roles: ["admin", "staff"],
    items: [
      { label: "Blog", icon: Newspaper, path: "/admin/blog" },
      { label: "Landing Sections", icon: Layout, path: "/admin/landing", roles: ["admin"], children: [
        { label: "Landing Sections", path: "/admin/landing" },
        { label: "Static Pages", path: "/admin/content" },
      ] },
      { label: "Form Builder", icon: FileText, path: "/admin/forms", roles: ["admin"] },
    ],
  },
  {
    label: "Marketing",
    roles: ["admin", "staff"],
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
    roles: ["admin", "staff"],
    items: [
      { label: "Job Listings", icon: Briefcase, path: "/admin/careers", roles: ["admin"] },
      { label: "Applications", icon: UserRoundCheck, path: "/admin/career-applications" },
    ],
  },
  {
    label: "Tools",
    roles: ["admin", "staff", "engineer"],
    items: [
      { label: "Reports", icon: FileText, path: "/admin/reports", roles: ["admin", "staff"] },
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

// ---- Persistence helpers ----
const LS_GROUPS = "tioga.admin.sidebar.openGroups";
const LS_ITEMS = "tioga.admin.sidebar.openItems";
const LS_PINS = "tioga.admin.sidebar.pins";

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch { return new Set(); }
}
function saveSet(key: string, s: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify(Array.from(s))); } catch {}
}

const pathMatches = (target: string, current: string) => {
  const base = target.split("?")[0];
  return current === base || (base !== "/admin" && current.startsWith(base + "/"));
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { signOut, user, roles, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");

  const can = (required?: AppRole[]) => {
    if (!required || required.length === 0) return true;
    if (isAdmin) return true;
    return required.some((r) => roles.includes(r));
  };

  const visibleGroups = useMemo(() => navGroups
    .filter((g) => can(g.roles))
    .map((g) => ({ ...g, items: g.items.filter((i) => can(i.roles)) }))
    .filter((g) => g.items.length > 0),
    [isAdmin, roles.join(",")]
  );

  // Determine which group/item contains the active route
  const activeGroupLabel = useMemo(() => {
    for (const g of visibleGroups) {
      for (const i of g.items) {
        if (pathMatches(i.path, location.pathname)) return g.label;
      }
    }
    return null;
  }, [visibleGroups, location.pathname]);

  const activeItemPath = useMemo(() => {
    for (const g of visibleGroups) {
      for (const i of g.items) {
        if (pathMatches(i.path, location.pathname)) return i.path;
      }
    }
    return null;
  }, [visibleGroups, location.pathname]);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => loadSet(LS_GROUPS));
  const [openItems, setOpenItems] = useState<Set<string>>(() => loadSet(LS_ITEMS));
  const [pins, setPins] = useState<Set<string>>(() => loadSet(LS_PINS));

  // On mount / route change, ensure active group is open (only if user hasn't
  // explicitly toggled — we always guarantee the active group is visible).
  const hasHydrated = useRef(false);
  useEffect(() => {
    if (activeGroupLabel) {
      setOpenGroups((prev) => {
        if (prev.has(activeGroupLabel)) return prev;
        const next = new Set(prev);
        // On first hydration, if no groups saved, only open the active one.
        if (!hasHydrated.current && prev.size === 0) {
          next.add(activeGroupLabel);
        } else {
          next.add(activeGroupLabel);
        }
        return next;
      });
    }
    if (activeItemPath) {
      setOpenItems((prev) => {
        if (prev.has(activeItemPath)) return prev;
        const next = new Set(prev);
        next.add(activeItemPath);
        return next;
      });
    }
    hasHydrated.current = true;
  }, [activeGroupLabel, activeItemPath]);

  useEffect(() => { saveSet(LS_GROUPS, openGroups); }, [openGroups]);
  useEffect(() => { saveSet(LS_ITEMS, openItems); }, [openItems]);
  useEffect(() => { saveSet(LS_PINS, pins); }, [pins]);

  const toggleGroup = (label: string) => setOpenGroups((p) => {
    const n = new Set(p); n.has(label) ? n.delete(label) : n.add(label); return n;
  });
  const toggleItem = (path: string) => setOpenItems((p) => {
    const n = new Set(p); n.has(path) ? n.delete(path) : n.add(path); return n;
  });
  const togglePin = (path: string) => setPins((p) => {
    const n = new Set(p); n.has(path) ? n.delete(path) : n.add(path); return n;
  });

  // Search filter — matches labels; auto-expand any group/item with a match.
  const q = query.trim().toLowerCase();
  const matches = useCallback((s: string) => s.toLowerCase().includes(q), [q]);

  const filteredGroups = useMemo(() => {
    if (!q) return visibleGroups;
    return visibleGroups
      .map((g) => {
        const items = g.items
          .map((i) => {
            const childHit = i.children?.filter((c) => matches(c.label)) ?? [];
            const itemHit = matches(i.label) || matches(g.label);
            if (!itemHit && childHit.length === 0) return null;
            return { ...i, children: itemHit ? i.children : childHit };
          })
          .filter(Boolean) as NavItem[];
        if (items.length === 0 && !matches(g.label)) return null;
        return { ...g, items };
      })
      .filter(Boolean) as NavGroup[];
  }, [q, visibleGroups, matches]);

  // While searching, force-expand all groups & items that survived filtering.
  const isGroupOpen = (label: string) => q ? true : openGroups.has(label);
  const isItemOpen = (path: string) => q ? true : openItems.has(path);

  // Flatten pins to renderable objects
  const pinnedEntries = useMemo(() => {
    const all: Array<{ label: string; path: string; icon: any; parentLabel?: string }> = [];
    for (const g of visibleGroups) {
      for (const i of g.items) {
        if (pins.has(i.path)) all.push({ label: i.label, path: i.path, icon: i.icon });
        i.children?.forEach((c) => {
          if (pins.has(c.path)) all.push({ label: c.label, path: c.path, icon: i.icon, parentLabel: i.label });
        });
      }
    }
    return all;
  }, [pins, visibleGroups]);

  const handleSignOut = async () => { await signOut(); navigate("/admin/login"); };

  const isActiveExact = (path: string) => {
    const [base, qs] = path.split("?");
    if (location.pathname !== base) return false;
    if (!qs) return location.search === "" || !path.includes("?");
    // Query-param sub-items: match if all params in target present
    const target = new URLSearchParams(qs);
    const current = new URLSearchParams(location.search);
    for (const [k, v] of target.entries()) if (current.get(k) !== v) return false;
    return true;
  };

  const go = (path: string) => { navigate(path); setSidebarOpen(false); };

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (<div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />)}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary text-secondary-foreground transform transition-transform lg:translate-x-0 lg:static lg:z-auto flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-foreground/10 shrink-0">
          <span className="font-display text-lg font-bold tracking-tight">Tioga<span className="text-accent">.</span> Admin</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-secondary-foreground/10"><X size={18} /></button>
        </div>

        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search admin…"
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary-foreground/5 border border-secondary-foreground/10 text-sm placeholder:text-secondary-foreground/40 outline-none focus:border-accent/50"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
          {loading ? (
            <div className="space-y-2 px-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-secondary-foreground/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {pinnedEntries.length > 0 && !q && (
                <div className="space-y-0.5 pb-2 border-b border-secondary-foreground/10">
                  <div className="flex items-center px-2 py-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground/40">Pinned</p>
                  </div>
                  {pinnedEntries.map((p) => {
                    const active = isActiveExact(p.path);
                    return (
                      <div key={p.path} className="group flex items-center gap-1">
                        <button
                          onClick={() => go(p.path)}
                          className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${active ? "bg-primary/20 text-primary-foreground border-l-2 border-accent" : "text-secondary-foreground/80 hover:bg-secondary-foreground/10"}`}
                        >
                          <p.icon size={16} />
                          <span className="truncate">{p.label}</span>
                          {p.parentLabel && <span className="ml-auto text-[9px] uppercase tracking-wider text-secondary-foreground/40">{p.parentLabel}</span>}
                        </button>
                        <button onClick={() => togglePin(p.path)} className="p-1 rounded hover:bg-secondary-foreground/10 opacity-0 group-hover:opacity-100 transition"><PinOff size={12} /></button>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredGroups.map((group) => {
                const groupOpen = isGroupOpen(group.label);
                return (
                  <div key={group.label} className="space-y-0.5">
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className="w-full flex items-center px-2 py-1.5 rounded-md hover:bg-secondary-foreground/5 transition"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary-foreground/50">{group.label}</span>
                      <span className="ml-auto text-secondary-foreground/40">
                        {groupOpen ? <Minus size={12} /> : <Plus size={12} />}
                      </span>
                    </button>
                    {groupOpen && group.items.map((item) => {
                      const active = isActiveExact(item.path) || pathMatches(item.path, location.pathname);
                      const hasChildren = !!item.children && item.children.length > 0;
                      const itemOpen = isItemOpen(item.path);
                      return (
                        <div key={item.path}>
                          <div className="group flex items-center gap-0.5">
                            <button
                              onClick={() => go(item.path)}
                              className={`flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${active && isActiveExact(item.path) ? "bg-primary/20 text-primary-foreground border-l-2 border-accent" : active ? "text-secondary-foreground" : "text-secondary-foreground/75 hover:bg-secondary-foreground/10 hover:text-secondary-foreground"}`}
                            >
                              <item.icon size={16} />
                              <span className="truncate">{item.label}</span>
                            </button>
                            <button
                              onClick={() => togglePin(item.path)}
                              title={pins.has(item.path) ? "Unpin" : "Pin"}
                              className="p-1 rounded hover:bg-secondary-foreground/10 opacity-0 group-hover:opacity-100 transition"
                            >
                              {pins.has(item.path) ? <PinOff size={12} /> : <Pin size={12} />}
                            </button>
                            {hasChildren && (
                              <button
                                onClick={() => toggleItem(item.path)}
                                className="p-1 rounded hover:bg-secondary-foreground/10 text-secondary-foreground/50"
                              >
                                {itemOpen ? <Minus size={12} /> : <Plus size={12} />}
                              </button>
                            )}
                          </div>
                          {hasChildren && itemOpen && (
                            <div className="ml-6 mt-0.5 mb-1 pl-2 border-l border-secondary-foreground/10 space-y-0.5">
                              {item.children!.map((c) => {
                                const cActive = isActiveExact(c.path);
                                return (
                                  <div key={c.path} className="group flex items-center gap-0.5">
                                    <button
                                      onClick={() => go(c.path)}
                                      className={`flex-1 flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-md text-[13px] transition-all ${cActive ? "bg-accent/15 text-secondary-foreground font-medium" : "text-secondary-foreground/60 hover:bg-secondary-foreground/10 hover:text-secondary-foreground/90"}`}
                                    >
                                      <span className="inline-block w-1 h-1 rounded-full bg-current opacity-60" />
                                      <span className="truncate">{c.label}</span>
                                    </button>
                                    <button
                                      onClick={() => togglePin(c.path)}
                                      title={pins.has(c.path) ? "Unpin" : "Pin"}
                                      className="p-1 rounded hover:bg-secondary-foreground/10 opacity-0 group-hover:opacity-100 transition"
                                    >
                                      {pins.has(c.path) ? <PinOff size={11} /> : <Pin size={11} />}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {q && filteredGroups.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-secondary-foreground/40">No matches</div>
              )}
            </>
          )}
        </nav>

        <div className="shrink-0 p-3 border-t border-secondary-foreground/10 space-y-1">
          <div className="text-xs text-secondary-foreground/50 mb-2 truncate px-2">{user?.email}</div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-secondary-foreground transition-all">
            <LogOut size={16} /> Sign Out
          </button>
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-secondary-foreground transition-all">
            <Globe size={16} /> Back to Website
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

// ---- Quick search (top header ⌘K palette, unchanged behavior) ----
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
