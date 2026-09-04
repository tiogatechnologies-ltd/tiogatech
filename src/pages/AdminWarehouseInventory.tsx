import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Building2,
  Package,
  QrCode,
  ArrowRightLeft,
  Plus,
  Search,
  Truck,
  Printer,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Trash2,
  Edit,
  X,
  Loader2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useSiteContact } from "@/hooks/useSiteContact";

const db = supabase as any;

interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string;
  manager_name: string | null;
  phone: string | null;
  is_active: boolean;
}

interface InventoryItem {
  id: string;
  product_id: string | null;
  product_name: string;
  warehouse_id: string;
  quantity_on_hand: number;
  quantity_allocated: number;
  reorder_point: number;
  unit_cost: number;
}

interface SerialNumber {
  id: string;
  serial_no: string;
  product_name: string;
  warehouse_id: string | null;
  status: "in_stock" | "allocated" | "installed" | "rma_defective" | "returned";
  installed_customer_name: string | null;
  installed_customer_phone: string | null;
  work_order_no: string | null;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  notes: string | null;
  created_at: string;
}

interface StockTransfer {
  id: string;
  transfer_no: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  status: "pending" | "in_transit" | "received" | "cancelled";
  items: Array<{ product_name: string; quantity: number; serials?: string[] }>;
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_no: string | null;
  waybill_notes: string | null;
  dispatched_at: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  in_stock: "bg-green-100 text-green-800 border-green-200",
  allocated: "bg-blue-100 text-blue-800 border-blue-200",
  installed: "bg-purple-100 text-purple-800 border-purple-200",
  rma_defective: "bg-red-100 text-red-800 border-red-200",
  returned: "bg-gray-100 text-gray-800 border-gray-200",
};

const transferStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_transit: "bg-blue-100 text-blue-800",
  received: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminWarehouseInventory = () => {
  const { contact } = useSiteContact();
  const [activeTab, setActiveTab] = useState<"inventory" | "serials" | "transfers">("inventory");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [serials, setSerials] = useState<SerialNumber[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [serialStatusFilter, setSerialStatusFilter] = useState<string>("all");

  // Modals
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showAddSerialModal, setShowAddSerialModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [viewingWaybill, setViewingWaybill] = useState<StockTransfer | null>(null);

  // Form states
  const [newProductName, setNewProductName] = useState("");
  const [newWarehouseId, setNewWarehouseId] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [newReorderPoint, setNewReorderPoint] = useState(5);
  const [newUnitCost, setNewUnitCost] = useState(0);

  const [newSerialNo, setNewSerialNo] = useState("");
  const [newSerialProduct, setNewSerialProduct] = useState("");
  const [newSerialWarehouse, setNewSerialWarehouse] = useState("");

  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferItemName, setTransferItemName] = useState("");
  const [transferQty, setTransferQty] = useState(1);
  const [transferDriver, setTransferDriver] = useState("");
  const [transferVehicle, setTransferVehicle] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wRes, iRes, sRes, tRes] = await Promise.all([
        db.from("warehouses").select("*").order("name"),
        db.from("inventory_items").select("*").order("created_at", { ascending: false }),
        db.from("serial_numbers").select("*").order("created_at", { ascending: false }),
        db.from("stock_transfers").select("*").order("created_at", { ascending: false }),
      ]);

      if (wRes.data) setWarehouses(wRes.data as Warehouse[]);
      if (iRes.data) setInventory(iRes.data as InventoryItem[]);
      if (sRes.data) setSerials(sRes.data as SerialNumber[]);
      if (tRes.data) setTransfers(tRes.data as StockTransfer[]);
    } catch (err: any) {
      console.error("Error loading warehouse data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newWarehouseId) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const { error } = await db.from("inventory_items").insert({
        product_name: newProductName.trim(),
        warehouse_id: newWarehouseId,
        quantity_on_hand: Number(newQuantity),
        reorder_point: Number(newReorderPoint),
        unit_cost: Number(newUnitCost),
      });
      if (error) throw error;
      toast.success("Stock item recorded successfully");
      setShowAddStockModal(false);
      setNewProductName("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add stock");
    }
  };

  const handleAddSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSerialNo.trim() || !newSerialProduct.trim()) {
      toast.error("Please enter both serial number and product name");
      return;
    }
    try {
      const { error } = await db.from("serial_numbers").insert({
        serial_no: newSerialNo.trim().toUpperCase(),
        product_name: newSerialProduct.trim(),
        warehouse_id: newSerialWarehouse || null,
        status: "in_stock",
      });
      if (error) throw error;
      toast.success("Component serial number registered");
      setShowAddSerialModal(false);
      setNewSerialNo("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to register serial");
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFrom || !transferTo || !transferItemName) {
      toast.error("Please complete all transfer details");
      return;
    }
    if (transferFrom === transferTo) {
      toast.error("Source and destination warehouses cannot be the same");
      return;
    }
    try {
      const transferNo = `WAY-${new Date().toISOString().slice(2, 7).replace("-", "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data, error } = await db.from("stock_transfers").insert({
        transfer_no: transferNo,
        from_warehouse_id: transferFrom,
        to_warehouse_id: transferTo,
        status: "in_transit",
        items: [{ product_name: transferItemName, quantity: Number(transferQty) }],
        driver_name: transferDriver.trim() || null,
        vehicle_no: transferVehicle.trim() || null,
        waybill_notes: transferNotes.trim() || null,
        dispatched_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;
      toast.success(`Waybill ${transferNo} created and dispatched!`);
      setShowTransferModal(false);
      fetchData();
      if (data) setViewingWaybill(data as StockTransfer);
    } catch (err: any) {
      toast.error(err.message || "Failed to create transfer");
    }
  };

  const handleUpdateTransferStatus = async (id: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "received") updates.received_at = new Date().toISOString();
      const { error } = await db.from("stock_transfers").update(updates).eq("id", id);
      if (error) throw error;
      toast.success(`Transfer status updated to ${newStatus}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getWarehouseName = (id?: string | null) => {
    if (!id) return "Unassigned";
    const found = warehouses.find((w) => w.id === id);
    return found ? found.name : "Unknown Hub";
  };

  // Filtered lists
  const filteredInventory = inventory.filter((item) => {
    const matchesWh = selectedWarehouse === "all" || item.warehouse_id === selectedWarehouse;
    const matchesSearch = !search || item.product_name.toLowerCase().includes(search.toLowerCase());
    return matchesWh && matchesSearch;
  });

  const filteredSerials = serials.filter((s) => {
    const matchesWh = selectedWarehouse === "all" || s.warehouse_id === selectedWarehouse;
    const matchesStatus = serialStatusFilter === "all" || s.status === serialStatusFilter;
    const matchesSearch =
      !search ||
      s.serial_no.toLowerCase().includes(search.toLowerCase()) ||
      s.product_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.installed_customer_name && s.installed_customer_name.toLowerCase().includes(search.toLowerCase()));
    return matchesWh && matchesStatus && matchesSearch;
  });

  const lowStockCount = inventory.filter((i) => i.quantity_on_hand <= i.reorder_point).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Building2 className="text-primary" size={24} />
              Multi-Warehouse & Serial Tracking (ERP)
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage stock levels, serial numbers, inter-hub movements, and dispatch waybills.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddStockModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 shadow-sm transition-all"
            >
              <Plus size={15} /> Add Stock Item
            </button>
            <button
              onClick={() => setShowAddSerialModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-muted/50 px-4 py-2.5 text-xs font-semibold text-foreground transition-all"
            >
              <QrCode size={15} /> Register Serial #
            </button>
            <button
              onClick={() => setShowTransferModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-muted/50 px-4 py-2.5 text-xs font-semibold text-foreground transition-all"
            >
              <ArrowRightLeft size={15} /> Create Waybill / Transfer
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase">Active Hubs</span>
              <Building2 size={16} />
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{warehouses.length}</p>
            <p className="text-[11px] text-muted-foreground">Lagos, Abuja & Van Fleets</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase">Total Stock Items</span>
              <Package size={16} />
            </div>
            <p className="text-2xl font-bold font-display text-foreground">
              {inventory.reduce((acc, i) => acc + (i.quantity_on_hand || 0), 0)} units
            </p>
            <p className="text-[11px] text-muted-foreground">Across all warehouses</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase">Tracked Serials</span>
              <QrCode size={16} />
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{serials.length}</p>
            <p className="text-[11px] text-muted-foreground">{serials.filter((s) => s.status === "in_stock").length} In Stock</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-amber-600 mb-1">
              <span className="text-xs font-semibold uppercase">Low Stock Alerts</span>
              <AlertTriangle size={16} />
            </div>
            <p className="text-2xl font-bold font-display text-amber-600">{lowStockCount}</p>
            <p className="text-[11px] text-muted-foreground">Below reorder point</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "inventory"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package size={16} /> Stock Levels by Warehouse
          </button>
          <button
            onClick={() => setActiveTab("serials")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "serials"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <QrCode size={16} /> Serial Number Registry ({serials.length})
          </button>
          <button
            onClick={() => setActiveTab("transfers")}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "transfers"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Truck size={16} /> Transfers & Waybills ({transfers.length})
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, serial #, customer..."
              className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Warehouses & Vans</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            {activeTab === "serials" && (
              <select
                value={serialStatusFilter}
                onChange={(e) => setSerialStatusFilter(e.target.value)}
                className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All Serial Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="allocated">Allocated to Job</option>
                <option value="installed">Installed at Client</option>
                <option value="rma_defective">RMA Defective</option>
                <option value="returned">Returned</option>
              </select>
            )}
          </div>
        </div>

        {/* TAB 1: INVENTORY ITEMS */}
        {activeTab === "inventory" && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">Product Name</th>
                    <th className="text-left px-4 py-3 font-semibold">Warehouse / Location</th>
                    <th className="text-right px-4 py-3 font-semibold">On Hand</th>
                    <th className="text-right px-4 py-3 font-semibold">Allocated</th>
                    <th className="text-right px-4 py-3 font-semibold">Available</th>
                    <th className="text-right px-4 py-3 font-semibold">Reorder Point</th>
                    <th className="text-right px-4 py-3 font-semibold">Unit Cost</th>
                    <th className="text-center px-4 py-3 font-semibold">Stock Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => {
                    const available = (item.quantity_on_hand || 0) - (item.quantity_allocated || 0);
                    const isLow = (item.quantity_on_hand || 0) <= (item.reorder_point || 0);
                    return (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{item.product_name}</td>
                        <td className="px-4 py-3 text-muted-foreground flex items-center gap-1.5">
                          <Building2 size={13} className="text-primary/70" />
                          {getWarehouseName(item.warehouse_id)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">{item.quantity_on_hand}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{item.quantity_allocated || 0}</td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">{available}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{item.reorder_point}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                          {item.unit_cost ? `₦${Number(item.unit_cost).toLocaleString()}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-semibold">
                              <AlertTriangle size={11} /> Reorder
                            </span>
                          ) : (
                            <span className="rounded-full bg-green-100 text-green-800 px-2.5 py-0.5 text-xs font-semibold">
                              Optimal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInventory.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        No inventory records found for this location. Click "Add Stock Item" above to add products.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SERIAL NUMBER REGISTRY */}
        {activeTab === "serials" && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-muted/20">
                    <th className="text-left px-4 py-3 font-semibold">Serial Number</th>
                    <th className="text-left px-4 py-3 font-semibold">Product Description</th>
                    <th className="text-left px-4 py-3 font-semibold">Current Hub</th>
                    <th className="text-center px-4 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 font-semibold">Installed Client / Work Order</th>
                    <th className="text-left px-4 py-3 font-semibold">Warranty Period</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSerials.map((s) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">{s.serial_no}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{s.product_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{getWarehouseName(s.warehouse_id)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                            statusColors[s.status] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {s.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {s.installed_customer_name ? (
                          <div>
                            <p className="font-semibold text-xs">{s.installed_customer_name}</p>
                            {s.work_order_no && <p className="text-[11px] text-primary">{s.work_order_no}</p>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {s.warranty_end_date ? (
                          <span>Until {new Date(s.warranty_end_date).toLocaleDateString()}</span>
                        ) : (
                          "Standard 5-Year OEM"
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredSerials.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        No serial numbers registered yet. Click "Register Serial #" to track individual components.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TRANSFERS & WAYBILLS */}
        {activeTab === "transfers" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground bg-muted/20">
                      <th className="text-left px-4 py-3 font-semibold">Waybill #</th>
                      <th className="text-left px-4 py-3 font-semibold">From Hub</th>
                      <th className="text-left px-4 py-3 font-semibold">To Hub</th>
                      <th className="text-left px-4 py-3 font-semibold">Items Dispatched</th>
                      <th className="text-left px-4 py-3 font-semibold">Driver / Vehicle</th>
                      <th className="text-center px-4 py-3 font-semibold">Status</th>
                      <th className="text-right px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((t) => (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-foreground">{t.transfer_no}</td>
                        <td className="px-4 py-3 text-foreground">{getWarehouseName(t.from_warehouse_id)}</td>
                        <td className="px-4 py-3 text-foreground font-semibold">{getWarehouseName(t.to_warehouse_id)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {t.items.map((i, idx) => (
                            <span key={idx}>
                              {i.product_name} (x{i.quantity})
                            </span>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {t.driver_name ? `${t.driver_name} (${t.vehicle_no || "N/A"})` : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              transferStatusColors[t.status] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {t.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingWaybill(t)}
                              className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground"
                              title="Print Waybill"
                            >
                              <Printer size={13} /> Waybill
                            </button>
                            {t.status === "in_transit" && (
                              <button
                                onClick={() => handleUpdateTransferStatus(t.id, "received")}
                                className="p-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
                                title="Mark as Received"
                              >
                                Receive
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {transfers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                          No stock transfers recorded. Click "Create Waybill / Transfer" above to dispatch items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD STOCK */}
        {showAddStockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <Package size={18} className="text-primary" /> Add Stock Item
                </h3>
                <button onClick={() => setShowAddStockModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddStock} className="p-6 space-y-4 text-sm">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Product Name *</label>
                  <input
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="e.g. 5kVA Hybrid Solar Inverter (48V)"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Target Warehouse *</label>
                  <select
                    required
                    value={newWarehouseId}
                    onChange={(e) => setNewWarehouseId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select Warehouse / Van</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Initial Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Reorder Point</label>
                    <input
                      type="number"
                      min={1}
                      value={newReorderPoint}
                      onChange={(e) => setNewReorderPoint(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Landed Unit Cost (₦)</label>
                  <input
                    type="number"
                    value={newUnitCost}
                    onChange={(e) => setNewUnitCost(Number(e.target.value))}
                    placeholder="e.g. 1250000"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStockModal(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                  >
                    Save Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: REGISTER SERIAL */}
        {showAddSerialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <QrCode size={18} className="text-primary" /> Register Component Serial
                </h3>
                <button onClick={() => setShowAddSerialModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddSerial} className="p-6 space-y-4 text-sm">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Serial Number / Barcode *</label>
                  <input
                    required
                    value={newSerialNo}
                    onChange={(e) => setNewSerialNo(e.target.value)}
                    placeholder="e.g. TIO-INV-5KVA-20260814-001"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm font-mono text-foreground focus:ring-2 focus:ring-primary/30 uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Product Description *</label>
                  <input
                    required
                    value={newSerialProduct}
                    onChange={(e) => setNewSerialProduct(e.target.value)}
                    placeholder="e.g. 10kWh Wall-Mount Lithium Battery (LiFePO4)"
                    className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Initial Location</label>
                  <select
                    value={newSerialWarehouse}
                    onChange={(e) => setNewSerialWarehouse(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSerialModal(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                  >
                    Register Serial
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATE TRANSFER / WAYBILL */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-card rounded-3xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <h3 className="font-display font-bold text-foreground text-lg flex items-center gap-2">
                  <Truck size={18} className="text-primary" /> Create Stock Transfer & Waybill
                </h3>
                <button onClick={() => setShowTransferModal(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateTransfer} className="p-6 space-y-3.5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Dispatch From (Origin) *</label>
                    <select
                      required
                      value={transferFrom}
                      onChange={(e) => setTransferFrom(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    >
                      <option value="">Select Origin</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Deliver To (Destination) *</label>
                    <select
                      required
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    >
                      <option value="">Select Destination</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Item to Transfer *</label>
                    <input
                      required
                      value={transferItemName}
                      onChange={(e) => setTransferItemName(e.target.value)}
                      placeholder="e.g. 5kVA Solar Inverter"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={transferQty}
                      onChange={(e) => setTransferQty(Number(e.target.value))}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Driver / Technician Name</label>
                    <input
                      value={transferDriver}
                      onChange={(e) => setTransferDriver(e.target.value)}
                      placeholder="e.g. Sunday Okon"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Vehicle Plate #</label>
                    <input
                      value={transferVehicle}
                      onChange={(e) => setTransferVehicle(e.target.value)}
                      placeholder="e.g. LAG-402-AB"
                      className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Waybill Notes / Special Instructions</label>
                  <textarea
                    rows={2}
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    placeholder="Fragile solar equipment, handle with care..."
                    className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-foreground"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                  >
                    Dispatch & Print Waybill
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRINTABLE WAYBILL VIEW */}
        {viewingWaybill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0">
            <div className="bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 print:p-0 print:shadow-none">
              <div className="flex justify-between items-start border-b pb-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-emerald-800">TIOGA TECHNOLOGIES LTD</h2>
                  <p className="text-xs text-slate-600">Solar, Smart Home & Security Solutions</p>
                  <p className="text-xs text-slate-500">{contact.address}</p>
                  <p className="text-xs text-slate-500">www.tiogatechnologies.com • {contact.phone}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-100 font-mono font-bold text-sm rounded">
                    OFFICIAL WAYBILL
                  </span>
                  <p className="font-mono font-bold text-emerald-800 mt-1">{viewingWaybill.transfer_no}</p>
                  <p className="text-xs text-slate-500">
                    Date: {new Date(viewingWaybill.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6 text-xs bg-slate-50 p-4 rounded-xl">
                <div>
                  <p className="font-bold text-slate-700 uppercase">Dispatch Origin:</p>
                  <p className="font-semibold text-sm">{getWarehouseName(viewingWaybill.from_warehouse_id)}</p>
                  <p className="text-slate-600 mt-2">Driver: {viewingWaybill.driver_name || "Company Fleet"}</p>
                  <p className="text-slate-600">Vehicle: {viewingWaybill.vehicle_no || "N/A"}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700 uppercase">Destination:</p>
                  <p className="font-semibold text-sm">{getWarehouseName(viewingWaybill.to_warehouse_id)}</p>
                  <p className="text-slate-600 mt-2">Status: {viewingWaybill.status.toUpperCase()}</p>
                </div>
              </div>

              <table className="w-full text-left text-xs mb-6 border">
                <thead>
                  <tr className="bg-slate-100 border-b">
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingWaybill.items.map((it, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2.5">{idx + 1}</td>
                      <td className="p-2.5 font-semibold">{it.product_name}</td>
                      <td className="p-2.5 text-right font-bold">{it.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {viewingWaybill.waybill_notes && (
                <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-900 mb-6">
                  <strong>Notes:</strong> {viewingWaybill.waybill_notes}
                </div>
              )}

              <div className="grid grid-cols-2 gap-8 pt-8 border-t text-xs">
                <div>
                  <p className="text-slate-500 mb-6">Dispatched By (Sign & Date):</p>
                  <div className="border-b border-slate-400 w-48" />
                </div>
                <div>
                  <p className="text-slate-500 mb-6">Received By (Sign & Date):</p>
                  <div className="border-b border-slate-400 w-48" />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-2 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold hover:bg-emerald-900"
                >
                  <Printer size={14} /> Print Waybill
                </button>
                <button
                  onClick={() => setViewingWaybill(null)}
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

export default AdminWarehouseInventory;
