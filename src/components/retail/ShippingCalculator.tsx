import { useState } from "react";
import { Truck, Clock, ShieldCheck, MapPin, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const REGIONAL_RATES: Record<string, { fee: number; days: string; warehouse: string }> = {
  Lagos: { fee: 0, days: "Same-day or Next-day", warehouse: "Ikeja Central Fulfillment Hub" },
  Abuja: { fee: 0, days: "24–48 Hours", warehouse: "Maitama Regional Hub" },
  Ogun: { fee: 15000, days: "24–48 Hours", warehouse: "Ikeja Central Fulfillment Hub" },
  Oyo: { fee: 20000, days: "2–3 Business Days", warehouse: "Ikeja Central Fulfillment Hub" },
  Rivers: { fee: 35000, days: "3–4 Business Days", warehouse: "Port Harcourt Distribution Center" },
  Plateau: { fee: 25000, days: "2–3 Business Days", warehouse: "Jos Branch Office" },
  Kano: { fee: 35000, days: "3–4 Business Days", warehouse: "Northern Distribution Hub" },
  Enugu: { fee: 30000, days: "3–4 Business Days", warehouse: "Eastern Distribution Hub" },
  Delta: { fee: 30000, days: "3–4 Business Days", warehouse: "Warri Fulfillment Center" },
  Other: { fee: 40000, days: "3–5 Business Days", warehouse: "Nationwide Heavy Freight Logistics" },
};

const STATES = [
  "Lagos", "Abuja", "Ogun", "Oyo", "Rivers", "Plateau", "Kano", "Enugu", "Delta",
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Ebonyi", "Edo", "Ekiti", "Gombe", "Imo", "Jigawa", "Kaduna",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Nasarawa", "Niger", "Ondo", "Osun",
  "Sokoto", "Taraba", "Yobe", "Zamfara"
];

export const ShippingCalculator = () => {
  const [selectedState, setSelectedState] = useState("Lagos");

  const rate = REGIONAL_RATES[selectedState] || REGIONAL_RATES.Other;

  return (
    <div className="p-5 rounded-2xl border border-border bg-muted/20 space-y-4 my-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
          <Truck size={16} className="text-primary" />
          <span>Delivery & Dispatch Estimator</span>
        </div>
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
          <CheckCircle2 size={13} />
          Insured Transit
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1 font-medium">Select Destination State</label>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-full bg-card rounded-xl text-xs">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="max-h-56 bg-card border-border">
              {STATES.map((st) => (
                <SelectItem key={st} value={st} className="text-xs">
                  {st} {st === "Lagos" || st === "Abuja" ? "(FREE)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border/80 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Shipping Fee:</span>
            <span className="font-mono font-bold text-foreground">
              {rate.fee === 0 ? <strong className="text-emerald-500 uppercase">FREE</strong> : `₦${rate.fee.toLocaleString()}`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estimated Delivery:</span>
            <span className="font-semibold text-foreground flex items-center gap-1">
              <Clock size={11} className="text-gold" />
              {rate.days}
            </span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <MapPin size={13} className="text-primary shrink-0" />
        <span>Dispatched from <strong>{rate.warehouse}</strong> with live SMS tracking.</span>
      </p>
    </div>
  );
};
