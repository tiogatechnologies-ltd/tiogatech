import { Link } from "react-router-dom";
import { Package, Store, Cpu, Layers, Lock, Camera, Lightbulb, Zap, Sun, BatteryCharging, ArrowRight } from "lucide-react";
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
    name: "Store",
    tag: "Browse catalog",
    desc: "Individual devices, panels, locks, cameras and more. Order on WhatsApp.",
    to: "/catalog",
    icon: Store,
  },
  {
    name: "Solutions",
    tag: "Full systems",
    desc: "End to end designs for solar, smart home and security at any scale.",
    to: "/solutions",
    icon: Layers,
  },
  {
    name: "LumiVolt AI",
    tag: "AI sizing assistant",
    desc: "Try the watts calculator and get an AI-powered system recommendation.",
    to: "/lumivolt-ai",
    icon: Cpu,
  },
];

const categories = [
  { label: "Smart Locks", to: "/packages#categories", icon: Lock },
  { label: "CCTV", to: "/packages#categories", icon: Camera },
  { label: "Smart Lights", to: "/packages#categories", icon: Lightbulb },
  { label: "Solar Inverters", to: "/packages#categories", icon: Zap },
  { label: "Solar Panels", to: "/packages#categories", icon: Sun },
  { label: "Batteries", to: "/packages#categories", icon: BatteryCharging },
];

interface MegaMenuProps {
  onDark: boolean;
}

export const MegaMenu = ({ onDark }: MegaMenuProps) => {
  return (
    <div
      className={cn(
        "absolute left-1/2 top-full z-50 mt-3 w-[720px] -translate-x-1/2 rounded-2xl border p-5 shadow-2xl backdrop-blur-xl",
        "opacity-0 invisible translate-y-2 transition-all duration-200 ease-out",
        "group-hover:opacity-100 group-hover:visible group-hover:translate-y-0",
        "focus-within:opacity-100 focus-within:visible focus-within:translate-y-0",
        onDark
          ? "bg-midnight/95 border-primary-foreground/15 text-primary-foreground"
          : "bg-background/95 border-border text-foreground",
      )}
    >
      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-3 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.22em] opacity-60 mb-1">Where to start</p>
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
