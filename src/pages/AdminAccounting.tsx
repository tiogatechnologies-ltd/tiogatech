import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  BookOpen,
  Plus,
  Search,
  Printer,
  TrendingUp,
  DollarSign,
  PieChart,
  Scale,
  FileSpreadsheet,
  X,
  Loader2,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface Account {
  id: string;
  code: string;
  name: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  balance: number;
  description: string | null;
  is_active: boolean;
}

interface JournalEntryLine {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description?: string;
}

interface JournalEntry {
  id: string;
  entry_no: string;
  entry_date: string;
  reference_type: string;
  reference_no: string | null;
  narration: string;
  total_debit: number;
  total_credit: number;
  status: "draft" | "posted";
  created_at: string;
}

const typeColors: Record<Account["account_type"], string> = {
  asset: "bg-blue-100 text-blue-800 border-blue-200",
  liability: "bg-amber-100 text-amber-800 border-amber-200",
  equity: "bg-purple-100 text-purple-800 border-purple-200",
  revenue: "bg-emerald-100 text-emerald-800 border-emerald-200",
  expense: "bg-rose-100 text-rose-800 border-rose-200",
};

const AdminAccounting = () => {
  const [activeTab, setActiveTab] = useState<"coa" | "journal" | "pnl" | "balance_sheet">("coa");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");

  // Modals
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAddJournalModal, setShowAddJournalModal] = useState(false);

  // New Account form
  const [newAccCode, setNewAccCode] = useState("");
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState<Account["account_type"]>("asset");
  const [newAccBalance, setNewAccBalance] = useState(0);
  const [newAccDesc, setNewAccDesc] = useState("");

  // New Journal Entry form
  const [jrnDate, setJrnDate] = useState(new Date().toISOString().slice(0, 10));
  const [jrnNarration, setJrnNarration] = useState("");
  const [jrnRefType, setJrnRefType] = useState("manual");
  const [jrnRefNo, setJrnRefNo] = useState("");
  const [jrnLines, setJrnLines] = useState<JournalEntryLine[]>([
    { account_code: "1020", account_name: "Access Bank Plc", debit: 1500000, credit: 0 },
    { account_code: "4010", account_name: "Solar System Sales Revenue", debit: 0, credit: 1500000 },
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accRes, jrnRes] = await Promise.all([
        supabase.from("chart_of_accounts").select("*").order("code"),
        supabase.from("journal_entries").select("*").order("entry_date", { ascending: false }),
      ]);
      if (accRes.data) setAccounts(accRes.data as Account[]);
      if (jrnRes.data) setEntries(jrnRes.data as JournalEntry[]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccCode.trim() || !newAccName.trim()) {
      toast.error("Please fill in account code and name");
      return;
    }
    try {
      const { error } = await supabase.from("chart_of_accounts").insert({
        code: newAccCode.trim(),
        name: newAccName.trim(),
        account_type: newAccType,
        balance: Number(newAccBalance || 0),
        description: newAccDesc.trim() || null,
      });
      if (error) throw error;
      toast.success("Account added to Chart of Accounts");
      setShowAddAccountModal(false);
      setNewAccCode("");
      setNewAccName("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddJournalLine = () => {
    setJrnLines([...jrnLines, { account_code: "", account_name: "", debit: 0, credit: 0 }]);
  };

  const handleJournalLineChange = (index: number, field: keyof JournalEntryLine, val: any) => {
    const updated = [...jrnLines];
    updated[index] = { ...updated[index], [field]: val };
    if (field === "account_code") {
      const found = accounts.find((a) => a.code === val);
      if (found) updated[index].account_name = found.name;
    }
    setJrnLines(updated);
  };

  const totalDebits = jrnLines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
  const totalCredits = jrnLines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
  const isBalanced = totalDebits > 0 && Math.abs(totalDebits - totalCredits) < 0.01;

  const handleCreateJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jrnNarration.trim()) {
      toast.error("Please provide a narration for the journal entry");
      return;
    }
    if (!isBalanced) {
      toast.error(`Journal entry is unbalanced! Debits (₦${totalDebits.toLocaleString()}) must equal Credits (₦${totalCredits.toLocaleString()})`);
      return;
    }

    try {
      const entryNo = `JRN-${new Date().toISOString().slice(2, 7).replace("-", "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data, error } = await supabase.from("journal_entries").insert({
        entry_no: entryNo,
        entry_date: jrnDate,
        reference_type: jrnRefType,
        reference_no: jrnRefNo.trim() || null,
        narration: jrnNarration.trim(),
        total_debit: totalDebits,
        total_credit: totalCredits,
        status: "posted",
      }).select().single();

      if (error) throw error;

      if (data) {
        const linesPayload = jrnLines.map((l) => ({
          entry_id: data.id,
          account_code: l.account_code,
          account_name: l.account_name,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
        }));
        await supabase.from("journal_entry_lines").insert(linesPayload);
      }

      toast.success(`Journal Entry #${entryNo} posted to General Ledger!`);
      setShowAddJournalModal(false);
      setJrnNarration("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Financial Statement Calculations
  const revenueAccounts = accounts.filter((a) => a.account_type === "revenue");
  const expenseAccounts = accounts.filter((a) => a.account_type === "expense");
  const assetAccounts = accounts.filter((a) => a.account_type === "asset");
  const liabilityAccounts = accounts.filter((a) => a.account_type === "liability");
  const equityAccounts = accounts.filter((a) => a.account_type === "equity");

  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  const totalAssets = assetAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const totalEquity = equityAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0) + netIncome;

  const filteredAccounts = accounts.filter((a) => {
    const matchesType = accountTypeFilter === "all" || a.account_type === accountTypeFilter;
    const matchesSearch =
      !search ||
      a.code.includes(search) ||
      a.name.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <BookOpen className="text-primary" size={24} />
              General Ledger & Double-Entry Accounting (ERP)
            </h1>
            <p className="text-sm text-muted-foreground">
              Chart of accounts, double-entry journal entries, real-time Profit & Loss (P&L), and Balance Sheet.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddJournalModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 shadow-sm transition-all"
            >
              <Plus size={15} /> Post Journal Entry
            </button>
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-muted px-4 py-2.5 text-xs font-semibold text-foreground transition-all"
            >
              <Plus size={15} /> Add Account
            </button>
          </div>
        </div>

        {/* Financial KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Total Revenue</span>
            <p className="text-2xl font-bold font-display text-emerald-600 mt-1">
              ₦{totalRevenue.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Sales & Service Inflow</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-muted-foreground">COGS & Expenses</span>
            <p className="text-2xl font-bold font-display text-rose-600 mt-1">
              ₦{totalExpenses.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Hardware COGS, Wages, Transport</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Net Operating Profit</span>
            <p className={`text-2xl font-bold font-display mt-1 ${netIncome >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600"}`}>
              ₦{netIncome.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Net Margin: {totalRevenue ? ((netIncome / totalRevenue) * 100).toFixed(1) : 0}%</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Total Asset Base</span>
            <p className="text-2xl font-bold font-display text-blue-600 mt-1">
              ₦{totalAssets.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Bank, Cash, Inventory, Debtors</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("coa")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "coa"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen size={16} /> Chart of Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab("journal")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "journal"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileSpreadsheet size={16} /> Journal Entries ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab("pnl")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "pnl"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp size={16} /> Income Statement (P&L)
          </button>
          <button
            onClick={() => setActiveTab("balance_sheet")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "balance_sheet"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Scale size={16} /> Balance Sheet
          </button>
        </div>

        {/* TAB 1: CHART OF ACCOUNTS */}
        {activeTab === "coa" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search code or account title..."
                  className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
              >
                <option value="all">All Account Classes</option>
                <option value="asset">Assets (1000s)</option>
                <option value="liability">Liabilities (2000s)</option>
                <option value="equity">Equity (3000s)</option>
                <option value="revenue">Revenue (4000s)</option>
                <option value="expense">Expenses (5000s)</option>
              </select>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground bg-muted/20">
                      <th className="text-left px-4 py-3 font-semibold">Account Code</th>
                      <th className="text-left px-4 py-3 font-semibold">Account Name & Description</th>
                      <th className="text-center px-4 py-3 font-semibold">Classification</th>
                      <th className="text-right px-4 py-3 font-semibold">Current Balance (₦)</th>
                      <th className="text-center px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((acc) => (
                      <tr key={acc.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-foreground">{acc.code}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{acc.name}</p>
                          {acc.description && <p className="text-xs text-muted-foreground">{acc.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                              typeColors[acc.account_type]
                            }`}
                          >
                            {acc.account_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                          ₦{Number(acc.balance).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-semibold">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: JOURNAL ENTRIES */}
        {activeTab === "journal" && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">Journal #</th>
                    <th className="text-left px-4 py-3 font-semibold">Date</th>
                    <th className="text-left px-4 py-3 font-semibold">Narration & Ref</th>
                    <th className="text-right px-4 py-3 font-semibold">Total Debit (₦)</th>
                    <th className="text-right px-4 py-3 font-semibold">Total Credit (₦)</th>
                    <th className="text-center px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((jrn) => (
                    <tr key={jrn.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">{jrn.entry_no}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{jrn.entry_date}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground text-xs">{jrn.narration}</p>
                        {jrn.reference_no && (
                          <span className="text-[11px] font-mono text-primary">Ref: {jrn.reference_no}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                        ₦{Number(jrn.total_debit).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                        ₦{Number(jrn.total_credit).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-full bg-green-100 text-green-800 px-2.5 py-0.5 text-xs font-semibold">
                          Posted
                        </span>
                      </td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        No manual journal entries recorded yet. Click "Post Journal Entry" above to add debit/credit lines.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PROFIT & LOSS STATEMENT */}
        {activeTab === "pnl" && (
          <div className="bg-card rounded-3xl border border-border p-6 max-w-3xl mx-auto shadow-sm">
            <div className="flex justify-between items-start border-b border-border pb-4 mb-6">
              <div>
                <h3 className="font-display font-bold text-xl text-foreground">Statement of Profit or Loss (P&L)</h3>
                <p className="text-xs text-muted-foreground">Tioga Technologies Ltd • Year-to-Date (NGN)</p>
              </div>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                <Printer size={13} /> Export P&L
              </button>
            </div>

            {/* Revenue */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 border-b border-border/50 pb-1">
                1. Operating Revenue
              </h4>
              {revenueAccounts.map((a) => (
                <div key={a.id} className="flex justify-between text-xs text-foreground py-1">
                  <span>{a.name} ({a.code})</span>
                  <span className="font-mono font-semibold">₦{Number(a.balance).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold text-emerald-700 dark:text-emerald-400 border-t border-border pt-1.5">
                <span>Total Revenue</span>
                <span className="font-mono">₦{totalRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Expenses */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 border-b border-border/50 pb-1">
                2. Cost of Sales & Operating Expenses
              </h4>
              {expenseAccounts.map((a) => (
                <div key={a.id} className="flex justify-between text-xs text-foreground py-1">
                  <span>{a.name} ({a.code})</span>
                  <span className="font-mono font-semibold">₦{Number(a.balance).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold text-rose-700 dark:text-rose-400 border-t border-border pt-1.5">
                <span>Total Costs & Expenses</span>
                <span className="font-mono">₦{totalExpenses.toLocaleString()}</span>
              </div>
            </div>

            {/* Net Income Summary */}
            <div className="bg-muted/40 p-4 rounded-2xl border border-border flex justify-between items-center">
              <div>
                <p className="font-bold text-foreground text-sm">Net Operating Profit Before Tax</p>
                <p className="text-xs text-muted-foreground">Operating margin: {totalRevenue ? ((netIncome / totalRevenue) * 100).toFixed(2) : 0}%</p>
              </div>
              <p className="text-xl font-bold font-mono text-emerald-600">
                ₦{netIncome.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: BALANCE SHEET */}
        {activeTab === "balance_sheet" && (
          <div className="bg-card rounded-3xl border border-border p-6 max-w-3xl mx-auto shadow-sm">
            <div className="flex justify-between items-start border-b border-border pb-4 mb-6">
              <div>
                <h3 className="font-display font-bold text-xl text-foreground">Statement of Financial Position (Balance Sheet)</h3>
                <p className="text-xs text-muted-foreground">Assets = Liabilities + Owner Equity</p>
              </div>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
              >
                <Printer size={13} /> Export Balance Sheet
              </button>
            </div>

            {/* Assets */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 border-b border-border/50 pb-1">
                Current & Non-Current Assets
              </h4>
              {assetAccounts.map((a) => (
                <div key={a.id} className="flex justify-between text-xs text-foreground py-1">
                  <span>{a.name} ({a.code})</span>
                  <span className="font-mono font-semibold">₦{Number(a.balance).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold text-blue-700 dark:text-blue-400 border-t border-border pt-1.5">
                <span>TOTAL ASSETS</span>
                <span className="font-mono">₦{totalAssets.toLocaleString()}</span>
              </div>
            </div>

            {/* Liabilities */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 border-b border-border/50 pb-1">
                Liabilities
              </h4>
              {liabilityAccounts.map((a) => (
                <div key={a.id} className="flex justify-between text-xs text-foreground py-1">
                  <span>{a.name} ({a.code})</span>
                  <span className="font-mono font-semibold">₦{Number(a.balance).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold text-amber-700 dark:text-amber-400 border-t border-border pt-1.5">
                <span>TOTAL LIABILITIES</span>
                <span className="font-mono">₦{totalLiabilities.toLocaleString()}</span>
              </div>
            </div>

            {/* Equity */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 border-b border-border/50 pb-1">
                Owner Equity & Retained Earnings
              </h4>
              {equityAccounts.map((a) => (
                <div key={a.id} className="flex justify-between text-xs text-foreground py-1">
                  <span>{a.name} ({a.code})</span>
                  <span className="font-mono font-semibold">₦{Number(a.balance).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs text-emerald-600 font-semibold py-1">
                <span>Current Year Retained Profit (from P&L)</span>
                <span className="font-mono">₦{netIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-purple-700 dark:text-purple-400 border-t border-border pt-1.5">
                <span>TOTAL EQUITY</span>
                <span className="font-mono">₦{totalEquity.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-muted/40 p-4 rounded-2xl border border-border flex justify-between items-center font-bold text-sm">
              <span>Total Liabilities & Equity</span>
              <span className="font-mono text-foreground">₦{(totalLiabilities + totalEquity).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* MODAL: POST JOURNAL ENTRY */}
        {showAddJournalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-border">
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-primary" /> Post Double-Entry Journal Entry
                </h3>
                <button onClick={() => setShowAddJournalModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateJournalEntry} className="p-6 space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Entry Date *</label>
                    <input
                      type="date"
                      required
                      value={jrnDate}
                      onChange={(e) => setJrnDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Reference Type</label>
                    <select
                      value={jrnRefType}
                      onChange={(e) => setJrnRefType(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    >
                      <option value="manual">Manual Adjustment</option>
                      <option value="invoice">Customer Invoice</option>
                      <option value="purchase_order">Supplier PO</option>
                      <option value="payroll">Installer Payroll</option>
                      <option value="expense">Expense Reimbursement</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Ref Document #</label>
                    <input
                      value={jrnRefNo}
                      onChange={(e) => setJrnRefNo(e.target.value)}
                      placeholder="e.g. INV-2608-01"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Narration / Description *</label>
                  <input
                    required
                    value={jrnNarration}
                    onChange={(e) => setJrnNarration(e.target.value)}
                    placeholder="e.g. Deposit received for 5kVA Solar Installation at Lekki"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                  />
                </div>

                {/* Journal Lines */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Debit & Credit Lines</label>
                    <button
                      type="button"
                      onClick={handleAddJournalLine}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Account Line
                    </button>
                  </div>

                  {jrnLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-muted/30 p-2 rounded-xl">
                      <div className="col-span-6">
                        <select
                          required
                          value={line.account_code}
                          onChange={(e) => handleJournalLineChange(idx, "account_code", e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                        >
                          <option value="">Select GL Account</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.code}>
                              {a.code} - {a.name} ({a.account_type.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={line.debit}
                          onChange={(e) => handleJournalLineChange(idx, "debit", Number(e.target.value))}
                          placeholder="Debit (₦)"
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground text-right"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={line.credit}
                          onChange={(e) => handleJournalLineChange(idx, "credit", Number(e.target.value))}
                          placeholder="Credit (₦)"
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground text-right"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Balancing check */}
                <div className="bg-muted/40 p-4 rounded-2xl flex justify-between items-center text-xs border border-border">
                  <div>
                    <p className="font-bold text-foreground">Total Debits: ₦{totalDebits.toLocaleString()}</p>
                    <p className="font-bold text-foreground">Total Credits: ₦{totalCredits.toLocaleString()}</p>
                  </div>
                  <div>
                    {isBalanced ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full font-bold">
                        <CheckCircle2 size={13} /> Balanced (Ready to Post)
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold">
                        Out of Balance by ₦{Math.abs(totalDebits - totalCredits).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddJournalModal(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isBalanced}
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
                  >
                    Post to General Ledger
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD ACCOUNT */}
        {showAddAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-border">
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <BookOpen size={18} className="text-primary" /> Add GL Account
                </h3>
                <button onClick={() => setShowAddAccountModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddAccount} className="p-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Account Code *</label>
                    <input
                      required
                      value={newAccCode}
                      onChange={(e) => setNewAccCode(e.target.value)}
                      placeholder="e.g. 5050"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Classification *</label>
                    <select
                      value={newAccType}
                      onChange={(e) => setNewAccType(e.target.value as any)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
                    >
                      <option value="asset">Asset (1000s)</option>
                      <option value="liability">Liability (2000s)</option>
                      <option value="equity">Equity (3000s)</option>
                      <option value="revenue">Revenue (4000s)</option>
                      <option value="expense">Expense (5000s)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Account Title *</label>
                  <input
                    required
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    placeholder="e.g. Solar Cable & DC Breaker Consumables"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Opening Balance (₦)</label>
                  <input
                    type="number"
                    value={newAccBalance}
                    onChange={(e) => setNewAccBalance(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-mono text-foreground"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAccountModal(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                  >
                    Save Account
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

export default AdminAccounting;
