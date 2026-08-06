// Serial number capture for an order — recorded at dispatch so returns/RMA can be traced.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Barcode, Plus, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

type Serial = {
  id: string;
  serial: string;
  product_name: string;
  status: string;
  warranty_until: string | null;
  dispatched_at: string;
  notes: string | null;
};

type Props = {
  orderId: string;
  orderEmail: string | null;
  orderUserId?: string | null;
  items: { id: string; product_name: string; quantity: number }[];
};

const OrderSerials = ({ orderId, orderEmail, orderUserId, items }: Props) => {
  const [rows, setRows] = useState<Serial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serial, setSerial] = useState("");
  const [productName, setProductName] = useState(items[0]?.product_name || "");
  const [warrantyMonths, setWarrantyMonths] = useState(12);
  const [notes, setNotes] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("device_serials")
      .select("id, serial, product_name, status, warranty_until, dispatched_at, notes")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    setRows((data || []) as Serial[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [orderId]);

  const add = async () => {
    const value = serial.trim();
    if (!value) { toast.error("Enter a serial number"); return; }
    if (value.length > 80) { toast.error("Serial number is too long"); return; }
    if (!productName.trim()) { toast.error("Choose which product this serial belongs to"); return; }
    setSaving(true);
    const item = items.find((i) => i.product_name === productName);
    const warrantyUntil = new Date();
    warrantyUntil.setMonth(warrantyUntil.getMonth() + (Number(warrantyMonths) || 12));
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("device_serials").insert({
      serial: value,
      product_name: productName.trim(),
      order_id: orderId,
      order_item_id: item?.id ?? null,
      user_id: orderUserId ?? null,
      customer_email: orderEmail,
      warranty_until: warrantyUntil.toISOString().slice(0, 10),
      notes: notes.trim() || null,
      recorded_by: auth.user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("device_serials_serial_unique") ? "That serial number is already recorded" : error.message);
      return;
    }
    toast.success("Serial recorded");
    setSerial("");
    setNotes("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this serial number?")) return;
    const { error } = await supabase.from("device_serials").delete().eq("id", id);
    if (error) { toast.error("Could not remove serial"); return; }
    setRows((p) => p.filter((r) => r.id !== id));
  };

  return (
    <div className="mt-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
        <Barcode size={11} /> Device serial numbers
      </h4>

      {loading ? (
        <Loader2 size={14} className="animate-spin text-muted-foreground" />
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground mb-3">No serials recorded yet. Add them at dispatch so returns can be traced.</p>
      ) : (
        <ul className="space-y-1.5 mb-3">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-background border border-border px-3 py-2 text-xs">
              <span className="font-mono font-semibold text-foreground">{r.serial}</span>
              <span className="text-muted-foreground">{r.product_name}</span>
              <span className="text-muted-foreground">· dispatched {format(new Date(r.dispatched_at), "MMM d, yyyy")}</span>
              {r.warranty_until && <span className="text-primary font-medium">warranty to {format(new Date(r.warranty_until), "MMM yyyy")}</span>}
              <button onClick={() => remove(r.id)} className="ml-auto p-1 rounded hover:bg-destructive/10 text-destructive" title="Remove">
                <Trash2 size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        <input
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          maxLength={80}
          placeholder="Serial number"
          className="rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono"
        />
        <select value={productName} onChange={(e) => setProductName(e.target.value)} className="rounded-lg border border-input bg-background px-2 py-2 text-xs">
          {items.length === 0 && <option value="">No items on this order</option>}
          {items.map((i) => <option key={i.id} value={i.product_name}>{i.product_name}</option>)}
        </select>
        <select value={warrantyMonths} onChange={(e) => setWarrantyMonths(Number(e.target.value))} className="rounded-lg border border-input bg-background px-2 py-2 text-xs">
          {[6, 12, 24, 36, 60].map((m) => <option key={m} value={m}>{m} mo warranty</option>)}
        </select>
        <button onClick={add} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
        </button>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={200}
          placeholder="Optional note (installed location, batch…)"
          className="sm:col-span-4 rounded-lg border border-input bg-background px-3 py-2 text-xs"
        />
      </div>
    </div>
  );
};

export default OrderSerials;
