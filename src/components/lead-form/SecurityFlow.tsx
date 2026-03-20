import type { LeadFormData } from "./types";
import { StepUI, selectBtnClass, toggleList } from "./StepUI";

const needsOptions = ["Smart Locks", "CCTV Cameras", "Both"];
const propertyTypes = ["Home", "Office", "Shortlet / Airbnb", "Hotel"];
const accessTypes = ["Fingerprint", "Face recognition", "Passcode", "App control"];
const coverageOptions = ["Indoor", "Outdoor", "Full property"];

export const securityStepKeys = ["sec_intro", "sec_needs", "sec_property", "sec_access", "sec_coverage"] as const;

export function renderSecurityStep(stepKey: string, data: LeadFormData, update: (d: Partial<LeadFormData>) => void) {
  const showAccess = data.securityNeeds.some((n) => n !== "CCTV Cameras");
  const showCoverage = data.securityNeeds.some((n) => n !== "Smart Locks");

  switch (stepKey) {
    case "sec_intro":
      return (
        <StepUI title="Secure your space" subtitle="With smart, modern systems">
          <p className="text-sm text-muted-foreground">We'll help you find the right security setup for your property.</p>
        </StepUI>
      );
    case "sec_needs":
      return (
        <StepUI title="What do you need?">
          <div className="space-y-2">
            {needsOptions.map((n) => (
              <button key={n} onClick={() => update({ securityNeeds: [n] })} className={`w-full ${selectBtnClass(data.securityNeeds.includes(n))}`}>
                {n}
              </button>
            ))}
          </div>
        </StepUI>
      );
    case "sec_property":
      return (
        <StepUI title="What type of property?">
          <div className="grid grid-cols-2 gap-3">
            {propertyTypes.map((p) => (
              <button key={p} onClick={() => update({ securityPropertyType: p })} className={selectBtnClass(data.securityPropertyType === p)}>
                {p}
              </button>
            ))}
          </div>
        </StepUI>
      );
    case "sec_access":
      if (!showAccess) return null;
      return (
        <StepUI title="Preferred access type" subtitle="Select all that interest you">
          <div className="grid grid-cols-2 gap-3">
            {accessTypes.map((a) => (
              <button key={a} onClick={() => update({ accessType: toggleList(data.accessType, a) })} className={selectBtnClass(data.accessType.includes(a))}>
                {a}
              </button>
            ))}
          </div>
        </StepUI>
      );
    case "sec_coverage":
      if (!showCoverage) return null;
      return (
        <StepUI title="CCTV coverage needed" subtitle="Select all that apply">
          <div className="space-y-2">
            {coverageOptions.map((c) => (
              <button key={c} onClick={() => update({ cctvCoverage: toggleList(data.cctvCoverage, c) })} className={selectBtnClass(data.cctvCoverage.includes(c))}>
                {c}
              </button>
            ))}
          </div>
        </StepUI>
      );
    default:
      return null;
  }
}

export function canProceedSecurity(stepKey: string, data: LeadFormData): boolean {
  const showAccess = data.securityNeeds.some((n) => n !== "CCTV Cameras");
  const showCoverage = data.securityNeeds.some((n) => n !== "Smart Locks");

  switch (stepKey) {
    case "sec_intro": return true;
    case "sec_needs": return data.securityNeeds.length > 0;
    case "sec_property": return !!data.securityPropertyType;
    case "sec_access": return !showAccess || data.accessType.length > 0;
    case "sec_coverage": return !showCoverage || data.cctvCoverage.length > 0;
    default: return true;
  }
}

export function getSecuritySteps(data: LeadFormData): string[] {
  const showAccess = data.securityNeeds.some((n) => n !== "CCTV Cameras");
  const showCoverage = data.securityNeeds.some((n) => n !== "Smart Locks");
  
  const steps = ["sec_intro", "sec_needs", "sec_property"];
  if (showAccess) steps.push("sec_access");
  if (showCoverage) steps.push("sec_coverage");
  return steps;
}
