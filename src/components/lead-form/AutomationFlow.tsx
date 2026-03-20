import type { LeadFormData } from "./types";
import { StepUI, selectBtnClass, toggleList } from "./StepUI";

const automateOptions = ["Lights", "Switches", "Entire home", "Specific rooms"];
const controlOptions = ["Mobile app", "Voice control", "Both"];
const propertyTypes = ["Apartment", "Duplex", "Office"];
const scaleOptions = ["Single room", "Multiple rooms", "Full house"];

export const automationStepKeys = ["auto_intro", "auto_what", "auto_control", "auto_property", "auto_scale"] as const;

export function renderAutomationStep(stepKey: string, data: LeadFormData, update: (d: Partial<LeadFormData>) => void) {
  switch (stepKey) {
    case "auto_intro":
      return (
        <StepUI title="Make your home smarter" subtitle="More convenient and fully controllable">
          <p className="text-sm text-muted-foreground">Let's find the perfect automation setup for your space.</p>
        </StepUI>
      );
    case "auto_what":
      return (
        <StepUI title="What do you want to automate?" subtitle="Select all that apply">
          <div className="grid grid-cols-2 gap-3">
            {automateOptions.map((a) => (
              <button key={a} onClick={() => update({ automateWhat: toggleList(data.automateWhat, a) })} className={selectBtnClass(data.automateWhat.includes(a))}>
                {a}
              </button>
            ))}
          </div>
        </StepUI>
      );
    case "auto_control":
      return (
        <StepUI title="How do you prefer to control?">
          <div className="space-y-2">
            {controlOptions.map((c) => (
              <button key={c} onClick={() => update({ controlPreference: c })} className={`w-full ${selectBtnClass(data.controlPreference === c)}`}>
                {c}
              </button>
            ))}
          </div>
        </StepUI>
      );
    case "auto_property":
      return (
        <StepUI title="What type of property?">
          <div className="space-y-2">
            {propertyTypes.map((p) => (
              <button key={p} onClick={() => update({ automationPropertyType: p })} className={`w-full ${selectBtnClass(data.automationPropertyType === p)}`}>
                {p}
              </button>
            ))}
          </div>
        </StepUI>
      );
    case "auto_scale":
      return (
        <StepUI title="What scale of automation?">
          <div className="space-y-2">
            {scaleOptions.map((s) => (
              <button key={s} onClick={() => update({ automationScale: s })} className={`w-full ${selectBtnClass(data.automationScale === s)}`}>
                {s}
              </button>
            ))}
          </div>
        </StepUI>
      );
    default:
      return null;
  }
}

export function canProceedAutomation(stepKey: string, data: LeadFormData): boolean {
  switch (stepKey) {
    case "auto_intro": return true;
    case "auto_what": return data.automateWhat.length > 0;
    case "auto_control": return !!data.controlPreference;
    case "auto_property": return !!data.automationPropertyType;
    case "auto_scale": return !!data.automationScale;
    default: return true;
  }
}
