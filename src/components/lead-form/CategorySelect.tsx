import { Sun, Home, ShieldCheck } from "lucide-react";
import type { FlowCategory } from "./types";

interface Props {
  onSelect: (cat: FlowCategory) => void;
}

const categories = [
  { value: "solar" as FlowCategory, label: "Solar Projects", icon: Sun, desc: "Inverters, panels, batteries & full installations" },
  { value: "automation" as FlowCategory, label: "Home Automation", icon: Home, desc: "Smart switches, lighting & whole-home control" },
  { value: "security" as FlowCategory, label: "Security", icon: ShieldCheck, desc: "Smart locks, CCTV & access control" },
];

const CategorySelect = ({ onSelect }: Props) => (
  <div className="space-y-5">
    <h3 className="text-xl font-display font-bold text-card-foreground">What solution are you looking for?</h3>
    <div className="space-y-3">
      {categories.map((c) => (
        <button
          key={c.value}
          onClick={() => onSelect(c.value)}
          className="w-full flex items-center gap-4 rounded-xl border-2 border-border px-5 py-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 group"
        >
          <c.icon size={28} className="text-primary shrink-0 transition-transform duration-300 group-hover:scale-110" />
          <div>
            <span className="font-display font-bold text-card-foreground text-base">{c.label}</span>
            <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
          </div>
        </button>
      ))}
    </div>
  </div>
);

export default CategorySelect;
