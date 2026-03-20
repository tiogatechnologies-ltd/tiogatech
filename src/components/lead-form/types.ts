export type FlowCategory = "solar" | "automation" | "security";

export interface LeadFormData {
  // Common
  category: FlowCategory | null;
  fullName: string;
  phone: string;
  email: string;
  location: string;
  budget: string;
  consent: boolean;
  notes: string;

  // Solar
  solarAppliances: string[];
  usageDuration: string;
  heavyAppliances: string;
  heavyAppliancesDetail: string;
  systemType: string;
  propertyType: string;

  // Automation
  automateWhat: string[];
  controlPreference: string;
  automationPropertyType: string;
  automationScale: string;

  // Security
  securityNeeds: string[];
  securityPropertyType: string;
  accessType: string[];
  cctvCoverage: string[];
}

export const initialFormData: LeadFormData = {
  category: null,
  fullName: "",
  phone: "",
  email: "",
  location: "",
  budget: "",
  consent: false,
  notes: "",
  solarAppliances: [],
  usageDuration: "",
  heavyAppliances: "",
  heavyAppliancesDetail: "",
  systemType: "",
  propertyType: "",
  automateWhat: [],
  controlPreference: "",
  automationPropertyType: "",
  automationScale: "",
  securityNeeds: [],
  securityPropertyType: "",
  accessType: [],
  cctvCoverage: [],
};

export const budgetOptions = ["Below ₦500k", "₦500k – ₦1M", "₦1M – ₦3M", "₦3M+"];
