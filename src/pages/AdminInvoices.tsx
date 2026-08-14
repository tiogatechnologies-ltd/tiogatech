import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  FileText,
  Plus,
  Search,
  Printer,
  Download,
  Trash2,
  Edit,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  QrCode,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_no: string;
  invoice_type: "tax_invoice" | "proforma" | "receipt";
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string | null;
  items: InvoiceItem[];
  subtotal: number;
  vat_applicable: boolean;
  vat_amount: number;
  wht_applicable: boolean;
  wht_amount: number;
  discount_amount: number;
  total_amount: number;
  deposit_paid: number;
  balance_due: number;
  issue_date: string;
  due_date: string | null;
  status: "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "cancelled";
  payment_method: string;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  partially_paid: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-zinc-200 text-zinc-600",
};

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Form states
  const [invoiceType, setInvoiceType] = useState<"tax_invoice" | "proforma" | "receipt">("tax_invoice");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [vatApplicable, setVatApplicable] = useState(true);
  const [whtApplicable, setWhtApplicable] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [depositPaid, setDepositPaid] = useState(0);
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "5kVA Solar Inverter + 10kWh Lithium Battery System", quantity: 1, unit_price: 3500000, total: 3500000 },
  ]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setInvoices((data as Invoice[]) || []);
    } catch (err: any) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0, total: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };
    item.total = Number(item.quantity || 0) * Number(item.unit_price || 0);
    updated[index] = item;
    setItems(updated);
  };

  // Math calculations
  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const vatAmount = vatApplicable ? Math.round(subtotal * 0.075) : 0; // FIRS 7.5%
  const whtAmount = whtApplicable ? Math.round(subtotal * 0.05) : 0; // 5% WHT
  const totalAmount = Math.max(0, subtotal + vatAmount - whtAmount - Number(discountAmount || 0));
  const balanceDue = Math.max(0, totalAmount - Number(depositPaid || 0));

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || items.length === 0) {
      toast.error("Please complete the required customer and item details");
      return;
    }

    try {
      const prefix = invoiceType === "tax_invoice" ? "INV" : invoiceType === "proforma" ? "PRO" : "REC";
      const invoiceNo = `TIO-${prefix}-${new Date().toISOString().slice(2, 7).replace("-", "")}-${Math.floor(1000 + Math.random() * 9000)}`;

      const invoicePayload = {
        invoice_no: invoiceNo,
        invoice_type: invoiceType,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || null,
        customer_address: customerAddress.trim() || null,
        items,
        subtotal,
        vat_applicable: vatApplicable,
        vat_amount: vatAmount,
        wht_applicable: whtApplicable,
        wht_amount: whtAmount,
        discount_amount: Number(discountAmount || 0),
        total_amount: totalAmount,
        deposit_paid: Number(depositPaid || 0),
        balance_due: balanceDue,
        issue_date: issueDate,
        due_date: dueDate || null,
        status: balanceDue === 0 ? "paid" : depositPaid > 0 ? "partially_paid" : "sent",
        notes: notes.trim() || null,
      };

      const { data, error } = await supabase.from("invoices").insert([invoicePayload]).select().single();
      if (error) throw error;

      toast.success(`${invoiceType.toUpperCase()} #${invoiceNo} created successfully!`);
      setShowCreateModal(false);
      fetchInvoices();
      if (data) setViewingInvoice(data as Invoice);
    } catch (err: any) {
      toast.error(err.message || "Failed to create invoice");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("invoices").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      toast.success(`Invoice status updated to ${newStatus}`);
      fetchInvoices();
      if (viewingInvoice?.id === id) {
        setViewingInvoice({ ...viewingInvoice, status: newStatus as any });
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
      toast.success("Invoice deleted");
      fetchInvoices();
      if (viewingInvoice?.id === id) setViewingInvoice(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchesType = typeFilter === "all" || inv.invoice_type === typeFilter;
    const matchesSearch =
      !search ||
      inv.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_phone.includes(search);
    return matchesStatus && matchesType && matchesSearch;
  });

  const totalReceivables = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((sum, i) => sum + Number(i.balance_due || 0), 0);

  const totalPaidRevenue = invoices
    .filter((i) => i.status !== "cancelled")
    .reduce((sum, i) => sum + Number(i.deposit_paid || (i.status === "paid" ? i.total_amount : 0)), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <FileText className="text-primary" size={24} />
              Invoicing, Tax (VAT/WHT) & Receivables (ERP)
            </h1>
            <p className="text-sm text-muted-foreground">
              Generate FIRS-compliant tax invoices, proformas, record deposits, and track customer balances.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 shadow-sm transition-all"
          >
            <Plus size={15} /> Create Invoice / Proforma
          </button>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Total Invoices</span>
            <p className="text-2xl font-bold font-display text-foreground mt-1">{invoices.length}</p>
            <p className="text-[11px] text-muted-foreground">Tax Invoices & Proformas</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-emerald-600">Collected Revenue</span>
            <p className="text-2xl font-bold font-display text-emerald-600 mt-1">
              ₦{Number(totalPaidRevenue).toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Confirmed Receipts & Deposits</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-amber-600">Accounts Receivable</span>
            <p className="text-2xl font-bold font-display text-amber-600 mt-1">
              ₦{Number(totalReceivables).toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Outstanding Customer Balances</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Paid In Full</span>
            <p className="text-2xl font-bold font-display text-foreground mt-1">
              {invoices.filter((i) => i.status === "paid").length}
            </p>
            <p className="text-[11px] text-muted-foreground">Fully settled accounts</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice #, customer name..."
              className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
            >
              <option value="all">All Types</option>
              <option value="tax_invoice">Tax Invoice</option>
              <option value="proforma">Proforma Invoice</option>
              <option value="receipt">Receipt</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground bg-muted/20">
                  <th className="text-left px-4 py-3 font-semibold">Invoice #</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-right px-4 py-3 font-semibold">Total (₦)</th>
                  <th className="text-right px-4 py-3 font-semibold">Paid (₦)</th>
                  <th className="text-right px-4 py-3 font-semibold">Balance Due</th>
                  <th className="text-center px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">{inv.invoice_no}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                        {inv.invoice_type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{inv.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{inv.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      ₦{Number(inv.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                      ₦{Number(inv.deposit_paid || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-600">
                      ₦{Number(inv.balance_due || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          statusColors[inv.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {inv.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground"
                          title="View / Print Invoice"
                        >
                          <Printer size={13} /> View
                        </button>
                        <select
                          value={inv.status}
                          onChange={(e) => handleUpdateStatus(inv.id, e.target.value)}
                          className="text-[11px] font-semibold border rounded-lg p-1 bg-muted/40 text-foreground"
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="partially_paid">Partially Paid</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No invoices found. Click "Create Invoice / Proforma" above to generate your first document.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: CREATE INVOICE */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-border">
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <FileText size={18} className="text-primary" /> Create FIRS-Compliant Invoice / Proforma
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Document Type *</label>
                    <select
                      value={invoiceType}
                      onChange={(e) => setInvoiceType(e.target.value as any)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
                    >
                      <option value="tax_invoice">Commercial Tax Invoice</option>
                      <option value="proforma">Proforma Invoice / Quotation</option>
                      <option value="receipt">Official Payment Receipt</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Issue Date *</label>
                    <input
                      type="date"
                      required
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Customer Name *</label>
                    <input
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Chief Adeola Williams"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone Number *</label>
                    <input
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. +234 803 123 4567"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email (Optional)</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="client@company.com"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Billing / Site Address</label>
                  <input
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="e.g. Plot 15 Admiralty Way, Lekki Phase 1, Lagos"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                  />
                </div>

                {/* Line Items */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Line Items</label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Line Item
                    </button>
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-muted/30 p-2 rounded-xl">
                      <div className="col-span-6">
                        <input
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          placeholder="Item Description"
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                          placeholder="Qty"
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          required
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, "unit_price", Number(e.target.value))}
                          placeholder="Unit Price (₦)"
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground text-right"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-muted-foreground hover:text-destructive p-1"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tax & Total Summary */}
                <div className="bg-muted/40 p-4 rounded-2xl space-y-2 text-xs border border-border">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-foreground font-mono">₦{subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vatApplicable}
                        onChange={(e) => setVatApplicable(e.target.checked)}
                        className="rounded text-primary"
                      />
                      <span>Apply 7.5% FIRS VAT</span>
                    </label>
                    <span className="font-mono text-foreground">{vatApplicable ? `+₦${vatAmount.toLocaleString()}` : "₦0"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whtApplicable}
                        onChange={(e) => setWhtApplicable(e.target.checked)}
                        className="rounded text-primary"
                      />
                      <span>Deduct 5% Withholding Tax (WHT)</span>
                    </label>
                    <span className="font-mono text-foreground">{whtApplicable ? `-₦${whtAmount.toLocaleString()}` : "₦0"}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Discount Amount (₦)</label>
                      <input
                        type="number"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Deposit Paid (₦)</label>
                      <input
                        type="number"
                        value={depositPaid}
                        onChange={(e) => setDepositPaid(Number(e.target.value))}
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground font-mono"
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-2 flex justify-between font-bold text-sm text-foreground">
                    <span>Total Invoiced:</span>
                    <span className="font-mono text-emerald-600">₦{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-amber-600">
                    <span>Balance Due:</span>
                    <span className="font-mono">₦{balanceDue.toLocaleString()}</span>
                  </div>
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
                    Generate & View Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRINTABLE OFFICIAL INVOICE VIEW */}
        {viewingInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0">
            <div className="bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 print:p-0 print:shadow-none">
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b pb-6 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-emerald-800 tracking-tight">TIOGA TECHNOLOGIES LTD</h2>
                  <p className="text-xs text-slate-600">Clean Energy, Smart Home & Security Engineering</p>
                  <p className="text-xs text-slate-500">RC: 7382910 • TIN: 23849102-0001</p>
                  <p className="text-xs text-slate-500">12 Commercial Avenue, Ikeja, Lagos, Nigeria</p>
                  <p className="text-xs text-slate-500">sales@tiogatechnologies.com • +234 817 800 0023</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-800 text-white font-mono font-bold text-xs uppercase rounded">
                    {viewingInvoice.invoice_type.replace("_", " ")}
                  </span>
                  <p className="font-mono font-bold text-lg text-emerald-900 mt-1">{viewingInvoice.invoice_no}</p>
                  <p className="text-xs text-slate-600">Issue Date: {viewingInvoice.issue_date}</p>
                  {viewingInvoice.due_date && (
                    <p className="text-xs text-red-600 font-semibold">Due Date: {viewingInvoice.due_date}</p>
                  )}
                </div>
              </div>

              {/* Bill To Info */}
              <div className="grid grid-cols-2 gap-6 mb-6 text-xs bg-slate-50 p-4 rounded-xl border">
                <div>
                  <p className="font-bold text-slate-500 uppercase text-[10px]">Invoiced To:</p>
                  <p className="font-bold text-sm text-slate-800">{viewingInvoice.customer_name}</p>
                  <p className="text-slate-600">{viewingInvoice.customer_phone}</p>
                  <p className="text-slate-600">{viewingInvoice.customer_email || "N/A"}</p>
                  <p className="text-slate-600">{viewingInvoice.customer_address || "Lagos, Nigeria"}</p>
                </div>
                <div className="text-right flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-500 uppercase text-[10px]">Payment Status:</p>
                    <p
                      className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold uppercase mt-1 ${
                        statusColors[viewingInvoice.status]
                      }`}
                    >
                      {viewingInvoice.status.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase">Balance Due:</p>
                    <p className="text-xl font-bold font-mono text-amber-700">
                      ₦{Number(viewingInvoice.balance_due).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs mb-6 border">
                <thead>
                  <tr className="bg-slate-100 border-b">
                    <th className="p-3">#</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price (₦)</th>
                    <th className="p-3 text-right">Total (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingInvoice.items.map((it, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-3">{idx + 1}</td>
                      <td className="p-3 font-semibold">{it.description}</td>
                      <td className="p-3 text-center">{it.quantity}</td>
                      <td className="p-3 text-right font-mono">₦{Number(it.unit_price).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold">₦{Number(it.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Math Breakdown */}
              <div className="flex justify-end mb-6 text-xs">
                <div className="w-72 space-y-1.5 border-t pt-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">₦{Number(viewingInvoice.subtotal).toLocaleString()}</span>
                  </div>
                  {viewingInvoice.vat_applicable && (
                    <div className="flex justify-between text-slate-600">
                      <span>FIRS VAT (7.5%):</span>
                      <span className="font-mono">+₦{Number(viewingInvoice.vat_amount).toLocaleString()}</span>
                    </div>
                  )}
                  {viewingInvoice.wht_applicable && (
                    <div className="flex justify-between text-slate-600">
                      <span>Withholding Tax (5%):</span>
                      <span className="font-mono">-₦{Number(viewingInvoice.wht_amount).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(viewingInvoice.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-mono">-₦{Number(viewingInvoice.discount_amount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 border-t pt-1.5">
                    <span>Total Invoiced:</span>
                    <span className="font-mono">₦{Number(viewingInvoice.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-emerald-700">
                    <span>Deposit / Paid:</span>
                    <span className="font-mono">₦{Number(viewingInvoice.deposit_paid || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-amber-700 border-t pt-1.5">
                    <span>Balance Due:</span>
                    <span className="font-mono">₦{Number(viewingInvoice.balance_due || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Instructions & Bank Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl text-xs border mb-6">
                <div>
                  <p className="font-bold text-slate-700 uppercase text-[10px] mb-1">Corporate Bank Transfer Details:</p>
                  <p className="text-slate-800 font-semibold">Bank Name: Access Bank Plc</p>
                  <p className="text-slate-800 font-semibold">Account Name: Tioga Technologies Ltd</p>
                  <p className="text-slate-800 font-mono font-bold">Account Number: 1829304910</p>
                  <p className="text-slate-500 text-[11px] mt-1">Please use invoice #{viewingInvoice.invoice_no} as transfer narration.</p>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <div className="text-right">
                    <p className="font-bold text-slate-700 uppercase text-[10px]">Verified Document</p>
                    <p className="text-[11px] text-slate-500">Scan QR to verify authenticity</p>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <QrCode size={48} className="text-slate-800" />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900"
                >
                  <Printer size={14} /> Print / Save as PDF
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
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

export default AdminInvoices;
