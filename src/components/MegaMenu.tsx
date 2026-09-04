import { Link } from "react-router-dom";
import {
  Package,
  Store,
  Lock,
  Camera,
  Lightbulb,
  Zap,
  Sun,
  BatteryCharging,
  ArrowRight,
  Home,
  Cpu,
  Calculator,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const productHubs = [
  {
    name: "Retail Store",
    tag: "35+ Products",
    desc: "Shop inverters, LiFePO4 batteries, smart locks and IoT hardware with nationwide delivery.",
    to: "/retail",
    icon: Store,
  },
  {
    name: "All Packages",
    tag: "Solar · Locks · Automation",
    desc: "Browse all pre-engineered solar systems, smart lock bundles and home automation tiers in one place.",
    to: "/packages",
    icon: Package,
  },
  {
    name: "Energy Calculator",
    tag: "Free Load Sizer",
    desc: "Calculate your home or business power consumption and get exact equipment recommendations.",
    to: "/energy-calculator",
    icon: Calculator,
  },
  {
    name: "VoltAi Smart IoT",
    tag: "Intelligent Home",
    desc: "Unified smart locks, scene lighting, and automated curtains in one app.",
    to: "/voltai",
    icon: Cpu,
  },
];

const standaloneCategories = [
  { label: "Solar Packages", to: "/packages?category=solar", icon: Sun },
  { label: "Smart Locks (STAMA)", to: "/packages?category=locks", icon: Lock, badge: "Face ID" },
  { label: "Home Automation", to: "/packages?category=automation", icon: Home, badge: "IoT" },
  { label: "CCTV Surveillance", to: "/cctv", icon: Camera, badge: "ColorVu" },
  { label: "Solar Inverters & Batteries", to: "/retail?category=Inverters", icon: BatteryCharging },
  { label: "Engineering Solutions", to: "/solutions", icon: Layers, badge: "Overview" },
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
        "absolute left-0 sm:-left-20 lg:-left-28 top-full z-50 mt-3 w-[min(720px,calc(100vw-2.5rem))] rounded-3xl border p-4 sm:p-5 shadow-2xl backdrop-blur-2xl transition-all duration-200 ease-out",
        open
          ? "opacity-100 visible translate-y-0 pointer-events-auto"
          : "opacity-0 invisible translate-y-2 pointer-events-none",
        onDark
          ? "bg-midnight/98 border-primary-foreground/20 text-primary-foreground shadow-2xl shadow-black/70 backdrop-blur-2xl"
          : "bg-card/98 border-border text-foreground shadow-2xl shadow-slate-900/15 backdrop-blur-2xl",
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
        {/* Left Column: Featured Sub-brands & Tools */}
        <div className="md:col-span-7 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 px-1 mb-1">
            Technology Platforms & Store
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {productHubs.map((b) => {
              const Icon = b.icon;
              return (
                <Link
                  key={b.name}
                  to={b.to}
                  className={cn(
                    "block rounded-2xl border p-3 transition-all hover:-translate-y-0.5 group/card",
                    onDark
                      ? "border-primary-foreground/10 bg-primary-foreground/5 hover:border-gold/40 hover:bg-primary-foreground/10"
                      : "border-border bg-background/90 hover:border-primary/40 hover:bg-muted/80 backdrop-blur-sm",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-gold/15 text-gold shrink-0">
                      <Icon size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-display font-bold leading-tight truncate">{b.name}</p>
                      <p className="text-[10px] opacity-70 truncate">{b.tag}</p>
                    </div>
                    <ArrowRight size={13} className="opacity-40 group-hover/card:opacity-100 group-hover/card:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  <p className="mt-1.5 text-[11px] opacity-75 leading-snug line-clamp-2">{b.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dedicated Standalone Category Pages */}
        <div className="md:col-span-5 md:border-l md:border-border/60 md:pl-4">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60 px-1 mb-2">
            Standalone Solutions
          </p>
          <div className="flex flex-col gap-1">
            {standaloneCategories.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.label}
                  to={p.to}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors group/item",
                    onDark
                      ? "hover:bg-primary-foreground/10 text-primary-foreground/90"
                      : "hover:bg-muted text-foreground/90",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={14} className="text-primary shrink-0 group-hover/item:scale-110 transition-transform" />
                    <span className="truncate">{p.label}</span>
                  </div>
                  {p.badge && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-gold/15 text-gold shrink-0">
                      {p.badge}
                    </span>
                  )}
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
