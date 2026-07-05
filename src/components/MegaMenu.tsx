import { Link } from "react-router-dom";
import { Package, Store, Lock, Camera, Lightbulb, Zap, Sun, BatteryCharging, ArrowRight, Home, Cpu, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

const productHubs = [
  {
    name: "Packages",
    tag: "Curated bundles",
    desc: "Pre-configured solar, smart and security combos. Installable next week.",
    to: "/packages",
    icon: Package,
  },
  {
    name: "Retail",
    tag: "Coming soon",
    desc: "Our online retail store is launching soon. Browse packages in the meantime.",
    to: "/coming-soon",
    icon: Store,
  },
  {
    name: "Energy Calculator",
    tag: "Size your system",
    desc: "Free Nigerian solar calculator — get the exact panel, inverter and battery you need.",
    to: "/energy-calculator",
    icon: Calculator,
  },
  {
    name: "VoltAi",
    tag: "Smart automation",
    desc: "Smart locks, lighting and CCTV unified in one intelligent home system.",
    to: "/voltai",
    icon: Cpu,
  },
];

const categories = [
  { label: "Smart Locks", to: "/packages#smart-locks", icon: Lock },
  { label: "CCTV", to: "/packages#categories", icon: Camera },
  { label: "Smart Lights", to: "/packages#categories", icon: Lightbulb },
  { label: "Solar Inverters", to: "/packages#solar-packages", icon: Zap },
  { label: "Solar Panels", to: "/packages#solar-packages", icon: Sun },
  { label: "Batteries", to: "/packages#solar-packages", icon: BatteryCharging },
];

interface MegaMenuProps {
  onDark: boolean;
  open: boolean;
  onClose: () => void;
}

export const MegaMenu = ({ onDark, open, onClose }: MegaMenuProps) => {
  return (
    <div
      role="menu"
      aria-hidden={!open}
      onClick={onClose}
      className={cn(
        "absolute left-1/2 top-full z-50 mt-3 w-[min(780px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border p-5 shadow-2xl backdrop-blur-xl transition-all duration-200 ease-out",
        open
          ? "opacity-100 visible translate-y-0 pointer-events-auto"
          : "opacity-0 invisible translate-y-2 pointer-events-none",
        onDark
          ? "bg-midnight/95 border-primary-foreground/15 text-primary-foreground"
          : "bg-background/95 border-border text-foreground",
      )}
    >
      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-3 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.22em] opacity-60 mb-1">Sub-brands & where to start</p>
          <div className="grid grid-cols-2 gap-2">
            {productHubs.map((b) => {
              const Icon = b.icon;
              return (
                <Link
                  key={b.name}
                  to={b.to}
                  className={cn(
                    "block rounded-xl border p-3 transition-all hover:-translate-y-0.5 group/card",
                    onDark
                      ? "border-primary-foreground/10 bg-primary-foreground/5 hover:border-gold/40"
                      : "border-border bg-muted/40 hover:border-primary/40 hover:bg-muted",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-gold">
                      <Icon size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-bold leading-tight">{b.name}</p>
                      <p className="text-[11px] opacity-70">{b.tag}</p>
                    </div>
                    <ArrowRight size={14} className="opacity-40 group-hover/card:opacity-100 group-hover/card:translate-x-0.5 transition-all" />
                  </div>
                  <p className="mt-2 text-xs opacity-75 leading-snug">{b.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="col-span-2">
          <p className="text-[10px] uppercase tracking-[0.22em] opacity-60 mb-3">Browse categories</p>
          <div className="flex flex-col gap-1">
            {categories.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.label}
                  to={p.to}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    onDark
                      ? "hover:bg-primary-foreground/10"
                      : "hover:bg-muted",
                  )}
                >
                  <Icon size={15} className="text-primary" />
                  {p.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;
