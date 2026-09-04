import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  ShieldCheck,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  KeyRound,
  X,
  Loader2,
  AlertTriangle,
  Building2,
  Briefcase,
  Wrench,
  CheckCircle2,
  UserCog,
  ShieldAlert,
  Edit2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import type { AppRole } from "@/contexts/AuthContext";
import { purgeAllMockData } from "@/lib/purgeMockData";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  roles: AppRole[];
  department?: string;
  job_title?: string;
  status?: "active" | "suspended" | "on_leave";
  custom_role?: string;
}

interface CustomRole {
  key: string;
  label: string;
  base_role: string;
}

const DEPARTMENTS = [
  "Executive & Administration",
  "Solar Engineering & Field Operations",
  "Sales & Business Development",
  "Finance & Accounting",
  "Logistics & Warehouse Hub",
  "Customer Support & SLA",
];

const roleBadgeColors: Record<string, string> = {
  admin: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  staff: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  engineer: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  affiliate: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  customer: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"staff" | "customers" | "all">("staff");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purging, setPurging] = useState(false);

  // New/Edit User Form State
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState<AppRole>("staff");
  const [formDept, setFormDept] = useState(DEPARTMENTS[1]);
  const [formTitle, setFormTitle] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "suspended" | "on_leave">("active");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [profRes, rolesRes, crRes, ucrRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("custom_roles").select("*"),
        supabase.from("user_custom_roles").select("*"),
      ]);

      const profiles = (profRes.data || []) as any[];
      const userRoles = (rolesRes.data || []) as any[];
      const customRoleMap: Record<string, string> = {};
      (ucrRes.data || []).forEach((r: any) => {
        customRoleMap[r.user_id] = r.custom_role_key;
      });

      const combined: UserProfile[] = profiles.map((p) => {
        const matchingRoles = userRoles
          .filter((r) => r.user_id === p.id)
          .map((r) => r.role as AppRole);
        
        // Auto-assign logical department based on role if not set
        let inferredDept = "General Operations";
        if (matchingRoles.includes("admin")) inferredDept = "Executive & Administration";
        else if (matchingRoles.includes("engineer")) inferredDept = "Solar Engineering & Field Operations";
        else if (matchingRoles.includes("staff")) inferredDept = "Sales & Business Development";

        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          phone: p.phone,
          created_at: p.created_at,
          roles: matchingRoles.length > 0 ? matchingRoles : ["customer"],
          department: p.department || inferredDept,
          job_title: p.job_title || (matchingRoles.includes("admin") ? "System Administrator" : matchingRoles.includes("engineer") ? "Field Installation Engineer" : matchingRoles.includes("staff") ? "Operations Staff" : "Customer"),
          status: p.status || "active",
          custom_role: customRoleMap[p.id],
        };
      });

      setUsers(combined);
      setCustomRoles((crRes.data as CustomRole[]) || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim() || !formName.trim()) {
      toast.error("Please provide email and full name");
      return;
    }

    try {
      if (editingUser) {
        // Update existing profile
        const { error: profErr } = await supabase.from("profiles").update({
          full_name: formName.trim(),
          phone: formPhone.trim() || null,
        }).eq("id", editingUser.id);
        if (profErr) throw profErr;

        // Ensure role
        if (!editingUser.roles.includes(formRole)) {
          const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", editingUser.id);
          if (delErr) throw delErr;
          const { error: insErr } = await supabase.from("user_roles").insert({ user_id: editingUser.id, role: formRole });
          if (insErr) throw insErr;
        }

        toast.success(`Updated staff record for ${formName}`);
        setEditingUser(null);
      } else {
        // Create new user
        const newUserId = crypto.randomUUID();
        const { error: profErr } = await supabase.from("profiles").insert({
          id: newUserId,
          email: formEmail.trim().toLowerCase(),
          full_name: formName.trim(),
          phone: formPhone.trim() || null,
        });
        if (profErr) throw profErr;

        const { error: roleErr } = await supabase.from("user_roles").insert({
          user_id: newUserId,
          role: formRole,
        });
        if (roleErr) throw roleErr;

        toast.success(`New staff member ${formName} added!`);
        setShowAddModal(false);
      }

      // Reset form
      setFormEmail("");
      setFormName("");
      setFormPhone("");
      setFormRole("staff");
      setFormTitle("");
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to save user");
    }
  };

  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setFormEmail(u.email || "");
    setFormName(u.full_name || "");
    setFormPhone(u.phone || "");
    setFormRole(u.roles[0] || "staff");
    setFormDept(u.department || DEPARTMENTS[1]);
    setFormTitle(u.job_title || "");
    setFormStatus(u.status || "active");
  };

  const toggleRole = async (userId: string, role: AppRole, currentlyHas: boolean) => {
    try {
      if (currentlyHas) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", role);
        if (error) throw error;
        toast.success(`Removed "${role.toUpperCase()}" role`);
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (error) throw error;
        toast.success(`Granted "${role.toUpperCase()}" role`);
      }
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove account "${name}"?`)) return;
    try {
      const { error: roleErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (roleErr) throw roleErr;
      const { error: profErr } = await supabase.from("profiles").delete().eq("id", userId);
      if (profErr) throw profErr;
      toast.success("Account deleted successfully");
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handlePurgeMockData = async () => {
    setPurging(true);
    const res = await purgeAllMockData();
    setPurging(false);
    setShowPurgeModal(false);
    if (res.success) {
      toast.success(res.message);
      loadUsers();
    } else {
      toast.error(res.message);
    }
  };

  // Filtering
  const isStaff = (u: UserProfile) => u.roles.some((r) => ["admin", "staff", "engineer"].includes(r));

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q) ||
      (u.job_title || "").toLowerCase().includes(q);

    let matchesTab = true;
    if (activeTab === "staff") matchesTab = isStaff(u);
    else if (activeTab === "customers") matchesTab = !isStaff(u);

    let matchesDept = true;
    if (deptFilter !== "all") matchesDept = u.department === deptFilter;

    return matchesSearch && matchesTab && matchesDept;
  });

  const staffCount = users.filter(isStaff).length;
  const customerCount = users.filter((u) => !isStaff(u)).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <UserCog className="text-primary" size={24} />
              Staff & Enterprise User Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage corporate staff, field engineers, sales officers, permissions, and customer accounts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowPurgeModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400 px-4 py-2 text-xs font-semibold transition-all"
            >
              <Trash2 size={14} /> Purge Mock Data
            </button>
            <button
              onClick={() => {
                setEditingUser(null);
                setFormEmail("");
                setFormName("");
                setFormPhone("");
                setFormRole("staff");
                setFormDept(DEPARTMENTS[1]);
                setFormTitle("");
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110 shadow-sm transition-all"
            >
              <Plus size={14} /> Add / Invite Staff Member
            </button>
            <button
              onClick={loadUsers}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-border hover:bg-muted"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          <button
            onClick={() => { setActiveTab("staff"); setDeptFilter("all"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "staff"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Briefcase size={15} /> Staff & Field Engineers ({staffCount})
          </button>
          <button
            onClick={() => { setActiveTab("customers"); setDeptFilter("all"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "customers"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Users size={15} /> Customer Directory ({customerCount})
          </button>
          <button
            onClick={() => { setActiveTab("all"); setDeptFilter("all"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Building2 size={15} /> All Platform Accounts ({users.length})
          </button>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-rose-600">Administrators</span>
              <ShieldCheck size={16} className="text-rose-600" />
            </div>
            <p className="text-2xl font-bold font-display text-rose-600 mt-1">
              {users.filter((u) => u.roles.includes("admin")).length}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-amber-600">Field Engineers</span>
              <Wrench size={16} className="text-amber-600" />
            </div>
            <p className="text-2xl font-bold font-display text-amber-600 mt-1">
              {users.filter((u) => u.roles.includes("engineer")).length}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-blue-600">Operations & Sales</span>
              <Briefcase size={16} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold font-display text-blue-600 mt-1">
              {users.filter((u) => u.roles.includes("staff")).length}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-emerald-600">Active Accounts</span>
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-bold font-display text-emerald-600 mt-1">
              {users.length}
            </p>
          </div>
        </div>

        {/* Search & Department Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff name, job title, email, phone..."
              className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {activeTab === "staff" && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary/30 w-full sm:w-auto"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
        </div>

        {/* Staff / Users Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground bg-muted/20">
                  <th className="text-left px-4 py-3 font-semibold">Staff / User Details</th>
                  <th className="text-left px-4 py-3 font-semibold">Department & Title</th>
                  <th className="text-left px-4 py-3 font-semibold">Contact</th>
                  <th className="text-left px-4 py-3 font-semibold">System Roles</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs uppercase">
                          {(u.full_name || u.email || "U").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{u.full_name || "Tioga User"}</p>
                          <p className="text-xs text-muted-foreground font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-foreground">{u.job_title || "Staff Member"}</p>
                      <p className="text-[11px] text-muted-foreground">{u.department || "Operations"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.phone ? <span>{u.phone}</span> : <span className="italic">No phone set</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                              roleBadgeColors[r] || "bg-muted text-foreground"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-border hover:bg-muted text-foreground inline-flex items-center gap-1"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => toggleRole(u.id, "admin", u.roles.includes("admin"))}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            u.roles.includes("admin")
                              ? "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.roles.includes("admin") ? "Revoke Admin" : "Make Admin"}
                        </button>
                        <button
                          onClick={() => toggleRole(u.id, "engineer", u.roles.includes("engineer"))}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            u.roles.includes("engineer")
                              ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                              : "border-border hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.roles.includes("engineer") ? "Revoke Engr" : "Make Engr"}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.full_name || u.email || "Account")}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No accounts found. Click "Add / Invite Staff Member" to add a staff profile.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: ADD / EDIT STAFF */}
        {(showAddModal || editingUser) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-3 border-b border-border">
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <UserCheck size={18} className="text-primary" />
                  {editingUser ? "Edit Staff Member Record" : "Add / Invite Staff Member"}
                </h3>
                <button
                  onClick={() => { setShowAddModal(false); setEditingUser(null); }}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Full Name *</label>
                    <input
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Babatunde Fashola"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Corporate Email *</label>
                    <input
                      type="email"
                      required
                      disabled={!!editingUser}
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. b.fashola@tiogatechnologies.com"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground font-mono disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone Number</label>
                    <input
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+234 803 123 4567"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Job Title / Designation</label>
                    <input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Senior Solar Installation Lead"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Department</label>
                    <select
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Primary System Role *</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as AppRole)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
                    >
                      <option value="admin">Administrator (Full Root Access)</option>
                      <option value="staff">Staff (Sales / Billing / Support)</option>
                      <option value="engineer">Field Installation Engineer (HSE & Work Orders)</option>
                      <option value="affiliate">Affiliate Partner</option>
                      <option value="customer">Customer</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setEditingUser(null); }}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                  >
                    {editingUser ? "Save Staff Changes" : "Create Staff Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: PURGE MOCK DATA */}
        {showPurgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-destructive/30 shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                  <AlertTriangle size={26} />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-display font-bold text-foreground text-lg">Clean Mock & Test Data</h3>
                  <p className="text-xs text-muted-foreground">
                    Safely wipe all test invoices (`TEST-`), QA test leads, test work orders, and sample commissions across all database tables.
                  </p>
                </div>

                <div className="bg-muted/40 p-3 rounded-2xl text-xs space-y-1 border border-border">
                  <p className="font-semibold text-foreground">What will be preserved:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5 text-[11px]">
                    <li>All real staff & admin user profiles</li>
                    <li>Official warehouse locations</li>
                    <li>All genuine products & solar packages</li>
                    <li>Live website & store settings</li>
                  </ul>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPurgeModal(false)}
                    disabled={purging}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePurgeMockData}
                    disabled={purging}
                    className="flex-1 rounded-xl bg-destructive text-destructive-foreground py-2.5 text-sm font-semibold hover:brightness-110 flex items-center justify-center gap-1.5"
                  >
                    {purging ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    {purging ? "Purging..." : "Purge All Mock Data"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
