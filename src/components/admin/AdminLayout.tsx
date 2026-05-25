import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Package, Users, Settings, LogOut, Menu, X, FileText, Layout, Mail, BarChart3, Briefcase, UserRoundCheck, Sun, Lock, Home, Smartphone, Newspaper, Send } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Products", icon: Package, path: "/admin/products" },
  { label: "Solar Packages", icon: Sun, path: "/admin/solar-packages" },
  { label: "Smart Locks", icon: Lock, path: "/admin/smart-locks" },
  { label: "Home Automation", icon: Home, path: "/admin/home-automation" },
  { label: "Leads", icon: Users, path: "/admin/leads" },
  { label: "App Waitlist", icon: Smartphone, path: "/admin/waitlist" },
  { label: "Newsletter", icon: Send, path: "/admin/newsletter" },
  { label: "Blog", icon: Newspaper, path: "/admin/blog" },
  { label: "Form Builder", icon: FileText, path: "/admin/forms" },
  { label: "Landing Sections", icon: Layout, path: "/admin/landing" },
  { label: "Static Pages", icon: FileText, path: "/admin/content" },
  { label: "Careers", icon: Briefcase, path: "/admin/careers" },
  { label: "Applications", icon: UserRoundCheck, path: "/admin/career-applications" },
  { label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { label: "Email", icon: Mail, path: "/admin/email" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary text-secondary-foreground transform transition-transform lg:translate-x-0 lg:static lg:z-auto flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-secondary-foreground/10 shrink-0">
          <span className="font-display text-lg font-bold tracking-tight">
            Tioga<span className="text-accent">.</span> Admin
          </span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-secondary-foreground/10">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === "/admin/landing" && location.pathname.startsWith("/admin/content"));
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/20 text-primary-foreground"
                    : "text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 p-4 border-t border-secondary-foreground/10">
          <div className="text-xs text-secondary-foreground/50 mb-2 truncate px-4">{user?.email}</div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-secondary-foreground transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors">
            <Menu size={20} />
          </button>
          <h1 className="font-display font-bold text-foreground text-lg">
            {navItems.find((n) => n.path === location.pathname)?.label ?? "Admin"}
          </h1>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
