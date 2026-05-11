import { Link } from "react-router-dom";
import { Lock, Camera, Lightbulb, Zap, Sun, BatteryCharging, Home, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

const subBrands = [
  {
    name: "LumiVolt",
    tag: "Residential Solar",
    desc: "Inverters, panels and battery systems for homes.",
    to: "/solutions#solar",
    icon: Home,
  },
  {
    name: "VoltAi",
    tag: "Smart Automation",
    desc: "AI-powered home control, security and lighting.",
    to: "/lumivolt-ai",
    icon: Cpu,
  },
];

const products = [
  { label: "Smart Lock", to: "/catalog?cat=smart-lock", icon: Lock },
  { label: "CCTV", to: "/catalog?cat=cctv", icon: Camera },
  { label: "Smart Lights", to: "/catalog?cat=smart-lights", icon: Lightbulb },
  { label: "Solar Inverter", to: "/catalog?cat=inverter", icon: Zap },
  { label: "Solar Panels", to: "/catalog?cat=panels", icon: Sun },
  { label: "Batteries", to: "/catalog?cat=battery", icon: BatteryCharging },
];

interface MegaMenuProps {
  onDark: boolean;
}

export const MegaMenu = ({ onDark }: MegaMenuProps) => {
  return (
    <div
      className={cn(
        "absolute left-1/2 top-full z-50 mt-3 w-[640px] -translate-x-1/2 rounded-2xl border p-5 shadow-2xl backdrop-blur-xl",
        "opacity-0 invisible translate-y-2 transition-all duration-200 ease-out",
        "group-hover:opacity-100 group-hover:visible group-hover:translate-y-0",
        "focus-within:opacity-100 focus-within:visible focus-within:translate-y-0",
        onDark
          ? "bg-midnight/95 border-primary-foreground/15 text-primary-foreground"
          : "bg-background/95 border-border text-foreground",
      )}
    >
      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-2 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.22em] opacity-60">Sub-brands</p>
          {subBrands.map((b) => {
            const Icon = b.icon;
            return (
              <Link
                key={b.name}
                to={b.to}
                className={cn(
                  "block rounded-xl border p-3 transition-all hover:-translate-y-0.5",
                  onDark
                    ? "border-primary-foreground/10 bg-primary-foreground/5 hover:border-gold/40"
                    : "border-border bg-muted/40 hover:border-primary/40 hover:bg-muted",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-gold">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-display font-bold leading-tight">{b.name}</p>
                    <p className="text-[11px] opacity-70">{b.tag}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs opacity-75 leading-snug">{b.desc}</p>
              </Link>
            );
          })}
        </div>

        <div className="col-span-3">
          <p className="text-[10px] uppercase tracking-[0.22em] opacity-60 mb-3">Browse products</p>
          <div className="grid grid-cols-2 gap-2">
            {products.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.label}
                  to={p.to}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    onDark
                      ? "hover:bg-primary-foreground/10"
                      : "hover:bg-muted",
                  )}
                >
                  <Icon size={16} className="text-primary" />
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
