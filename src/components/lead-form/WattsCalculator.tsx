import { useState } from "react";
import { Plus, Minus, X, Search, Zap, AlertTriangle } from "lucide-react";
import { applianceDatabase, findApplianceWatts, estimateWatts, calculateTotalWatts, recommendedInverterSize, type ApplianceInfo, type SelectedAppliance } from "@/data/applianceWatts";
import { StepUI, inputClass } from "./StepUI";

interface WattsCalculatorProps {
  selectedAppliances: SelectedAppliance[];
  onChange: (appliances: SelectedAppliance[]) => void;
  budget?: string;
}

const popularAppliances = [
  "LED Bulb", "Ceiling Fan", "Standing Fan", "TV (43\")", "Laptop",
  "Fridge (Single Door)", "Deep Freezer (Small)", "1HP AC", "Water Pump",
  "Washing Machine", "Microwave", "DSTV/Decoder", "WiFi Router", "Phone Charger"
];

const WattsCalculator = ({ selectedAppliances, onChange, budget }: WattsCalculatorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const addAppliance = (info: ApplianceInfo) => {
    const existing = selectedAppliances.find(a => a.name === info.name);
    if (existing) {
      onChange(selectedAppliances.map(a => a.name === info.name ? { ...a, quantity: a.quantity + 1 } : a));
    } else {
      onChange([...selectedAppliances, { name: info.name, quantity: 1, info }]);
    }
    setSearchQuery("");
  };

  const updateQuantity = (name: string, delta: number) => {
    onChange(
      selectedAppliances
        .map(a => a.name === name ? { ...a, quantity: Math.max(0, a.quantity + delta) } : a)
        .filter(a => a.quantity > 0)
    );
  };

  const removeAppliance = (name: string) => {
    onChange(selectedAppliances.filter(a => a.name !== name));
  };

  const handleCustomAppliance = () => {
    if (!searchQuery.trim()) return;
    const found = findApplianceWatts(searchQuery);
    if (found) {
      addAppliance(found);
    } else {
      const est = estimateWatts(searchQuery.trim());
      addAppliance(est);
    }
  };

  const totals = calculateTotalWatts(selectedAppliances);
  const recommended = recommendedInverterSize(totals.avg);

  const searchResults = searchQuery.trim()
    ? applianceDatabase.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const popularItems = popularAppliances
    .map(name => applianceDatabase.find(a => a.name === name)!)
    .filter(Boolean);

  const displayItems = showAll ? applianceDatabase : popularItems;

  return (
    <StepUI title="What appliances do you want to power?" subtitle="Add items and quantities and we will calculate the watts">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className={`${inputClass} pl-9 pr-20`}
          placeholder="Type any appliance (e.g. deep freezer, AC)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCustomAppliance()}
        />
        {searchQuery && (
          <button
            onClick={handleCustomAppliance}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-lg font-medium"
          >
            Add
          </button>
        )}
      </div>

      {/* Search dropdown */}
      {searchResults.length > 0 && (
        <div className="border border-border rounded-xl bg-card shadow-lg max-h-40 overflow-y-auto">
          {searchResults.slice(0, 8).map((a) => (
            <button
              key={a.name}
              onClick={() => addAppliance(a)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between transition-colors"
            >
              <span>{a.icon} {a.name}</span>
              <span className="text-xs text-muted-foreground">{a.minWatts} to {a.maxWatts}W</span>
            </button>
          ))}
        </div>
      )}

      {/* Quick-add grid */}
      <div className="flex flex-wrap gap-1.5">
        {displayItems.map((a) => {
          const selected = selectedAppliances.find(s => s.name === a.name);
          return (
            <button
              key={a.name}
              onClick={() => addAppliance(a)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                selected
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-foreground hover:border-primary/30"
              }`}
            >
              {a.icon} {a.name} {selected ? `x${selected.quantity}` : ""}
            </button>
          );
        })}
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-dashed border-primary/40 text-primary font-medium"
        >
          {showAll ? "Show less" : `+${applianceDatabase.length - popularItems.length} more`}
        </button>
      </div>

      {/* Selected appliances with quantities */}
      {selectedAppliances.length > 0 && (
        <div className="space-y-2 mt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your appliances</p>
          <div className="space-y-1.5">
            {selectedAppliances.map((a) => (
              <div
                key={a.name}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2"
              >
                <span className="text-sm flex-1">
                  {a.info.icon} {a.name}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({a.info.minWatts} to {a.info.maxWatts}W each)
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(a.name, -1)}
                    className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-bold w-6 text-center">{a.quantity}</span>
                  <button
                    onClick={() => updateQuantity(a.name, 1)}
                    className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={() => removeAppliance(a.name)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watts summary */}
      {selectedAppliances.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <span className="text-sm font-bold text-primary">Power Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Estimated range:</span>
              <p className="font-bold text-foreground">{totals.min.toLocaleString()}W to {totals.max.toLocaleString()}W</p>
            </div>
            <div>
              <span className="text-muted-foreground">Recommended inverter:</span>
              <p className="font-bold text-primary">{recommended}</p>
            </div>
          </div>
          {budget && (
            <BudgetWarning totalAvgWatts={totals.avg} budget={budget} />
          )}
        </div>
      )}
    </StepUI>
  );
};

function BudgetWarning({ totalAvgWatts, budget }: { totalAvgWatts: number; budget: string }) {
  const estimatedMinPrice = getMinPriceForWatts(totalAvgWatts);
  const budgetMax = getBudgetMaxNum(budget);

  if (budgetMax && estimatedMinPrice > budgetMax) {
    return (
      <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-2 mt-1">
        <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
        <p className="text-xs text-destructive">
          Your appliances need about a {recommendedInverterSize(totalAvgWatts)} system (starting from ₦{(estimatedMinPrice / 1000000).toFixed(1)}M), which may exceed your budget of {budget}. Consider reducing appliances or increasing your budget.
        </p>
      </div>
    );
  }
  return null;
}

function getMinPriceForWatts(avgWatts: number): number {
  if (avgWatts <= 1000) return 1125200;
  if (avgWatts <= 1500) return 1519500;
  if (avgWatts <= 2500) return 2216000;
  if (avgWatts <= 3500) return 4024000;
  if (avgWatts <= 5000) return 4775940;
  if (avgWatts <= 7500) return 7253000;
  if (avgWatts <= 10000) return 10828800;
  if (avgWatts <= 20000) return 20808000;
  return 40508800;
}

function getBudgetMaxNum(budget: string): number | null {
  switch (budget) {
    case "Below ₦500k": return 500000;
    case "₦500k to ₦1M": return 1000000;
    case "₦1M to ₦3M": return 3000000;
    case "₦3M+": return null;
    default: return null;
  }
}

export default WattsCalculator;
