import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingDown,
  Truck,
  Receipt,
  UserCheck,
  X,
  Loader2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface ApprovalRequest {
  id: string;
  request_no: string;
  request_type: "discount_override" | "purchase_order" | "expense_claim" | "inventory_writeoff";
  title: string;
  description: string | null;
  amount: number;
  discount_percent: number;
  requested_by_name: string;
  requested_by_role: string;
  target_reference: string | null;
  required_approval_tier: "sales_manager" | "cfo_accountant" | "director_admin";
  status: "pending" | "approved" | "rejected";
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

const typeLabels: Record<ApprovalRequest["request_type"], { label: string; icon: any; color: string }> = {
  discount_override: { label: "Discount Override", icon: TrendingDown, color: "text-purple-600 bg-purple-100" },
  purchase_order: { label: "Purchase Order", icon: Truck, color: "text-blue-600 bg-blue-100" },
  expense_claim: { label: "Field Expense Claim", icon: Receipt, color: "text-emerald-600 bg-emerald-100" },
  inventory_writeoff: { label: "Inventory Write-Off", icon: AlertTriangle, color: "text-rose-600 bg-rose-100" },
};

const tierLabels: Record<ApprovalRequest["required_approval_tier"], string> = {
  sales_manager: "Sales Manager Tier",
  cfo_accountant: "CFO / Finance Tier",
  director_admin: "Executive Director Tier",
};

const statusColors: Record<ApprovalRequest["status"], string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
};

const AdminApprovals = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rejectingItem, setRejectingItem] = useState<ApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Form state
  const [reqType, setReqType] = useState<ApprovalRequest["request_type"]>("discount_override");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(5);
  const [requestedByName, setRequestedByName] = useState("Staff Member");
  const [targetReference, setTargetReference] = useState("");
  const [requiredTier, setRequiredTier] = useState<ApprovalRequest["required_approval_tier"]>("sales_manager");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("approval_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRequests((data as ApprovalRequest[]) || []);
    } catch (err: any) {
      console.error("Failed to load approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !requestedByName.trim()) {
      toast.error("Please fill in the title and applicant name");
      return;
    }

    try {
      const requestNo = `APR-${new Date().toISOString().slice(2, 7).replace("-", "")}-${Math.floor(100 + Math.random() * 900)}`;

      // Auto-determine tier if not manually chosen
      let tier = requiredTier;
      if (reqType === "discount_override") {
        tier = discountPercent > 12 ? "director_admin" : "sales_manager";
      } else if (reqType === "purchase_order") {
        tier = amount > 1000000 ? "director_admin" : "cfo_accountant";
      }

      const payload = {
        request_no: requestNo,
        request_type: reqType,
        title: title.trim(),
        description: description.trim() || null,
        amount: Number(amount || 0),
        discount_percent: reqType === "discount_override" ? Number(discountPercent || 0) : 0,
        requested_by_name: requestedByName.trim(),
        requested_by_role: "staff",
        target_reference: targetReference.trim() || null,
        required_approval_tier: tier,
        status: "pending",
      };

      const { error } = await supabase.from("approval_requests").insert([payload]);
      if (error) throw error;

      toast.success(`Approval Request #${requestNo} submitted for ${tierLabels[tier]}!`);
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    }
  };

  const handleApprove = async (req: ApprovalRequest) => {
    try {
      const { error } = await supabase.from("approval_requests").update({
        status: "approved",
        approved_by_name: "Super Admin (Executive Authorization)",
        approved_at: new Date().toISOString(),
      }).eq("id", req.id);

      if (error) throw error;
      toast.success(`Request #${req.request_no} has been APPROVED!`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for the rejection");
      return;
    }

    try {
      const { error } = await supabase.from("approval_requests").update({
        status: "rejected",
        rejection_reason: rejectionReason.trim(),
        approved_by_name: "Super Admin (Action Taken)",
        approved_at: new Date().toISOString(),
      }).eq("id", rejectingItem.id);

      if (error) throw error;
      toast.error(`Request #${rejectingItem.request_no} has been REJECTED`);
      setRejectingItem(null);
      setRejectionReason("");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesType = typeFilter === "all" || r.request_type === typeFilter;
    const matchesSearch =
      !search ||
      r.request_no.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.requested_by_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.target_reference && r.target_reference.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesType && matchesSearch;
  });

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const pendingValue = pendingRequests.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="text-primary" size={24} />
              Enterprise Approval Workflows (ERP)
            </h1>
            <p className="text-sm text-muted-foreground">
              Multi-tier approval queues for sales discounts, purchase orders, field expenses, and stock write-offs.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 shadow-sm transition-all"
          >
            <Plus size={15} /> Submit Approval Request
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-amber-600 flex items-center justify-between">
              Pending Approvals <Clock size={15} />
            </span>
            <p className="text-2xl font-bold font-display text-amber-600 mt-1">{pendingRequests.length}</p>
            <p className="text-[11px] text-muted-foreground">Requires managerial action</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
              Pending Volume <DollarSign size={15} />
            </span>
            <p className="text-2xl font-bold font-display text-foreground mt-1">
              ₦{Number(pendingValue).toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Total monetary exposure</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-emerald-600 flex items-center justify-between">
              Approved Requests <CheckCircle size={15} />
            </span>
            <p className="text-2xl font-bold font-display text-emerald-600 mt-1">
              {requests.filter((r) => r.status === "approved").length}
            </p>
            <p className="text-[11px] text-muted-foreground">Successfully authorized</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-rose-600 flex items-center justify-between">
              Rejected Requests <XCircle size={15} />
            </span>
            <p className="text-2xl font-bold font-display text-rose-600 mt-1">
              {requests.filter((r) => r.status === "rejected").length}
            </p>
            <p className="text-[11px] text-muted-foreground">Declined with feedback</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search request #, title, applicant..."
              className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
            >
              <option value="all">All Request Types</option>
              <option value="discount_override">Discount Overrides</option>
              <option value="purchase_order">Purchase Orders</option>
              <option value="expense_claim">Field Expenses</option>
              <option value="inventory_writeoff">Inventory Write-Offs</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Approval Queue Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground bg-muted/20">
                  <th className="text-left px-4 py-3 font-semibold">Request #</th>
                  <th className="text-left px-4 py-3 font-semibold">Category</th>
                  <th className="text-left px-4 py-3 font-semibold">Request Title & Justification</th>
                  <th className="text-right px-4 py-3 font-semibold">Amount / Discount</th>
                  <th className="text-left px-4 py-3 font-semibold">Submitted By</th>
                  <th className="text-left px-4 py-3 font-semibold">Required Tier</th>
                  <th className="text-center px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Decisions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const typeMeta = typeLabels[req.request_type];
                  const Icon = typeMeta.icon;
                  return (
                    <tr key={req.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">{req.request_no}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeMeta.color}`}>
                          <Icon size={12} /> {typeMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-semibold text-foreground line-clamp-1">{req.title}</p>
                        {req.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{req.description}</p>
                        )}
                        {req.target_reference && (
                          <span className="text-[11px] font-mono text-primary mt-1 inline-block">
                            Ref: {req.target_reference}
                          </span>
                        )}
                        {req.rejection_reason && (
                          <p className="text-xs text-rose-600 font-medium mt-1">
                            Reason: {req.rejection_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {req.request_type === "discount_override" ? (
                          <span className="font-bold text-purple-700 dark:text-purple-400 font-mono text-sm">
                            {req.discount_percent}% Off
                          </span>
                        ) : (
                          <span className="font-bold text-foreground font-mono text-sm">
                            ₦{Number(req.amount).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground text-xs">{req.requested_by_name}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{req.requested_by_role}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-foreground bg-muted/60 px-2 py-1 rounded-md">
                          {tierLabels[req.required_approval_tier]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                            statusColors[req.status]
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {req.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApprove(req)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all"
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectingItem(req);
                                setRejectionReason("");
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-all"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            {req.status === "approved" ? "Authorized" : "Declined"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No approval requests found. All queues are currently clear.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: SUBMIT APPROVAL REQUEST */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-border">
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary" /> Submit Approval Request
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="p-6 space-y-4 text-sm">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Request Category *</label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
                  >
                    <option value="discount_override">Sales Discount Override (Above 5%)</option>
                    <option value="purchase_order">Procurement Purchase Order (Above ₦1M)</option>
                    <option value="expense_claim">Field Installation Expense Claim</option>
                    <option value="inventory_writeoff">Damaged / Defective Stock Write-Off</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title / Summary *</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 10% Discount on 10kVA Solar Commercial Installation"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                  />
                </div>

                {reqType === "discount_override" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Discount Percentage (%) *</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        required
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                        className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Quotation / Order Ref #</label>
                      <input
                        value={targetReference}
                        onChange={(e) => setTargetReference(e.target.value)}
                        placeholder="e.g. QUO-2608-491"
                        className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground font-mono uppercase"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Total Amount (₦) *</label>
                      <input
                        type="number"
                        min={100}
                        required
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        placeholder="e.g. 2500000"
                        className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Reference Document #</label>
                      <input
                        value={targetReference}
                        onChange={(e) => setTargetReference(e.target.value)}
                        placeholder="e.g. PO-88 or WO-1001"
                        className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground font-mono uppercase"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Applicant Name *</label>
                  <input
                    required
                    value={requestedByName}
                    onChange={(e) => setRequestedByName(e.target.value)}
                    placeholder="e.g. Babatunde Adeleke"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Business Rationale / Notes</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain why this authorization is necessary..."
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
                    Submit for Authorization
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: REJECT CONFIRMATION */}
        {rejectingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md p-6">
              <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2 mb-2">
                <XCircle size={20} className="text-rose-600" /> Decline Approval Request
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Please provide feedback for why Request #{rejectingItem.request_no} is being declined.
              </p>

              <form onSubmit={handleReject} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Rejection Rationale *</label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Discount exceeds margin floor; please offer free surge protector instead."
                    className="w-full rounded-xl border border-border bg-muted/50 p-3 text-xs text-foreground"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectingItem(null)}
                    className="flex-1 rounded-xl border border-border py-2 text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white py-2 text-sm font-semibold"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminApprovals;
