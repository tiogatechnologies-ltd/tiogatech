import type { LeadFormData } from "./types";
import { StepUI, selectBtnClass } from "./StepUI";
import WattsCalculator from "./WattsCalculator";
import AddressInput from "./AddressInput";
import { calculateTotalWatts, type SelectedAppliance } from "@/data/applianceWatts";

const durations = ["3 to 5 hours", "6 to 10 hours", "10 to 24 hours"];
const systemTypes = ["Full Off-Grid (no reliance on NEPA)", "Backup System (only when light goes off)", "Not sure (recommend for me)"];
const propertyTypes = ["Apartment", "Bungalow", "Duplex", "Office / Shop"];

export const solarStepKeys = ["solar_intro", "solar_appliances", "solar_duration", "solar_system", "solar_property", "solar_location"] as const;

export function renderSolarStep(stepKey: string, data: LeadFormData, update: (d: Partial<LeadFormData>) => void) {
  switch (stepKey) {
    case "solar_intro":
      return (
        <StepUI title="Let's design the perfect solar system" subtitle="For your home or business">
          <p className="text-sm text-muted-foreground">We'll ask a few quick questions to recommend the best setup. Takes under 2 minutes.</p>
        </StepUI>
      );
    case "solar_appliances":
      return (
        <WattsCalculator
          selectedAppliances={data.selectedAppliances}
          onChange={(appliances: SelectedAppliance[]) => {
            const totals = calculateTotalWatts(appliances);
            update({
              selectedAppliances: appliances,
              totalWatts: totals.avg,
              solarAppliances: appliances.map(a => `${a.name} x${a.quantity}`),
            });
          }}
          budget={data.budget}
        />
      );
    case "solar_duration":
      return (
        <StepUI title="How many hours per day should the system power your appliances?">
          <div className="space-y-2">
            {durations.map((d) => (
              <button key={d} onClick={() => update({ usageDuration: d })} className={`w-full ${selectBtnClass(data.usageDuration === d)}`}>
                {d}
              </button>
            ))}
          </div>
        </StepUI>
      );
    case "solar_system":
      return (
        <StepUI title="What type of system do you prefer?">
          <div className="space-y-2">
            {systemTypes.map((s) => (
              <button key={s} onClick={() => update({ systemType: s })} className={`w-full ${selectBtnClass(data.systemType === s)}`}>
                {s}
              </button>
            ))}
          </div>
        </StepUI>
      );
    case "solar_property":
      return (
        <StepUI title="Tell us about your space">
          <div className="grid grid-cols-2 gap-3">
            {propertyTypes.map((p) => (
              <button key={p} onClick={() => update({ propertyType: p })} className={selectBtnClass(data.propertyType === p)}>
                {p}
              </button>
            ))}
          </div>
        </StepUI>
      );
    case "solar_location":
      return (
        <StepUI title="Where will installation take place?">
          <AddressInput value={data.location} onChange={(location) => update({ location })} />
        </StepUI>
      );
    default:
      return null;
  }
}

export function canProceedSolar(stepKey: string, data: LeadFormData): boolean {
  switch (stepKey) {
    case "solar_intro": return true;
    case "solar_appliances": return data.selectedAppliances.length > 0;
    case "solar_duration": return !!data.usageDuration;
    case "solar_system": return !!data.systemType;
    case "solar_property": return !!data.propertyType;
    case "solar_location": return !!data.location.trim();
    default: return true;
  }
}
