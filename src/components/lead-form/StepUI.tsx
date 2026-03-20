import { ReactNode } from "react";

interface StepUIProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const StepUI = ({ title, subtitle, children }: StepUIProps) => (
  <div className="space-y-5">
    <div>
      <h3 className="text-xl font-display font-bold text-card-foreground">{title}</h3>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

export const inputClass =
  "w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground";

export const selectBtnClass = (selected: boolean) =>
  `rounded-xl border-2 px-4 py-3 text-sm font-medium text-left transition-all ${
    selected
      ? "border-primary bg-primary/10 text-primary"
      : "border-border text-foreground hover:border-primary/30"
  }`;

export const toggleList = <T extends string>(list: T[], value: T): T[] =>
  list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
