import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Users, TrendingUp, Clock } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminSEO from "@/components/AdminSEO";

interface Stats {
  totalLeads: number;
  totalProducts: number;
  recentLeads: number;
  todayLeads: number;
}

interface RecentLead {
  id: string;
  full_name: string;
  phone: string;
  products: string[];
  budget: string | null;
  created_at: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({ totalLeads: 0, totalProducts: 0, recentLeads: 0, todayLeads: 0 });
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);

      const [leadsRes, productsRes, recentRes, todayRes, latestRes] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("leads").select("id, full_name, phone, products, budget, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      setStats({
        totalLeads: leadsRes.count ?? 0,
        totalProducts: productsRes.count ?? 0,
        recentLeads: recentRes.count ?? 0,
        todayLeads: todayRes.count ?? 0,
      });
      setRecentLeads((latestRes.data as RecentLead[]) ?? []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime: auto-refresh on new leads
    const channel = supabase
      .channel("dashboard-leads")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const statCards = [
    { label: "Total Leads", value: stats.totalLeads, icon: Users, color: "text-primary" },
    { label: "Total Products", value: stats.totalProducts, icon: Package, color: "text-accent" },
    { label: "Leads This Week", value: stats.recentLeads, icon: TrendingUp, color: "text-primary" },
    { label: "Leads Today", value: stats.todayLeads, icon: Clock, color: "text-accent" },
  ];

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(s => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                  <s.icon size={16} className={s.color} />
                </div>
                <p className="text-2xl font-display font-bold text-card-foreground">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-display font-bold text-card-foreground">Recent Leads</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-5 py-3 font-medium">Name</th>
                    <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Phone</th>
                    <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Interests</th>
                    <th className="text-left px-5 py-3 font-medium">Budget</th>
                    <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map(lead => (
                    <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-5 py-3 font-medium text-card-foreground">{lead.full_name}</td>
                      <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{lead.phone}</td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {lead.products.slice(0, 2).map(p => (
                            <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{p}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{lead.budget ?? "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{new Date(lead.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {recentLeads.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No leads yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
