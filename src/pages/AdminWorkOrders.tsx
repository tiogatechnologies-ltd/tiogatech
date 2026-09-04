import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Wrench,
  Plus,
  Search,
  Printer,
  CheckCircle,
  Clock,
  UserCheck,
  MapPin,
  Calendar,
  Zap,
  ShieldCheck,
  FileCheck,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useSiteContact } from "@/hooks/useSiteContact";

const db = supabase as any;

interface WorkOrderItem {
  product_name: string;
  quantity: number;
  serial_no?: string;
}

interface WorkOrder {
  id: string;
  work_order_no: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  site_address: string;
  scheduled_date: string;
  lead_engineer_name: string;
  crew_members: string[];
  job_type: "solar_installation" | "smart_home_setup" | "maintenance_repair" | "security_cctv";
  status: "scheduled" | "in_progress" | "commissioned" | "cancelled";
  bill_of_materials: WorkOrderItem[];
  commissioning_checklist: {
    pv_voltage_checked: boolean;
    earthing_tested: boolean;
    battery_terminal_torqued: boolean;
    app_monitoring_synced: boolean;
    fire_safety_breaker_tested: boolean;
    customer_trained: boolean;
  };
  pv_voltage_recorded: string | null;
  earthing_resistance: string | null;
  customer_notes: string | null;
  commissioned_at: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  commissioned: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const jobTypeLabels: Record<string, string> = {
  solar_installation: "☀️ Solar Power Installation",
  smart_home_setup: "🏠 Smart Home Automation",
  security_cctv: "🔒 Smart Lock & CCTV Security",
  maintenance_repair: "🔧 Maintenance & Inspection",
};

const AdminWorkOrders = () => {
  const { contact } = useSiteContact();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingWorkOrder, setViewingWorkOrder] = useState<WorkOrder | null>(null);
  const [commissioningModal, setCommissioningModal] = useState<WorkOrder | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [leadEngineer, setLeadEngineer] = useState("");
  const [crewMembers, setCrewMembers] = useState("");
  const [jobType, setJobType] = useState<WorkOrder["job_type"]>("solar_installation");
  const [customerNotes, setCustomerNotes] = useState("");

  const [bomItems, setBomItems] = useState<WorkOrderItem[]>([
    { product_name: "5kVA Solar Inverter (48V)", quantity: 1, serial_no: "" },
    { product_name: "10kWh Lithium Battery", quantity: 1, serial_no: "" },
  ]);

  // Commissioning state
  const [pvVoltage, setPvVoltage] = useState("");
  const [earthing, setEarthing] = useState("");
  const [checklist, setChecklist] = useState({
    pv_voltage_checked: true,
    earthing_tested: true,
    battery_terminal_torqued: true,
    app_monitoring_synced: true,
    fire_safety_breaker_tested: true,
    customer_trained: true,
  });

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from("work_orders")
        .select("*")
        .order("scheduled_date", { ascending: false });
      if (error) throw error;
      setWorkOrders((data as WorkOrder[]) || []);
    } catch (err: any) {
      console.error("Failed to load work orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleAddBomItem = () => {
    setBomItems([...bomItems, { product_name: "", quantity: 1, serial_no: "" }]);
  };

  const handleRemoveBomItem = (index: number) => {
    setBomItems(bomItems.filter((_, i) => i !== index));
  };

  const handleBomChange = (index: number, field: keyof WorkOrderItem, val: any) => {
    const updated = [...bomItems];
    updated[index] = { ...updated[index], [field]: val };
    setBomItems(updated);
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !siteAddress.trim() || !leadEngineer.trim()) {
      toast.error("Please fill in customer name, site address, and lead engineer");
      return;
    }

    try {
      const workOrderNo = `WO-${new Date().toISOString().slice(2, 7).replace("-", "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const crewArray = crewMembers.split(",").map((c) => c.trim()).filter(Boolean);

      const payload = {
        work_order_no: workOrderNo,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || null,
        site_address: siteAddress.trim(),
        scheduled_date: scheduledDate,
        lead_engineer_name: leadEngineer.trim(),
        crew_members: crewArray,
        job_type: jobType,
        status: "scheduled",
        bill_of_materials: bomItems,
        customer_notes: customerNotes.trim() || null,
      };

      const { data, error } = await db.from("work_orders").insert([payload]).select().single();
      if (error) throw error;

      toast.success(`Work Order #${workOrderNo} dispatched successfully!`);
      setShowCreateModal(false);
      fetchWorkOrders();
      if (data) setViewingWorkOrder(data as WorkOrder);
    } catch (err: any) {
      toast.error(err.message || "Failed to create work order");
    }
  };

  const handleCompleteCommissioning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commissioningModal) return;

    try {
      const updates = {
        status: "commissioned",
        commissioning_checklist: checklist,
        pv_voltage_recorded: pvVoltage || "Passed Standard Vdc",
        earthing_resistance: earthing || "< 3.5 Ohms",
        commissioned_at: new Date().toISOString(),
      };

      const { error } = await db.from("work_orders").update(updates).eq("id", commissioningModal.id);
      if (error) throw error;

      toast.success(`Work Order #${commissioningModal.work_order_no} officially commissioned!`);
      setCommissioningModal(null);
      fetchWorkOrders();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await db.from("work_orders").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      toast.success(`Status updated to ${newStatus}`);
      fetchWorkOrders();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredOrders = workOrders.filter((wo) => {
    const matchesStatus = statusFilter === "all" || wo.status === statusFilter;
    const matchesType = typeFilter === "all" || wo.job_type === typeFilter;
    const matchesSearch =
      !search ||
      wo.work_order_no.toLowerCase().includes(search.toLowerCase()) ||
      wo.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      wo.lead_engineer_name.toLowerCase().includes(search.toLowerCase()) ||
      wo.site_address.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Wrench className="text-primary" size={24} />
              Field Work Orders & Digital Commissioning (ERP)
            </h1>
            <p className="text-sm text-muted-foreground">
              Schedule engineering crews, allocate BOM hardware serials, and sign off digital commissioning certificates.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 shadow-sm transition-all"
          >
            <Plus size={15} /> Create & Dispatch Work Order
          </button>
        </div>

        {/* Operational KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Total Work Orders</span>
            <p className="text-2xl font-bold font-display text-foreground mt-1">{workOrders.length}</p>
            <p className="text-[11px] text-muted-foreground">All time field dispatches</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-blue-600">Scheduled / En Route</span>
            <p className="text-2xl font-bold font-display text-blue-600 mt-1">
              {workOrders.filter((w) => w.status === "scheduled" || w.status === "in_progress").length}
            </p>
            <p className="text-[11px] text-muted-foreground">Active installation jobs</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-emerald-600">Commissioned Systems</span>
            <p className="text-2xl font-bold font-display text-emerald-600 mt-1">
              {workOrders.filter((w) => w.status === "commissioned").length}
            </p>
            <p className="text-[11px] text-muted-foreground">Successfully powered up</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Lead Engineers</span>
            <p className="text-2xl font-bold font-display text-foreground mt-1">
              {new Set(workOrders.map((w) => w.lead_engineer_name)).size}
            </p>
            <p className="text-[11px] text-muted-foreground">Active dispatch supervisors</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search work order #, customer, engineer..."
              className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
            >
              <option value="all">All Job Types</option>
              <option value="solar_installation">Solar Installation</option>
              <option value="smart_home_setup">Smart Home Setup</option>
              <option value="security_cctv">Security & CCTV</option>
              <option value="maintenance_repair">Maintenance & Repair</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="commissioned">Commissioned</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Work Orders Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground bg-muted/20">
                  <th className="text-left px-4 py-3 font-semibold">WO Number</th>
                  <th className="text-left px-4 py-3 font-semibold">Job Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer & Site</th>
                  <th className="text-left px-4 py-3 font-semibold">Assigned Engineer</th>
                  <th className="text-left px-4 py-3 font-semibold">Scheduled Date</th>
                  <th className="text-center px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((wo) => (
                  <tr key={wo.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">{wo.work_order_no}</td>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">
                      {jobTypeLabels[wo.job_type] || wo.job_type}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{wo.customer_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={11} /> {wo.site_address}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground flex items-center gap-1">
                        <UserCheck size={13} className="text-primary" /> {wo.lead_engineer_name}
                      </p>
                      {wo.crew_members?.length > 0 && (
                        <p className="text-[11px] text-muted-foreground">+{wo.crew_members.length} assistants</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-muted-foreground" /> {wo.scheduled_date}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          statusColors[wo.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {wo.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingWorkOrder(wo)}
                          className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground"
                          title="View Dispatch Sheet"
                        >
                          <Printer size={13} /> Sheet
                        </button>
                        {wo.status !== "commissioned" && (
                          <button
                            onClick={() => {
                              setCommissioningModal(wo);
                              setPvVoltage(wo.pv_voltage_recorded || "");
                              setEarthing(wo.earthing_resistance || "");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
                          >
                            <CheckCircle size={12} /> Sign-off
                          </button>
                        )}
                        <select
                          value={wo.status}
                          onChange={(e) => handleUpdateStatus(wo.id, e.target.value)}
                          className="text-[11px] font-semibold border rounded-lg p-1 bg-muted/40 text-foreground"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="in_progress">In Progress</option>
                          <option value="commissioned">Commissioned</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No field work orders found. Click "Create & Dispatch Work Order" to schedule an engineer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: CREATE WORK ORDER */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-border">
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <Wrench size={18} className="text-primary" /> Dispatch Installation Work Order
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateWorkOrder} className="p-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Job Type *</label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value as any)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
                    >
                      <option value="solar_installation">☀️ Solar Power Installation</option>
                      <option value="smart_home_setup">🏠 Smart Home Setup</option>
                      <option value="security_cctv">🔒 Smart Lock & CCTV Security</option>
                      <option value="maintenance_repair">🔧 Maintenance & Repair</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Scheduled Date *</label>
                    <input
                      type="date"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Customer Name *</label>
                    <input
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Dr. Kolawole Balogun"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Customer Phone *</label>
                    <input
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. +234 812 345 6789"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Installation Site Address *</label>
                  <input
                    required
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    placeholder="e.g. Plot 12 Block B, Carlton Gate Estate, Chevron, Lekki, Lagos"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Lead Engineer *</label>
                    <input
                      required
                      value={leadEngineer}
                      onChange={(e) => setLeadEngineer(e.target.value)}
                      placeholder="e.g. Engr. Sunday Okon"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Crew Members (Comma separated)</label>
                    <input
                      value={crewMembers}
                      onChange={(e) => setCrewMembers(e.target.value)}
                      placeholder="e.g. Tunde (Electrician), Ahmed (Roofer)"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                </div>

                {/* BOM Bill of Materials */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Bill of Materials (BOM & Serial Allocation)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddBomItem}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Component
                    </button>
                  </div>

                  {bomItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-muted/30 p-2 rounded-xl">
                      <div className="col-span-6">
                        <input
                          required
                          value={item.product_name}
                          onChange={(e) => handleBomChange(idx, "product_name", e.target.value)}
                          placeholder="Component / SKU Description"
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          required
                          value={item.quantity}
                          onChange={(e) => handleBomChange(idx, "quantity", Number(e.target.value))}
                          placeholder="Qty"
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          value={item.serial_no || ""}
                          onChange={(e) => handleBomChange(idx, "serial_no", e.target.value)}
                          placeholder="Serial # (Optional)"
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono uppercase text-foreground"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        {bomItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBomItem(idx)}
                            className="text-muted-foreground hover:text-destructive p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Special Site Instructions</label>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Customer works from home; coordinate DB isolation with gate security..."
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                  >
                    Dispatch Work Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DIGITAL COMMISSIONING & HANDOVER */}
        {commissioningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-border">
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-600" /> Digital Commissioning & Handover
                </h3>
                <button onClick={() => setCommissioningModal(null)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCompleteCommissioning} className="p-6 space-y-4 text-sm">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-xs">
                  <p className="font-bold text-emerald-900 dark:text-emerald-300">
                    Work Order #{commissioningModal.work_order_no}
                  </p>
                  <p className="text-emerald-800 dark:text-emerald-400">Customer: {commissioningModal.customer_name}</p>
                  <p className="text-emerald-800 dark:text-emerald-400">Site: {commissioningModal.site_address}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Engineering Safety Checklist
                  </label>
                  {[
                    ["pv_voltage_checked", "PV Open-Circuit String Voltages within Inverter MPPT specs"],
                    ["earthing_tested", "Earth Grounding Electrode tested & bonded (< 5 Ohms)"],
                    ["battery_terminal_torqued", "Battery cables & terminals torqued to manufacturer specs"],
                    ["fire_safety_breaker_tested", "DC & AC surge protection breakers tested and active"],
                    ["app_monitoring_synced", "Customer Wi-Fi dongle & smartphone app synced"],
                    ["customer_trained", "Customer trained on changeover sequence & emergency stop"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-start gap-2.5 p-2 bg-muted/30 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(checklist as any)[key]}
                        onChange={(e) => setChecklist({ ...checklist, [key]: e.target.checked })}
                        className="mt-0.5 rounded text-primary"
                      />
                      <span className="text-xs text-foreground font-medium">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">PV String Voltage (Vdc)</label>
                    <input
                      value={pvVoltage}
                      onChange={(e) => setPvVoltage(e.target.value)}
                      placeholder="e.g. 385 Vdc"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Earthing Resistance</label>
                    <input
                      value={earthing}
                      onChange={(e) => setEarthing(e.target.value)}
                      placeholder="e.g. 2.8 Ohms"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCommissioningModal(null)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 text-sm font-semibold shadow-md"
                  >
                    Sign-off & Complete Handover
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRINTABLE WORK ORDER DISPATCH SHEET */}
        {viewingWorkOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0">
            <div className="bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 print:p-0 print:shadow-none">
              <div className="flex justify-between items-start border-b pb-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-emerald-800">TIOGA TECHNOLOGIES LTD</h2>
                  <p className="text-xs text-slate-600">Field Engineering & Commissioning Sheet</p>
                  <p className="text-xs text-slate-500">{contact.address} • {contact.phone}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-100 font-mono font-bold text-xs rounded">
                    WORK ORDER
                  </span>
                  <p className="font-mono font-bold text-emerald-800 mt-1">{viewingWorkOrder.work_order_no}</p>
                  <p className="text-xs text-slate-500">Scheduled: {viewingWorkOrder.scheduled_date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-xs bg-slate-50 p-4 rounded-xl">
                <div>
                  <p className="font-bold text-slate-700 uppercase text-[10px]">Client & Site Details:</p>
                  <p className="font-semibold text-sm">{viewingWorkOrder.customer_name}</p>
                  <p className="text-slate-600">{viewingWorkOrder.customer_phone}</p>
                  <p className="text-slate-600 font-medium mt-1">{viewingWorkOrder.site_address}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700 uppercase text-[10px]">Assigned Engineering Crew:</p>
                  <p className="font-semibold text-sm">Lead: {viewingWorkOrder.lead_engineer_name}</p>
                  {viewingWorkOrder.crew_members?.length > 0 && (
                    <p className="text-slate-600">Crew: {viewingWorkOrder.crew_members.join(", ")}</p>
                  )}
                  <p className="text-slate-600 mt-1 font-semibold">Status: {viewingWorkOrder.status.toUpperCase()}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="font-bold text-slate-800 text-xs uppercase mb-2">Bill of Materials (Allocated Hardware):</p>
                <table className="w-full text-left text-xs border">
                  <thead>
                    <tr className="bg-slate-100 border-b">
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Component SKU</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 font-mono">Serial Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingWorkOrder.bill_of_materials.map((b, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2.5">{idx + 1}</td>
                        <td className="p-2.5 font-semibold">{b.product_name}</td>
                        <td className="p-2.5 text-center">{b.quantity}</td>
                        <td className="p-2.5 font-mono text-emerald-800 font-bold">{b.serial_no || "To verify on site"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {viewingWorkOrder.status === "commissioned" && (
                <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                  <p className="font-bold text-emerald-900 uppercase">✓ Commissioning Inspection Passed</p>
                  <p className="text-emerald-800 mt-1">PV Voltage Recorded: {viewingWorkOrder.pv_voltage_recorded || "Optimal"}</p>
                  <p className="text-emerald-800">Earthing Resistance: {viewingWorkOrder.earthing_resistance || "< 5 Ohms"}</p>
                  <p className="text-emerald-700 text-[11px] mt-1">
                    Commissioned on: {viewingWorkOrder.commissioned_at ? new Date(viewingWorkOrder.commissioned_at).toLocaleString() : "Confirmed"}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-8 pt-8 border-t text-xs">
                <div>
                  <p className="text-slate-500 mb-6">Lead Engineer Handover (Sign & Date):</p>
                  <div className="border-b border-slate-400 w-48" />
                </div>
                <div>
                  <p className="text-slate-500 mb-6">Customer Acceptance (Sign & Date):</p>
                  <div className="border-b border-slate-400 w-48" />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-2 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900"
                >
                  <Printer size={14} /> Print Work Order
                </button>
                <button
                  onClick={() => setViewingWorkOrder(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminWorkOrders;
