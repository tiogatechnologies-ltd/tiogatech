import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_PAGES, BASE_TOGGLE_ROLES } from "@/lib/adminPages";
import type { AppRole } from "@/contexts/AuthContext";
import { Loader2, Plus, Trash2, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";

type CustomRole = { key: string; label: string; base_role: AppRole };
type Override = { role_key: string; page_key: string; allowed: boolean };

const AdminRoles = () => {
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create-custom-role form
  const [newLabel, setNewLabel] = useState("");
  const [newBase, setNewBase] = useState<AppRole>("staff");

  const load = async () => {
    setLoading(true);
    const [cr, op] = await Promise.all([
      supabase.from("custom_roles").select("*").order("created_at"),
      supabase.from("role_page_permissions").select("*"),
    ]);
    setCustomRoles((cr.data as CustomRole[]) ?? []);
    setOverrides((op.data as Override[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const roleKeys = useMemo(
    () => [...BASE_TOGGLE_ROLES, ...customRoles.map((c) => c.key)],
    [customRoles]
  );

  const groupedPages = useMemo(() => {
    const map = new Map<string, typeof ADMIN_PAGES>();
    for (const p of ADMIN_PAGES) {
      if (!map.has(p.group)) map.set(p.group, [] as any);
      (map.get(p.group) as any).push(p);
    }
    return Array.from(map.entries());
  }, []);

  const isAllowed = (roleKey: string, pageKey: string): boolean => {
    const ov = overrides.find((o) => o.role_key === roleKey && o.page_key === pageKey);
    if (ov) return ov.allowed;
    const page = ADMIN_PAGES.find((p) => p.key === pageKey)!;
    // Custom roles default to their base_role's defaults
    const cr = customRoles.find((c) => c.key === roleKey);
    const effectiveBase = (cr?.base_role ?? roleKey) as AppRole;
    return page.defaultRoles.includes(effectiveBase);
  };

  const toggle = (roleKey: string, pageKey: string) => {
    const current = isAllowed(roleKey, pageKey);
    setOverrides((prev) => {
      const others = prev.filter((o) => !(o.role_key === roleKey && o.page_key === pageKey));
      return [...others, { role_key: roleKey, page_key: pageKey, allowed: !current }];
    });
  };

  const saveAll = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("role_page_permissions")
      .upsert(overrides, { onConflict: "role_key,page_key" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Permissions saved");
    load();
  };

  const resetRole = async (roleKey: string) => {
    if (!confirm(`Reset all overrides for "${roleKey}" back to defaults?`)) return;
    const { error } = await supabase.from("role_page_permissions").delete().eq("role_key", roleKey);
    if (error) return toast.error(error.message);
    toast.success("Reset to defaults");
    load();
  };

  const addCustomRole = async () => {
    const label = newLabel.trim();
    if (!label) return toast.error("Enter a name");
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (!key) return toast.error("Invalid name");
    const { error } = await supabase.from("custom_roles").insert({ key, label, base_role: newBase });
    if (error) return toast.error(error.message);
    toast.success(`Created "${label}"`);
    setNewLabel("");
    load();
  };

  const deleteCustomRole = async (key: string) => {
    if (!confirm(`Delete role "${key}"? Users assigned to it will lose it.`)) return;
    const { error } = await supabase.from("custom_roles").delete().eq("key", key);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Role Permissions</h1>
            <p className="text-sm text-muted-foreground">Choose which admin sections each role can see. Admin always has full access.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted">
              <RefreshCw size={12} /> Reload
            </button>
            <button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save changes
            </button>
          </div>
        </div>

        {/* Custom roles */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Custom roles</h2>
            <span className="text-xs text-muted-foreground">{customRoles.length} defined</span>
          </div>
          {customRoles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customRoles.map((c) => (
                <span key={c.key} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-xs">
                  <span className="font-semibold">{c.label}</span>
                  <span className="text-muted-foreground">inherits {c.base_role}</span>
                  <button onClick={() => deleteCustomRole(c.key)} className="text-destructive hover:opacity-70"><Trash2 size={12} /></button>
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-border">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-muted-foreground">Name</label>
              <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Inventory Manager"
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Inherits from</label>
              <select value={newBase} onChange={(e) => setNewBase(e.target.value as AppRole)}
                className="mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm">
                {BASE_TOGGLE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button onClick={addCustomRole} className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90">
              <Plus size={12} /> Add role
            </button>
          </div>
        </div>

        {/* Permission matrix */}
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Page</th>
                    {roleKeys.map((r) => (
                      <th key={r} className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span>{r}</span>
                          <button onClick={() => resetRole(r)} title="Reset to defaults" className="text-[9px] font-normal normal-case text-muted-foreground hover:text-destructive">reset</button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {groupedPages.map(([group, pages]) => (
                    <>
                      <tr key={`g-${group}`} className="bg-muted/20">
                        <td colSpan={roleKeys.length + 1} className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</td>
                      </tr>
                      {pages.map((p) => (
                        <tr key={p.key}>
                          <td className="px-4 py-2 text-foreground">{p.label}</td>
                          {roleKeys.map((r) => (
                            <td key={r} className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isAllowed(r, p.key)}
                                onChange={() => toggle(r, p.key)}
                                className="w-4 h-4 accent-primary cursor-pointer"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Checked = the role can access that page. Click "Save changes" to persist. "Reset" clears overrides for a role and restores its defaults.
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminRoles;
