import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Printer,
  Plus,
  Wrench,
  Truck,
  Building2,
  X,
  FileText,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";

const PIPELINE = [
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "received",
  "repaired",
  "replaced",
  "refunded",
  "closed",
] as const;

const OEM_STATUSES = [
  "pending_bench_test",
  "bench_test_passed",
  "bench_test_failed",
  "submitted_to_oem",
  "oem_approved",
  "oem_replaced",
  "credit_issued",
] as const;

const OEM_MANUFACTURERS = [
  "Felicity Solar",
  "Deye Inverters",
  "Growatt New Energy",
  "Must Solar",
  "Tuya Smart",
  "Dahua Security",
  "Other OEM",
];

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  under_review: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  received: "bg-indigo-100 text-indigo-700 border-indigo-200",
  repaired: "bg-emerald-100 text-emerald-700 border-emerald-200",
  replaced: "bg-emerald-100 text-emerald-700 border-emerald-200",
  refunded: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-muted text-muted-foreground border-border",
};

const pretty = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const AdminWarranty = () => {
  const [activeTab, setActiveTab] = useState<"customer_claims" | "oem_rma">("customer_claims");
  const [rows, setRows] = useState<any[]>([]);
  const [events, setEvents] = useState<Record<string, any[]>>({});
  const [staff, setStaff] = useState<{ id: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [oemFilter, setOemFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  // Modals
  const [showNewRmaModal, setShowNewRmaModal] = useState(false);
  const [viewingRmaSlip, setViewingRmaSlip] = useState<any | null>(null);

  // New RMA Form
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newSerial, setNewSerial] = useState("");
  const [newManufacturer, setNewManufacturer] = useState("Felicity Solar");
  const [newIssue, setNewIssue] = useState("");
  const [newLoanerSerial, setNewLoanerSerial] = useState("");
  const [newDiagnosis, setNewDiagnosis] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [{ data, error }, { data: roleRows }] = await Promise.all([
        supabase.from("warranty_claims" as any).select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("user_roles").select("user_id").in("role", ["admin", "staff", "engineer"]),
      ]);
      if (error) toast.error(error.message);
      setRows(((data as any) || []) as any[]);
      const ids = Array.from(new Set(((roleRows as any[]) || []).map((r) => r.user_id)));
      if (ids.length) {
        const { data: profiles } = await supabase.from("profiles").select("id,email").in("id", ids);
        setStaff((((profiles as any) || []) as any[]).map((p) => ({ id: p.id, email: p.email })));
      } else {
        setStaff([]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openClaim = async (id: string) => {
    if (selected === id) return setSelected(null);
    setSelected(id);
    if (events[id]) return;
    const { data } = await supabase
      .from("warranty_claim_events" as any)
      .select("*")
      .eq("claim_id", id)
      .order("created_at");
    setEvents((e) => ({ ...e, [id]: ((data as any) || []) as any[] }));
  };

  const handleCreateRma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.trim() || !newCustomerName.trim() || !newIssue.trim()) {
      toast.error("Please fill in customer, product, and issue details");
      return;
    }

    try {
      const rmaNumber = `RMA-${new Date().toISOString().slice(2, 7).replace("-", "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        rma_number: rmaNumber,
        ticket_number: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_name: newCustomerName.trim(),
        customer_phone: newCustomerPhone.trim(),
        customer_email: newCustomerEmail.trim() || null,
        product_name: newProduct.trim(),
        serial_number: newSerial.trim() || null,
        serial: newSerial.trim() || null,
        oem_manufacturer: newManufacturer,
        reason: "faulty_component",
        description: newIssue.trim(),
        loaner_serial_no: newLoanerSerial.trim() || null,
        diagnostic_test_notes: newDiagnosis.trim() || null,
        oem_rma_status: newDiagnosis ? "bench_test_failed" : "pending_bench_test",
        status: "under_review",
      };

      const { data, error } = await supabase.from("warranty_claims").insert([payload]).select().single();
      if (error) throw error;

      toast.success(`OEM RMA Case #${rmaNumber} logged successfully!`);
      setShowNewRmaModal(false);
      load();
      if (data) setViewingRmaSlip(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to log RMA case");
    }
  };

  const patch = async (claim: any, values: any) => {
    const { error } = await supabase.from("warranty_claims" as any).update(values).eq("id", claim.id);
    if (error) return toast.error(error.message);
    const next = { ...claim, ...values };
    setRows((p) => p.map((r) => (r.id === claim.id ? next : r)));
    toast.success("RMA record updated");
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        (r.rma_number && r.rma_number.toLowerCase().includes(q)) ||
        (r.serial_number && r.serial_number.toLowerCase().includes(q)) ||
        (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
        (r.product_name && r.product_name.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesOem = oemFilter === "all" || r.oem_manufacturer === oemFilter;

      return matchesQuery && matchesStatus && matchesOem;
    });
  }, [rows, query, statusFilter, oemFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="text-primary" size={24} />
              RMA & OEM Manufacturer Warranty Lifecycle (ERP)
            </h1>
            <p className="text-sm text-muted-foreground">
              Bench test defective hardware, track manufacturer claims (Felicity, Deye, Growatt), and manage loaner units.
            </p>
          </div>
          <button
            onClick={() => setShowNewRmaModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 shadow-sm transition-all"
          >
            <Plus size={15} /> Log New RMA Case
          </button>
        </div>

        {/* Operational KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Total RMA Cases</span>
            <p className="text-2xl font-bold font-display text-foreground mt-1">{rows.length}</p>
            <p className="text-[11px] text-muted-foreground">Logged returns & claims</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-amber-600">Active / In Diagnosis</span>
            <p className="text-2xl font-bold font-display text-amber-600 mt-1">
              {rows.filter((r) => !["closed", "replaced", "refunded", "rejected"].includes(r.status)).length}
            </p>
            <p className="text-[11px] text-muted-foreground">Bench testing & OEM review</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-blue-600">Loaner Units Active</span>
            <p className="text-2xl font-bold font-display text-blue-600 mt-1">
              {rows.filter((r) => !!r.loaner_serial_no).length}
            </p>
            <p className="text-[11px] text-muted-foreground">Temporary units with clients</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-emerald-600">OEM Replaced / Closed</span>
            <p className="text-2xl font-bold font-display text-emerald-600 mt-1">
              {rows.filter((r) => ["closed", "replaced"].includes(r.status)).length}
            </p>
            <p className="text-[11px] text-muted-foreground">Successfully resolved</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search RMA #, Serial #, Customer, Product..."
              className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={oemFilter}
              onChange={(e) => setOemFilter(e.target.value)}
              className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
            >
              <option value="all">All Manufacturers</option>
              {OEM_MANUFACTURERS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
            >
              <option value="all">All RMA Statuses</option>
              {PIPELINE.map((s) => (
                <option key={s} value={s}>{pretty(s)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* RMA Cases Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground bg-muted/20">
                  <th className="text-left px-4 py-3 font-semibold">RMA #</th>
                  <th className="text-left px-4 py-3 font-semibold">Manufacturer</th>
                  <th className="text-left px-4 py-3 font-semibold">Product & Serial #</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold">Loaner Unit Serial</th>
                  <th className="text-center px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                      {r.rma_number || `RMA-${r.id.slice(0, 8).toUpperCase()}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground bg-muted/60 px-2 py-1 rounded">
                        <Building2 size={11} className="text-primary" /> {r.oem_manufacturer || "Felicity Solar"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground text-xs">{r.product_name}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">SN: {r.serial_number || "To verify"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground text-xs">{r.customer_name || "Direct Client"}</p>
                      <p className="text-[11px] text-muted-foreground">{r.customer_phone || ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      {r.loaner_serial_no ? (
                        <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {r.loaner_serial_no}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No loaner issued</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                          STATUS_STYLE[r.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {pretty(r.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingRmaSlip(r)}
                          className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground"
                          title="Print RMA Slip"
                        >
                          <Printer size={13} /> Slip
                        </button>
                        <select
                          value={r.status}
                          onChange={(e) => patch(r, { status: e.target.value })}
                          className="text-[11px] font-semibold border rounded-lg p-1 bg-muted/40 text-foreground"
                        >
                          {PIPELINE.map((s) => (
                            <option key={s} value={s}>{pretty(s)}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No warranty / RMA cases found. Click "Log New RMA Case" above to record a defective component.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: LOG NEW RMA CASE */}
        {showNewRmaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-border">
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <Wrench size={18} className="text-primary" /> Log Defective Component & RMA Case
                </h3>
                <button onClick={() => setShowNewRmaModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateRma} className="p-6 space-y-3.5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">OEM Manufacturer *</label>
                    <select
                      value={newManufacturer}
                      onChange={(e) => setNewManufacturer(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
                    >
                      {OEM_MANUFACTURERS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Component Serial #</label>
                    <input
                      value={newSerial}
                      onChange={(e) => setNewSerial(e.target.value)}
                      placeholder="e.g. FEL-INV-5002-491"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono uppercase text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Product Description *</label>
                  <input
                    required
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    placeholder="e.g. 5kVA 48V Hybrid Solar Inverter"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Customer Name *</label>
                    <input
                      required
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="e.g. Chief Raymond Dokpesi"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Customer Phone</label>
                    <input
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="+234 803 000 1234"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Issue Symptom / Error Code *</label>
                  <input
                    required
                    value={newIssue}
                    onChange={(e) => setNewIssue(e.target.value)}
                    placeholder="e.g. Error F58 (Inverter Bus Soft-Start Overcurrent)"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Loaner Unit Serial (Optional)</label>
                    <input
                      value={newLoanerSerial}
                      onChange={(e) => setNewLoanerSerial(e.target.value)}
                      placeholder="e.g. LOAN-INV-004"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono uppercase text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Bench Diagnosis Summary</label>
                    <input
                      value={newDiagnosis}
                      onChange={(e) => setNewDiagnosis(e.target.value)}
                      placeholder="e.g. Blown MPPT MOSFET diode"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewRmaModal(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                  >
                    Log Case & Print Slip
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRINTABLE RMA SLIP */}
        {viewingRmaSlip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0">
            <div className="bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 print:p-0 print:shadow-none">
              <div className="flex justify-between items-start border-b pb-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-emerald-800">TIOGA TECHNOLOGIES LTD</h2>
                  <p className="text-xs text-slate-600">Technical Service Center & Warranty Depot</p>
                  <p className="text-xs text-slate-500">12 Commercial Ave, Ikeja, Lagos • support@tiogatechnologies.com</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-800 font-mono font-bold text-xs rounded">
                    RMA SERVICE SLIP
                  </span>
                  <p className="font-mono font-bold text-emerald-800 mt-1">
                    {viewingRmaSlip.rma_number || `RMA-${viewingRmaSlip.id.slice(0, 8).toUpperCase()}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    Date: {new Date(viewingRmaSlip.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-xs bg-slate-50 p-4 rounded-xl">
                <div>
                  <p className="font-bold text-slate-700 uppercase text-[10px]">Client Details:</p>
                  <p className="font-semibold text-sm">{viewingRmaSlip.customer_name}</p>
                  <p className="text-slate-600">{viewingRmaSlip.customer_phone}</p>
                  <p className="text-slate-600">{viewingRmaSlip.customer_email || "N/A"}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700 uppercase text-[10px]">OEM Manufacturer:</p>
                  <p className="font-semibold text-sm">{viewingRmaSlip.oem_manufacturer || "Felicity Solar"}</p>
                  <p className="text-slate-600 mt-1">Status: {viewingRmaSlip.status.toUpperCase()}</p>
                </div>
              </div>

              <div className="border p-4 rounded-xl mb-6 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-semibold">Defective Component:</span>
                  <span className="font-bold text-slate-900">{viewingRmaSlip.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-semibold">Hardware Serial Number:</span>
                  <span className="font-mono font-bold text-emerald-800">{viewingRmaSlip.serial_number || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-semibold">Temporary Loaner Serial:</span>
                  <span className="font-mono font-bold text-blue-700">{viewingRmaSlip.loaner_serial_no || "None"}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <p className="text-slate-600 font-semibold">Reported Issue / Fault Description:</p>
                  <p className="text-slate-800 mt-0.5">{viewingRmaSlip.issue_description}</p>
                </div>
                {viewingRmaSlip.diagnostic_test_notes && (
                  <div className="border-t pt-2">
                    <p className="text-slate-600 font-semibold">Technician Bench Test Diagnosis:</p>
                    <p className="text-slate-800 mt-0.5">{viewingRmaSlip.diagnostic_test_notes}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t text-xs">
                <div>
                  <p className="text-slate-500 mb-6">Service Technician (Sign & Date):</p>
                  <div className="border-b border-slate-400 w-48" />
                </div>
                <div>
                  <p className="text-slate-500 mb-6">Warehouse Intake / Loaner Sign-off:</p>
                  <div className="border-b border-slate-400 w-48" />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-2 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900"
                >
                  <Printer size={14} /> Print RMA Slip
                </button>
                <button
                  onClick={() => setViewingRmaSlip(null)}
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

export default AdminWarranty;
