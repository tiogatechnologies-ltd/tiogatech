import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  PieChart,
  Plus,
  Search,
  Printer,
  TrendingUp,
  DollarSign,
  Zap,
  Wrench,
  Truck,
  AlertTriangle,
  FileText,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;

interface JobCostingRecord {
  id: string;
  job_no: string;
  work_order_no: string;
  customer_name: string;
  system_description: string;
  contract_revenue: number;
  hardware_cogs: number;
  technician_labor_cost: number;
  logistics_cost: number;
  miscellaneous_cost: number;
  gross_profit: number;
  gross_margin_percent: number;
  completed_date: string;
  created_at: string;
}

const AdminJobCosting = () => {
  const [jobs, setJobs] = useState<JobCostingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [marginFilter, setMarginFilter] = useState("all");

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [woNo, setWoNo] = useState("");
  const [clientName, setClientName] = useState("");
  const [systemDesc, setSystemDesc] = useState("");
  const [contractRev, setContractRev] = useState(5000000);
  const [hardwareCogs, setHardwareCogs] = useState(3200000);
  const [laborCost, setLaborCost] = useState(250000);
  const [logisticsCost, setLogisticsCost] = useState(80000);
  const [miscCost, setMiscCost] = useState(40000);
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from("job_costing_records")
        .select("*")
        .order("completed_date", { ascending: false });
      if (error) throw error;
      setJobs((data as JobCostingRecord[]) || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const totalCosts = Number(hardwareCogs || 0) + Number(laborCost || 0) + Number(logisticsCost || 0) + Number(miscCost || 0);
  const grossProfit = Number(contractRev || 0) - totalCosts;
  const grossMarginPercent = contractRev > 0 ? (grossProfit / contractRev) * 100 : 0;

  const handleCreateJobCosting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !systemDesc.trim()) {
      toast.error("Please fill in client name and system description");
      return;
    }

    try {
      const jobNo = `JOB-${new Date().toISOString().slice(2, 7).replace("-", "")}-${Math.floor(10 + Math.random() * 90)}`;
      const payload = {
        job_no: jobNo,
        work_order_no: woNo.trim() || `WO-${new Date().toISOString().slice(2, 7).replace("-", "")}-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_name: clientName.trim(),
        system_description: systemDesc.trim(),
        contract_revenue: Number(contractRev),
        hardware_cogs: Number(hardwareCogs),
        technician_labor_cost: Number(laborCost),
        logistics_cost: Number(logisticsCost),
        miscellaneous_cost: Number(miscCost),
        gross_profit: grossProfit,
        gross_margin_percent: Number(grossMarginPercent.toFixed(2)),
        completed_date: completedDate,
      };

      const { error } = await db.from("job_costing_records").insert([payload]);
      if (error) throw error;

      toast.success(`Job Costing Record #${jobNo} created! Margin: ${grossMarginPercent.toFixed(1)}%`);
      setShowAddModal(false);
      fetchJobs();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalContractRevenue = jobs.reduce((sum, j) => sum + Number(j.contract_revenue || 0), 0);
  const totalHardwareCogs = jobs.reduce((sum, j) => sum + Number(j.hardware_cogs || 0), 0);
  const totalLaborLogistics = jobs.reduce((sum, j) => sum + Number(j.technician_labor_cost || 0) + Number(j.logistics_cost || 0), 0);
  const totalGrossProfit = jobs.reduce((sum, j) => sum + Number(j.gross_profit || 0), 0);
  const avgGrossMargin = totalContractRevenue > 0 ? (totalGrossProfit / totalContractRevenue) * 100 : 0;

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      !search ||
      j.job_no.toLowerCase().includes(search.toLowerCase()) ||
      j.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      j.system_description.toLowerCase().includes(search.toLowerCase());

    const matchesMargin =
      marginFilter === "all" ||
      (marginFilter === "high" && j.gross_margin_percent >= 30) ||
      (marginFilter === "medium" && j.gross_margin_percent >= 20 && j.gross_margin_percent < 30) ||
      (marginFilter === "low" && j.gross_margin_percent < 20);

    return matchesSearch && matchesMargin;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="text-primary" size={24} />
              Job Costing & Profitability Margin Analytics (ERP)
            </h1>
            <p className="text-sm text-muted-foreground">
              Analyze per-project gross margins: Revenue vs Hardware BOM COGS, Field Labor, and Logistics.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 shadow-sm transition-all"
          >
            <Plus size={15} /> Log Installation Costing
          </button>
        </div>

        {/* Project Profitability KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Project Revenue</span>
            <p className="text-2xl font-bold font-display text-foreground mt-1">
              ₦{totalContractRevenue.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Across {jobs.length} completed projects</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-rose-600">Hardware BOM Cost</span>
            <p className="text-2xl font-bold font-display text-rose-600 mt-1">
              ₦{totalHardwareCogs.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Direct Inverters, Batteries & Panels</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-emerald-600">Total Gross Profit</span>
            <p className="text-2xl font-bold font-display text-emerald-600 mt-1">
              ₦{totalGrossProfit.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">After all site labor & haulage</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-primary">Avg. Gross Margin</span>
            <p className="text-2xl font-bold font-display text-primary mt-1">
              {avgGrossMargin.toFixed(1)}%
            </p>
            <p className="text-[11px] text-muted-foreground">Target: &gt; 25% Gross Margin</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job #, customer, solar package..."
              className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <select
            value={marginFilter}
            onChange={(e) => setMarginFilter(e.target.value)}
            className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
          >
            <option value="all">All Profitability Bands</option>
            <option value="high">High Margin (&gt; 30%)</option>
            <option value="medium">Healthy Margin (20% - 30%)</option>
            <option value="low">Low Margin (&lt; 20%)</option>
          </select>
        </div>

        {/* Job Costing Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground bg-muted/20">
                  <th className="text-left px-4 py-3 font-semibold">Job # / WO</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer & System Installed</th>
                  <th className="text-right px-4 py-3 font-semibold">Revenue (₦)</th>
                  <th className="text-right px-4 py-3 font-semibold">Hardware BOM (₦)</th>
                  <th className="text-right px-4 py-3 font-semibold">Labor & Logistics (₦)</th>
                  <th className="text-right px-4 py-3 font-semibold">Gross Profit (₦)</th>
                  <th className="text-center px-4 py-3 font-semibold">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((j) => {
                  const isHigh = j.gross_margin_percent >= 30;
                  const isHealthy = j.gross_margin_percent >= 20 && j.gross_margin_percent < 30;
                  return (
                    <tr key={j.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-mono font-bold text-foreground">{j.job_no}</p>
                        <p className="text-[11px] font-mono text-muted-foreground">{j.work_order_no}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{j.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{j.system_description}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                        ₦{Number(j.contract_revenue).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-rose-600">
                        ₦{Number(j.hardware_cogs).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground text-xs">
                        ₦{(Number(j.technician_labor_cost) + Number(j.logistics_cost)).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                        ₦{Number(j.gross_profit).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                            isHigh
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : isHealthy
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                          }`}
                        >
                          {j.gross_margin_percent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredJobs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No job costing records found. Click "Log Installation Costing" above to record project figures.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: LOG PROJECT COSTING */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-border">
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" /> Log Job Costing & Profitability
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateJobCosting} className="p-6 space-y-3.5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Customer Name *</label>
                    <input
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Chief Adebayo"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Work Order Ref #</label>
                    <input
                      value={woNo}
                      onChange={(e) => setWoNo(e.target.value)}
                      placeholder="e.g. WO-2608-1001"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono uppercase text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">System Installed *</label>
                  <input
                    required
                    value={systemDesc}
                    onChange={(e) => setSystemDesc(e.target.value)}
                    placeholder="e.g. 5kVA Solar Inverter + 10kWh Lithium Battery"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Contract Revenue (₦) *</label>
                    <input
                      type="number"
                      required
                      value={contractRev}
                      onChange={(e) => setContractRev(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Hardware BOM COGS (₦) *</label>
                    <input
                      type="number"
                      required
                      value={hardwareCogs}
                      onChange={(e) => setHardwareCogs(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Labor Wages (₦)</label>
                    <input
                      type="number"
                      value={laborCost}
                      onChange={(e) => setLaborCost(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Logistics / Van (₦)</label>
                    <input
                      type="number"
                      value={logisticsCost}
                      onChange={(e) => setLogisticsCost(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Sundry / Misc (₦)</label>
                    <input
                      type="number"
                      value={miscCost}
                      onChange={(e) => setMiscCost(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground"
                    />
                  </div>
                </div>

                {/* Live Margin Calculation */}
                <div className="bg-muted/40 p-4 rounded-2xl border border-border flex justify-between items-center text-xs">
                  <div>
                    <p className="text-muted-foreground">Estimated Gross Profit:</p>
                    <p className="font-bold font-mono text-emerald-600 text-sm">₦{grossProfit.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Gross Margin %:</p>
                    <p className="font-bold font-mono text-primary text-sm">{grossMarginPercent.toFixed(2)}%</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                  >
                    Save Job Costing
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

export default AdminJobCosting;
