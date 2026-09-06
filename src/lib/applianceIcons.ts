import { Lightbulb, Fan, Tv, CookingPot, Shirt, Plug } from "lucide-react";
import type { ApplianceCategory } from "@/data/applianceWatts";

/**
 * Appliance pickers previously rendered emoji as icons, which clashed with the
 * lucide icon set used everywhere else. One icon per category keeps the chips
 * readable at small sizes without a bespoke icon per appliance.
 */
export const applianceCategoryIcon: Record<ApplianceCategory, typeof Lightbulb> = {
  lighting: Lightbulb,
  cooling: Fan,
  entertainment: Tv,
  kitchen: CookingPot,
  laundry: Shirt,
  other: Plug,
};
