import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { AppRole } from "@/contexts/AuthContext";

const ROLES: AppRole[] = ["admin", "staff", "affiliate", "customer"];

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
}

interface CustomRole { key: string; label: string; base_role: string }

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | AppRole>("all");
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [userCustom, setUserCustom] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const [usersRes, crRes, ucrRes] = await Promise.all([
      supabase.functions.invoke("list-users"),
      supabase.from("custom_roles").select("*"),
      supabase.from("user_custom_roles").select("user_id, custom_role_key"),
    ]);
    if (usersRes.error) {
      toast.error(usersRes.error.message || "Failed to load users");
      setUsers([]);
    } else {
      setUsers(((usersRes.data as any)?.users ?? []) as UserRow[]);
    }
    setCustomRoles((crRes.data as CustomRole[]) ?? []);
    const map: Record<string, string> = {};
    (ucrRes.data ?? []).forEach((r: any) => { map[r.user_id] = r.custom_role_key; });
    setUserCustom(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setCustomFor = async (userId: string, key: string) => {
    if (!key) {
      const { error } = await supabase.from("user_custom_roles").delete().eq("user_id", userId);
      if (error) return toast.error(error.message);
      toast.success("Custom role cleared");
    } else {
      const { error } = await supabase
        .from("user_custom_roles")
        .upsert({ user_id: userId, custom_role_key: key }, { onConflict: "user_id" });
      if (error) return toast.error(error.message);
      toast.success("Custom role assigned");
    }
    load();
  };

  const toggleRole = async (userId: string, role: AppRole, currentlyHas: boolean) => {
    if (currentlyHas) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
      toast.success(`Removed "${role}"`);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
      toast.success(`Granted "${role}"`);
    }
    load();
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchQ = !q || (u.email || "").toLowerCase().includes(q) || (u.full_name || "").toLowerCase().includes(q);
    const matchR = filter === "all" || u.roles.includes(filter);
    return matchQ && matchR;
  });

  const counts = ROLES.reduce<Record<string, number>>((acc, r) => {
    acc[r] = users.filter((u) => u.roles.includes(r)).length;
    return acc;
  }, { all: users.length });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Users & Roles</h1>
            <p className="text-sm text-muted-foreground">Manage who can access admin, staff, affiliate or customer features.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted"><RefreshCw size={12} /> Refresh</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(["all", ...ROLES] as const).map((r) => (
            <button key={r} onClick={() => setFilter(r as any)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-colors ${filter === r ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40"}`}>
              {r} <span className="opacity-60">({counts[r] ?? 0})</span>
            </button>
          ))}
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3 hidden md:table-cell">Joined</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Last Sign In</th>
                    <th className="px-4 py-3">Roles</th>
                    <th className="px-4 py-3">Custom Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{u.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {ROLES.map((r) => {
                            const has = u.roles.includes(r);
                            return (
                              <button key={r} onClick={() => toggleRole(u.id, r, has)}
                                className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border transition-colors ${has ? "bg-primary/10 text-primary border-primary/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary"}`}
                                title={has ? `Click to remove ${r}` : `Click to grant ${r}`}>
                                {r}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={userCustom[u.id] ?? ""}
                          onChange={(e) => setCustomFor(u.id, e.target.value)}
                          className="text-xs px-2 py-1.5 rounded-lg border border-border bg-background"
                          disabled={customRoles.length === 0}
                        >
                          <option value="">— none —</option>
                          {customRoles.map((c) => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">Showing {filtered.length} of {users.length} users. Click a role pill to toggle it.</p>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
