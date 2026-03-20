import type { LeadFormData } from "./types";
import { StepUI, selectBtnClass, toggleList, inputClass } from "./StepUI";

const appliances = ["Lights", "Fan", "TV", "Fridge", "AC", "Water Pump", "Other"];
const durations = ["3–5 hours", "6–10 hours", "10–24 hours"];
const heavyOpts = ["Yes (AC, Pump, Freezer)", "No"];
const systemTypes = ["Full Off-Grid (no reliance on NEPA)", "Backup System (only when light goes off)", "Not sure (recommend for me)"];
const propertyTypes = ["Apartment", "Bungalow", "Duplex", "Office / Shop"];

export const solarStepKeys = ["solar_intro", "solar_appliances", "solar_duration", "solar_heavy", "solar_system", "solar_property", "solar_location"] as const;

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
        <StepUI title="What appliances do you want to power?" subtitle="Select all that apply">
          <div className="grid grid-cols-2 gap-3">
            {appliances.map((a) => (
              <button key={a} onClick={() => update({ solarAppliances: toggleList(data.solarAppliances, a) })} className={selectBtnClass(data.solarAppliances.includes(a))}>
                {a}
              </button>
            ))}
          </div>
        </StepUI>
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
    case "solar_heavy":
      return (
        <StepUI title="Will you be powering high-energy appliances?">
          <div className="space-y-2">
            {heavyOpts.map((o) => (
              <button key={o} onClick={() => update({ heavyAppliances: o })} className={`w-full ${selectBtnClass(data.heavyAppliances === o)}`}>
                {o}
              </button>
            ))}
          </div>
          {data.heavyAppliances.startsWith("Yes") && (
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Please specify</label>
              <input className={inputClass} placeholder="e.g. 2 ACs, 1 Freezer" value={data.heavyAppliancesDetail} onChange={(e) => update({ heavyAppliancesDetail: e.target.value })} />
            </div>
          )}
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
          <input className={inputClass} placeholder="e.g. Ikeja, Lagos" value={data.location} onChange={(e) => update({ location: e.target.value })} />
        </StepUI>
      );
    default:
      return null;
  }
}

export function canProceedSolar(stepKey: string, data: LeadFormData): boolean {
  switch (stepKey) {
    case "solar_intro": return true;
    case "solar_appliances": return data.solarAppliances.length > 0;
    case "solar_duration": return !!data.usageDuration;
    case "solar_heavy": return !!data.heavyAppliances;
    case "solar_system": return !!data.systemType;
    case "solar_property": return !!data.propertyType;
    case "solar_location": return !!data.location.trim();
    default: return true;
  }
}
