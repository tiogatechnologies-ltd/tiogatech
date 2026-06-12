import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, UserPlus, Trash2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import type { AppRole } from "@/contexts/AuthContext";

const ROLES: AppRole[] = ["admin", "staff", "affiliate", "customer"];

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const rolesByUser: Record<string, string[]> = {};
    (roles || []).forEach((r: any) => {
      rolesByUser[r.user_id] = [...(rolesByUser[r.user_id] || []), r.role];
    });
    setUsers((profiles || []).map((p: any) => ({ ...p, roles: rolesByUser[p.id] || [] })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (userId: string, role: AppRole, currentlyHas: boolean) => {
    if (currentlyHas) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) { toast.error(error.message); return; }
      toast.success(`Removed "${role}"`);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) { toast.error(error.message); return; }
      toast.success(`Granted "${role}"`);
    }
    load();
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || (u.email || "").toLowerCase().includes(q) || (u.full_name || "").toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Users & Roles</h1>
          <p className="text-sm text-muted-foreground">Manage who can access admin, affiliate or customer features.</p>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm" />
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground"><Loader2 className="animate-spin mx-auto" size={20} /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No users found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Roles</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{u.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
                        {u.roles.map((r: string) => (
                          <span key={r} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap gap-1.5 justify-end">
                        {ROLES.map((r) => {
                          const has = u.roles.includes(r);
                          return (
                            <button
                              key={r}
                              onClick={() => toggleRole(u.id, r, has)}
                              className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border transition-colors ${has ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20" : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary"}`}
                            >
                              {has ? `- ${r}` : `+ ${r}`}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
