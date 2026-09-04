import { ShieldCheck } from "lucide-react";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  amountLabel?: string;
}

const DirectDebitConsent = ({ checked, onChange, amountLabel }: Props) => (
  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
    <div className="flex items-center gap-2">
      <ShieldCheck size={16} className="text-primary" />
      <p className="text-sm font-semibold text-foreground">Direct-debit authorization</p>
    </div>
    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
      <li>Your card is securely stored by Paystack (PCI-DSS compliant). Tioga never sees your card details.</li>
      <li>Each auto-charge will be for the installment amount shown{amountLabel ? ` (${amountLabel})` : ""}.</li>
      <li>We'll email you a reminder 24 hours before every charge.</li>
      <li>If your card doesn't support silent charging, we'll automatically send you a manual payment link instead - no failed retries.</li>
      <li>You can cancel future auto-charges any time by emailing <a className="underline" href="mailto:tiogatechnologies@gmail.com">tiogatechnologies@gmail.com</a>. Cancelling auto-debit does not cancel your underlying payment obligation.</li>
    </ul>
    <label className="flex items-start gap-2 text-xs sm:text-sm text-foreground pt-1">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5" />
      <span>I authorize Tioga Technologies to auto-debit my card for each installment on the due date under the terms above.</span>
    </label>
  </div>
);

export default DirectDebitConsent;
