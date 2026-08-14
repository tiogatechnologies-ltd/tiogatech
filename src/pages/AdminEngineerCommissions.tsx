import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Award,
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  DollarSign,
  Calendar,
  AlertTriangle,
  UserCheck,
  Briefcase,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Commission {
  id: string;
  engineer_name: string;
  engineer_phone: string | null;
  work_order_no: string;
  system_size_kwp: number;
  commission_rate_per_kwp: number;
  commission_amount: number;
  bonus_amount: number;
  total_payout: number;
  status: "accrued" | "approved" | "paid";
  approved_by: string | null;
  paid_at: string | null;
  created_at: string;
}

interface Certification {
  id: string;
  engineer_name: string;
  certification_name: string;
  certificate_number: string;
  issuing_authority: string;
  issued_date: string;
  expiry_date: string;
  status: "active" | "expiring_soon" | "expired";
  created_at: string;
}

const statusColors: Record<Commission["status"], string> = {
  accrued: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const AdminEngineerCommissions = () => {
  const [activeTab, setActiveTab] = useState<"commissions" | "certifications">("commissions");
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [showAddCommModal, setShowAddCommModal] = useState(false);
  const [showAddCertModal, setShowAddCertModal] = useState(false);

  // Commission Form
  const [engName, setEngName] = useState("");
  const [engPhone, setEngPhone] = useState("");
  const [woNo, setWoNo] = useState("");
  const [kwpSize, setKwpSize] = useState(5.0);
  const [ratePerKwp, setRatePerKwp] = useState(15000);
  const [bonus, setBonus] = useState(10000);

  // Cert Form
  const [certEngName, setCertEngName] = useState("");
  const [certName, setCertName] = useState("NEMSA Certified Solar Competency Certificate");
  const [certNo, setCertNo] = useState("");
  const [certAuthority, setCertAuthority] = useState("Nigerian Electricity Management Services Agency");
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState("2027-12-31");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [commRes, certRes] = await Promise.all([
        supabase.from("engineer_commissions").select("*").order("created_at", { ascending: false }),
        supabase.from("engineer_certifications").select("*").order("expiry_date"),
      ]);
      if (commRes.data) setCommissions(commRes.data as Commission[]);
      if (certRes.data) setCerts(certRes.data as Certification[]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const commBase = Number(kwpSize || 0) * Number(ratePerKwp || 0);
  const totalPayoutEst = commBase + Number(bonus || 0);

  const handleCreateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!engName.trim() || !woNo.trim()) {
      toast.error("Please provide engineer name and work order #");
      return;
    }

    try {
      const payload = {
        engineer_name: engName.trim(),
        engineer_phone: engPhone.trim() || null,
        work_order_no: woNo.trim(),
        system_size_kwp: Number(kwpSize),
        commission_rate_per_kwp: Number(ratePerKwp),
        commission_amount: commBase,
        bonus_amount: Number(bonus || 0),
        total_payout: totalPayoutEst,
        status: "accrued",
      };

      const { error } = await supabase.from("engineer_commissions").insert([payload]);
      if (error) throw error;

      toast.success(`Commission of ₦${totalPayoutEst.toLocaleString()} accrued for ${engName}!`);
      setShowAddCommModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "approved" | "paid") => {
    try {
      const updatePayload: any = {
        status: newStatus,
      };
      if (newStatus === "approved") updatePayload.approved_by = "Lead Project Director";
      if (newStatus === "paid") updatePayload.paid_at = new Date().toISOString();

      const { error } = await supabase.from("engineer_commissions").update(updatePayload).eq("id", id);
      if (error) throw error;

      toast.success(`Commission marked as ${newStatus.toUpperCase()}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certEngName.trim() || !certNo.trim()) {
      toast.error("Please fill in engineer name and certificate #");
      return;
    }

    try {
      const payload = {
        engineer_name: certEngName.trim(),
        certification_name: certName.trim(),
        certificate_number: certNo.trim(),
        issuing_authority: certAuthority.trim(),
        issued_date: issuedDate,
        expiry_date: expiryDate,
        status: "active",
      };

      const { error } = await supabase.from("engineer_certifications").insert([payload]);
      if (error) throw error;

      toast.success(`Certification registered for ${certEngName}!`);
      setShowAddCertModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalAccrued = commissions.filter((c) => c.status === "accrued").reduce((sum, c) => sum + Number(c.total_payout || 0), 0);
  const totalApproved = commissions.filter((c) => c.status === "approved").reduce((sum, c) => sum + Number(c.total_payout || 0), 0);
  const totalPaid = commissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + Number(c.total_payout || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Award className="text-primary" size={24} />
              Engineer HSE Compliance & Commission Tracker (ERP)
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage technician HSE safety credentials (NEMSA/COREN) and calculate installation bonus payouts.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddCommModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 shadow-sm transition-all"
            >
              <Plus size={15} /> Accrue Commission
            </button>
            <button
              onClick={() => setShowAddCertModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-muted px-4 py-2.5 text-xs font-semibold text-foreground transition-all"
            >
              <ShieldCheck size={15} /> Add Safety License
            </button>
          </div>
        </div>

        {/* Commission KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-amber-600">Pending Accruals</span>
            <p className="text-2xl font-bold font-display text-amber-600 mt-1">
              ₦{totalAccrued.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Awaiting manager sign-off</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-blue-600">Approved for Payout</span>
            <p className="text-2xl font-bold font-display text-blue-600 mt-1">
              ₦{totalApproved.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Queued for bank disbursement</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-emerald-600">Disbursed YTD</span>
            <p className="text-2xl font-bold font-display text-emerald-600 mt-1">
              ₦{totalPaid.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Paid installation bonuses</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-purple-600">Active HSE Licenses</span>
            <p className="text-2xl font-bold font-display text-purple-600 mt-1">
              {certs.filter((c) => c.status === "active").length} Verified
            </p>
            <p className="text-[11px] text-muted-foreground">NEMSA, COREN, Safety L3</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("commissions")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "commissions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <DollarSign size={16} /> Commission Dispatches ({commissions.length})
          </button>
          <button
            onClick={() => setActiveTab("certifications")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "certifications"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck size={16} /> Safety Credentials & Licenses ({certs.length})
          </button>
        </div>

        {/* TAB 1: COMMISSIONS */}
        {activeTab === "commissions" && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">Engineer / Phone</th>
                    <th className="text-left px-4 py-3 font-semibold">Work Order #</th>
                    <th className="text-right px-4 py-3 font-semibold">Capacity (kWp)</th>
                    <th className="text-right px-4 py-3 font-semibold">Rate / kWp</th>
                    <th className="text-right px-4 py-3 font-semibold">Bonus</th>
                    <th className="text-right px-4 py-3 font-semibold">Total Payout (₦)</th>
                    <th className="text-center px-4 py-3 font-semibold">Status</th>
                    <th className="text-right px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{c.engineer_name}</p>
                        {c.engineer_phone && <p className="text-xs text-muted-foreground">{c.engineer_phone}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-foreground text-xs">{c.work_order_no}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-foreground">{c.system_size_kwp} kWp</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground text-xs">₦{Number(c.commission_rate_per_kwp).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground text-xs">₦{Number(c.bonus_amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                        ₦{Number(c.total_payout).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                            statusColors[c.status]
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        {c.status === "accrued" && (
                          <button
                            onClick={() => handleUpdateStatus(c.id, "approved")}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all"
                          >
                            Approve
                          </button>
                        )}
                        {c.status === "approved" && (
                          <button
                            onClick={() => handleUpdateStatus(c.id, "paid")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all"
                          >
                            Mark Paid
                          </button>
                        )}
                        {c.status === "paid" && (
                          <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
                            <CheckCircle2 size={13} /> Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {commissions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        No engineer commission records yet. Click "Accrue Commission" above to log an installation bonus.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CERTIFICATIONS */}
        {activeTab === "certifications" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certs.map((crt) => (
              <div key={crt.id} className="rounded-3xl border border-border bg-card p-5 space-y-3 relative overflow-hidden shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-primary" />
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{crt.engineer_name}</h4>
                      <p className="text-xs text-muted-foreground">{crt.certification_name}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                    {crt.status}
                  </span>
                </div>

                <div className="bg-muted/40 p-3 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License / Cert #:</span>
                    <span className="font-mono font-bold text-foreground">{crt.certificate_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Authority:</span>
                    <span className="text-foreground text-right">{crt.issuing_authority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires On:</span>
                    <span className="font-bold text-foreground">{crt.expiry_date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL: ACCRUE COMMISSION */}
        {showAddCommModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-border">
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <Award size={18} className="text-primary" /> Accrue Installation Commission
                </h3>
                <button onClick={() => setShowAddCommModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCommission} className="p-6 space-y-3.5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Lead Engineer *</label>
                    <input
                      required
                      value={engName}
                      onChange={(e) => setEngName(e.target.value)}
                      placeholder="e.g. Engr. Sunday Okon"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone Number</label>
                    <input
                      value={engPhone}
                      onChange={(e) => setEngPhone(e.target.value)}
                      placeholder="e.g. +2348123456789"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Work Order # *</label>
                  <input
                    required
                    value={woNo}
                    onChange={(e) => setWoNo(e.target.value)}
                    placeholder="e.g. WO-2608-1001"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono uppercase text-foreground"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Capacity (kWp) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={kwpSize}
                      onChange={(e) => setKwpSize(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Rate / kWp (₦)</label>
                    <input
                      type="number"
                      value={ratePerKwp}
                      onChange={(e) => setRatePerKwp(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Safety Bonus (₦)</label>
                    <input
                      type="number"
                      value={bonus}
                      onChange={(e) => setBonus(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground"
                    />
                  </div>
                </div>

                {/* Calculation breakdown */}
                <div className="bg-muted/40 p-4 rounded-2xl border border-border flex justify-between items-center text-xs">
                  <div>
                    <p className="text-muted-foreground">Total Payout Due:</p>
                    <p className="font-bold font-mono text-primary text-base">₦{totalPayoutEst.toLocaleString()}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground text-right">
                    (₦{commBase.toLocaleString()} base + ₦{Number(bonus || 0).toLocaleString()} bonus)
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCommModal(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                  >
                    Accrue Commission
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD SAFETY LICENSE */}
        {showAddCertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-border">
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary" /> Register HSE License
                </h3>
                <button onClick={() => setShowAddCertModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCert} className="p-6 space-y-3.5 text-sm">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Engineer Name *</label>
                  <input
                    required
                    value={certEngName}
                    onChange={(e) => setCertEngName(e.target.value)}
                    placeholder="e.g. Engr. Sunday Okon"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Certification Title *</label>
                  <input
                    required
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    placeholder="e.g. NEMSA Certified Solar Installer"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">License / Cert # *</label>
                    <input
                      required
                      value={certNo}
                      onChange={(e) => setCertNo(e.target.value)}
                      placeholder="e.g. NEMSA-2024-098"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono uppercase text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Issuing Body</label>
                    <input
                      value={certAuthority}
                      onChange={(e) => setCertAuthority(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Issued Date</label>
                    <input
                      type="date"
                      value={issuedDate}
                      onChange={(e) => setIssuedDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Expiry Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCertModal(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                  >
                    Save Certification
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

export default AdminEngineerCommissions;
