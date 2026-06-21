import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assessmentId?: string;
  defaults?: { full_name?: string; email?: string; phone?: string; location?: string };
}

export const CustomSolutionDialog = ({ open, onOpenChange, assessmentId, defaults }: Props) => {
  const [form, setForm] = useState({
    full_name: defaults?.full_name || "",
    email: defaults?.email || "",
    phone: defaults?.phone || "",
    location: defaults?.location || "",
    requirements: "",
  });
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.phone || !form.requirements) {
      return toast.error("Please complete all required fields");
    }
    setLoading(true);
    const { error } = await (supabase.from("custom_solution_requests" as any).insert({
      assessment_id: assessmentId || null,
      full_name: form.full_name.slice(0, 120),
      email: form.email.slice(0, 160),
      phone: form.phone.slice(0, 32),
      location: form.location.slice(0, 200),
      requirements: form.requirements.slice(0, 4000),
      status: "new",
    }) as any);
    if (!error) {
      try {
        await supabase.functions.invoke("notify-new-lead", {
          body: {
            source: "custom_solution_request",
            assessment_id: assessmentId || null,
            full_name: form.full_name,
            email: form.email,
            phone: form.phone,
            location: form.location,
            summary: form.requirements.slice(0, 200),
          },
        });
      } catch {/* non-fatal */}
    }
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Request sent. Our engineering team will reach out shortly.");
    onOpenChange(false);
    setForm({ ...form, requirements: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Sparkles size={18} className="text-primary" /> Request a Custom Solar Solution
          </DialogTitle>
          <DialogDescription>
            Tell us about your project and our engineers will design a tailored proposal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Full name *</Label>
              <Input value={form.full_name} onChange={update("full_name")} required maxLength={120} />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input value={form.phone} onChange={update("phone")} required maxLength={32} />
            </div>
          </div>
          <div>
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={update("email")} required maxLength={160} />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={form.location} onChange={update("location")} maxLength={200} placeholder="City, State" />
          </div>
          <div>
            <Label>Project requirements *</Label>
            <Textarea
              value={form.requirements}
              onChange={update("requirements")}
              rows={5}
              required
              maxLength={4000}
              placeholder="Describe your site, expected loads, special equipment, budget range, timeline..."
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Send to engineering team
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomSolutionDialog;
