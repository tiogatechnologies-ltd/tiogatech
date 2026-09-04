import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const REASONS = [
  { value: "faulty", label: "Device is faulty" },
  { value: "damaged_on_arrival", label: "Damaged on arrival" },
  { value: "not_as_described", label: "Not as described" },
  { value: "performance", label: "Under-performing" },
  { value: "other", label: "Other" },
];

type Serial = {
  id: string;
  serial: string;
  product_name: string;
  order_id: string | null;
  warranty_until: string | null;
};

const WarrantyClaimDialog = ({
  serial,
  open,
  onOpenChange,
  customer,
  onCreated,
}: {
  serial: Serial | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer: { id: string; email: string; name?: string | null; phone?: string | null };
  onCreated?: () => void;
}) => {
  const [reason, setReason] = useState("faulty");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState(customer.phone || "");
  const [name, setName] = useState(customer.name || "");
  const [saving, setSaving] = useState(false);

  const inWarranty = !serial?.warranty_until || new Date(serial.warranty_until) >= new Date();

  const submit = async () => {
    if (!serial) return;
    if (description.trim().length < 10) return toast.error("Please describe the issue in a little more detail");
    if (!name.trim()) return toast.error("Please enter your name");
    setSaving(true);
    const { data, error } = await supabase
      .from("warranty_claims" as any)
      .insert({
        serial_id: serial.id,
        serial: serial.serial,
        order_id: serial.order_id,
        product_name: serial.product_name,
        user_id: customer.id,
        customer_name: name.trim(),
        customer_email: customer.email,
        customer_phone: phone.trim() || null,
        reason,
        description: description.trim(),
        in_warranty: inWarranty,
        status: "submitted",
      })
      .select("rma_number")
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Claim ${(data as any)?.rma_number || ""} submitted - our team will be in touch.`);
    setDescription("");
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise a warranty claim</DialogTitle>
        </DialogHeader>

        {serial && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm">
              <p className="font-semibold text-foreground">{serial.product_name}</p>
              <p className="text-xs text-muted-foreground">Serial {serial.serial}</p>
              <p className={`mt-1 text-xs font-semibold ${inWarranty ? "text-emerald-600" : "text-destructive"}`}>
                {inWarranty
                  ? serial.warranty_until
                    ? `In warranty until ${new Date(serial.warranty_until).toLocaleDateString("en-NG")}`
                    : "In warranty"
                  : "Warranty expired - the claim can still be reviewed, repairs may be chargeable"}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Your name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            </div>

            <div>
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>What is wrong?</Label>
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the fault, when it started and anything you have already tried." />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 size={14} className="mr-1.5 animate-spin" />} Submit claim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WarrantyClaimDialog;
