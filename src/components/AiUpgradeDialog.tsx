import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Zap, ArrowRight, Check } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AiUpgradeDialog = ({ open, onOpenChange }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary inline-flex items-center justify-center mb-2"><Zap size={20} /></div>
        <DialogTitle className="font-display text-xl">You've used your 3 free analyses</DialogTitle>
        <DialogDescription>
          Upgrade to <strong className="text-foreground">AI Starter</strong> for 20 monthly credits and full engineering reports.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 my-2">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold">₦2,500</span>
          <span className="text-sm text-muted-foreground">/month · 20 credits</span>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm">
          <li className="flex items-start gap-2"><Check className="text-primary mt-0.5 shrink-0" size={14} />20 AI assessments per month</li>
          <li className="flex items-start gap-2"><Check className="text-primary mt-0.5 shrink-0" size={14} />Full engineering reports + PDF</li>
          <li className="flex items-start gap-2"><Check className="text-primary mt-0.5 shrink-0" size={14} />Bill of materials and package match</li>
        </ul>
      </div>

      <div className="space-y-2">
        <Link
          to="/ai-pricing"
          onClick={() => onOpenChange(false)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110"
        >
          Subscribe now <ArrowRight size={14} />
        </Link>
        <Link
          to="/ai-pricing"
          onClick={() => onOpenChange(false)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-muted"
        >
          See all plans
        </Link>
      </div>
    </DialogContent>
  </Dialog>
);

export default AiUpgradeDialog;
