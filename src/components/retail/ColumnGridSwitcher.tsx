import React from "react";

export type GridColumnOption = 2 | 3 | 4 | 5 | "list";

interface ColumnGridSwitcherProps {
  value: GridColumnOption;
  onChange: (value: GridColumnOption) => void;
  className?: string;
}

export const ColumnGridSwitcher: React.FC<ColumnGridSwitcherProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const options: { id: GridColumnOption; label: string; icon: React.ReactNode }[] = [
    {
      id: 2,
      label: "2 Columns",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1.5" y="2" width="5.5" height="5.5" rx="1" />
          <rect x="9" y="2" width="5.5" height="5.5" rx="1" />
          <rect x="1.5" y="8.5" width="5.5" height="5.5" rx="1" />
          <rect x="9" y="8.5" width="5.5" height="5.5" rx="1" />
        </svg>
      ),
    },
    {
      id: 3,
      label: "3 Columns",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 18 16" fill="currentColor">
          <rect x="1" y="2" width="4" height="5.5" rx="0.8" />
          <rect x="7" y="2" width="4" height="5.5" rx="0.8" />
          <rect x="13" y="2" width="4" height="5.5" rx="0.8" />
          <rect x="1" y="8.5" width="4" height="5.5" rx="0.8" />
          <rect x="7" y="8.5" width="4" height="5.5" rx="0.8" />
          <rect x="13" y="8.5" width="4" height="5.5" rx="0.8" />
        </svg>
      ),
    },
    {
      id: 4,
      label: "4 Columns",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 20 16" fill="currentColor">
          <rect x="1" y="2" width="3.5" height="5.5" rx="0.6" />
          <rect x="5.8" y="2" width="3.5" height="5.5" rx="0.6" />
          <rect x="10.6" y="2" width="3.5" height="5.5" rx="0.6" />
          <rect x="15.4" y="2" width="3.5" height="5.5" rx="0.6" />
          <rect x="1" y="8.5" width="3.5" height="5.5" rx="0.6" />
          <rect x="5.8" y="8.5" width="3.5" height="5.5" rx="0.6" />
          <rect x="10.6" y="8.5" width="3.5" height="5.5" rx="0.6" />
          <rect x="15.4" y="8.5" width="3.5" height="5.5" rx="0.6" />
        </svg>
      ),
    },
    {
      id: 5,
      label: "5 Columns",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 22 16" fill="currentColor">
          <rect x="0.8" y="2" width="3" height="5.5" rx="0.5" />
          <rect x="5" y="2" width="3" height="5.5" rx="0.5" />
          <rect x="9.2" y="2" width="3" height="5.5" rx="0.5" />
          <rect x="13.4" y="2" width="3" height="5.5" rx="0.5" />
          <rect x="17.6" y="2" width="3" height="5.5" rx="0.5" />
          <rect x="0.8" y="8.5" width="3" height="5.5" rx="0.5" />
          <rect x="5" y="8.5" width="3" height="5.5" rx="0.5" />
          <rect x="9.2" y="8.5" width="3" height="5.5" rx="0.5" />
          <rect x="13.4" y="8.5" width="3" height="5.5" rx="0.5" />
          <rect x="17.6" y="8.5" width="3" height="5.5" rx="0.5" />
        </svg>
      ),
    },
    {
      id: "list",
      label: "List View",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1.5" y="2.5" width="3" height="3" rx="0.6" />
          <rect x="6.5" y="3.2" width="8" height="1.6" rx="0.8" />
          <rect x="1.5" y="6.5" width="3" height="3" rx="0.6" />
          <rect x="6.5" y="7.2" width="8" height="1.6" rx="0.8" />
          <rect x="1.5" y="10.5" width="3" height="3" rx="0.6" />
          <rect x="6.5" y="11.2" width="8" height="1.6" rx="0.8" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className={`inline-flex items-center border border-border rounded-xl bg-muted/30 p-0.5 h-10 shadow-xs ${className}`}
      role="group"
      aria-label="Product layout switcher"
    >
      {options.map((opt) => {
        const isActive = value === opt.id;
        return (
          <div key={opt.id} className="relative group flex items-center justify-center">
            <button
              type="button"
              onClick={() => onChange(opt.id)}
              aria-label={opt.label}
              className={`p-2 rounded-lg transition-all ${
                isActive
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground/70 hover:text-foreground hover:bg-card/50"
              }`}
            >
              {opt.icon}
            </button>

            {/* Hover Tooltip matching reference screenshot */}
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-40 flex flex-col items-center">
              <span className="bg-foreground text-background text-[10.5px] font-semibold px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                {opt.label}
              </span>
              <span className="w-1.5 h-1.5 bg-foreground rotate-45 -mt-0.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
