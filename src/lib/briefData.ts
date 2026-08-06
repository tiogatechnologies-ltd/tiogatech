// Normalises LumiVolt sizings and solar assessments into the shared report shape.
import type { ReportData, ReportSpec } from "./reportPdf";

const n = (v: any) => (v === null || v === undefined || v === "" ? null : Number(v));
const fmt = (v: any, unit: string, digits = 0) =>
  n(v) === null ? "—" : `${Number(v).toLocaleString("en-NG", { maximumFractionDigits: digits })} ${unit}`;

export type PipelineStatus =
  | "new" | "sales_review" | "quoted" | "customer_approved"
  | "engineering_review" | "scheduled" | "installed" | "closed";

export const PIPELINE_STAGES: { value: PipelineStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "sales_review", label: "Sales review" },
  { value: "quoted", label: "Quoted" },
  { value: "customer_approved", label: "Customer approved" },
  { value: "engineering_review", label: "Engineering review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "installed", label: "Installed" },
  { value: "closed", label: "Closed" },
];

export const stageLabel = (v?: string | null) =>
  PIPELINE_STAGES.find((s) => s.value === v)?.label || (v ? v.replace(/_/g, " ") : "New");

export const stageClass = (v?: string | null) => {
  switch (v) {
    case "installed":
    case "customer_approved":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "engineering_review":
    case "scheduled":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "quoted":
    case "sales_review":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "closed":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
};

/** Engineer-revised values override the system recommendation when present. */
export const effective = (row: any, key: string) => row?.revised?.[key] ?? row?.[key];

export function sizingToReport(row: any, opts: { internal?: boolean } = {}): ReportData {
  const dailyWh = Number(row.daily_energy_wh || 0);
  const summary: ReportSpec[] = [
    { label: "Total connected load", value: fmt(row.total_load_w, "W") },
    { label: "Daily energy demand", value: `${(dailyWh / 1000).toFixed(2)} kWh` },
    { label: "Days of autonomy", value: `${row.days_autonomy ?? 1}` },
    { label: "Average sunlight hours", value: `${row.sunlight_hours ?? "—"} h/day` },
    { label: "Battery chemistry", value: String(row.battery_type || "—") },
    { label: "Depth of discharge", value: row.battery_dod ? `${Math.round(Number(row.battery_dod) * 100)}%` : "—" },
  ];

  const system: ReportSpec[] = [
    { label: "Solar array (energy match)", value: fmt(effective(row, "solar_panel_w"), "W") },
    { label: "Solar array (recommended)", value: fmt(effective(row, "recommended_panel_w"), "W") },
    { label: "Inverter", value: fmt(effective(row, "inverter_w"), "W") },
    { label: "Battery bank", value: `${fmt(effective(row, "battery_ah"), "Ah")} @ ${row.battery_voltage ?? "—"} V` },
    { label: "Battery capacity", value: n(effective(row, "battery_kwh")) === null ? "—" : `${Number(effective(row, "battery_kwh")).toFixed(2)} kWh` },
    { label: "Charge controller", value: fmt(effective(row, "charge_controller_a"), "A", 1) },
  ];

  return {
    reference: `SZ-${String(row.id).slice(0, 8).toUpperCase()}`,
    documentLabel: opts.internal ? "Internal Engineering Brief" : "Solar Sizing Report",
    title: opts.internal ? "Engineering brief — solar sizing" : "Your recommended solar system",
    subtitle: `${fmt(effective(row, "inverter_w"), "W")} inverter · ${n(effective(row, "battery_kwh")) === null ? "—" : Number(effective(row, "battery_kwh")).toFixed(2) + " kWh"} storage · ${fmt(effective(row, "recommended_panel_w"), "W")} solar`,
    meta: [
      { label: "Date", value: new Date(row.created_at || Date.now()).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) },
      { label: "Client", value: row.full_name || "—" },
      { label: "Scope", value: "Self-service system sizing — indicative pending site survey" },
    ],
    callout: `Based on a total connected load of ${fmt(row.total_load_w, "W")} and a daily demand of ${(dailyWh / 1000).toFixed(2)} kWh, this design provides ${row.days_autonomy ?? 1} day(s) of autonomy using ${String(row.battery_type || "lithium")} storage at ${row.sunlight_hours ?? 5} peak sun hours per day. Final component selection and cable sizing are confirmed after a site survey.`,
    customer: { full_name: row.full_name, email: row.email, phone: row.phone, location: row.location },
    createdAt: row.created_at,
    appliances: Array.isArray(row.appliances) ? row.appliances : [],
    summary,
    system,

    sections: opts.internal
      ? [{
          title: "Workflow",
          rows: [
            { label: "Stage", value: stageLabel(row.pipeline_status) },
            { label: "Source", value: row.source || "—" },
            { label: "Engineer revised", value: row.revised ? "Yes" : "No" },
          ],
        }]
      : [],
    engineerSummary: row.notes || null,
    internalNotes: row.internal_notes || null,
    internal: opts.internal,
  };
}

export function assessmentToReport(row: any, opts: { internal?: boolean } = {}): ReportData {
  const rec = row.recommendation || {};
  const fr = row.full_report || {};
  const sizing = fr.solar_sizing || {};
  const inv = fr.inverter_spec || {};
  const bat = fr.battery_spec || {};

  const summary: ReportSpec[] = [
    { label: "Peak load", value: fmt(row.peak_load_w, "W") },
    { label: "Daily energy demand", value: row.daily_kwh ? `${Number(row.daily_kwh).toFixed(2)} kWh` : "—" },
    { label: "Building type", value: row.building_type || "—" },
    { label: "Occupants", value: row.occupants ? String(row.occupants) : "—" },
    { label: "Current power situation", value: row.current_power_situation || "—" },
    { label: "Monthly bill", value: row.monthly_bill_ngn ? `₦${Number(row.monthly_bill_ngn).toLocaleString()}` : "—" },
  ];

  const system: ReportSpec[] = [
    { label: "Inverter", value: `${inv.size_kva ?? rec.inverter_kva ?? "—"} kVA${inv.type ? ` · ${inv.type}` : ""}` },
    { label: "Battery bank", value: `${bat.capacity_kwh ?? rec.battery_kwh ?? "—"} kWh${bat.chemistry ? ` · ${bat.chemistry}` : ""}` },
    { label: "Solar array", value: `${sizing.panel_count ?? rec.panel_count ?? "—"} × ${sizing.panel_wattage ?? rec.panel_w ?? "—"} W` },
    { label: "Total array", value: sizing.total_array_w ? `${sizing.total_array_w} W` : "—" },
    { label: "Backup estimate", value: `${bat.backup_hours_estimate ?? rec.backup_hours ?? "—"} h` },
    { label: "Roof area required", value: sizing.required_roof_m2 ? `${sizing.required_roof_m2} m²` : "—" },
  ];

  const sections: { title: string; rows: ReportSpec[] }[] = [];
  const asRows = (obj: any): ReportSpec[] =>
    obj && typeof obj === "object"
      ? Object.entries(obj).map(([k, v]) => ({ label: k.replace(/_/g, " "), value: Array.isArray(v) ? v.join(", ") : String(v ?? "—") }))
      : [];

  if (fr.electrical_components) sections.push({ title: "Electrical components", rows: asRows(fr.electrical_components) });
  if (fr.installation_notes) sections.push({ title: "Installation notes", rows: asRows(fr.installation_notes) });
  if (opts.internal) {
    sections.push({
      title: "Workflow",
      rows: [
        { label: "Stage", value: stageLabel(row.pipeline_status) },
        { label: "Report status", value: row.status || "—" },
        { label: "Full report unlocked", value: row.is_full_unlocked ? "Yes" : "No" },
      ],
    });
  }

  return {
    reference: `AS-${String(row.id).slice(0, 8).toUpperCase()}`,
    documentLabel: opts.internal ? "Internal Engineering Brief" : "Solar Assessment Report",
    title: opts.internal ? "Engineering brief — solar assessment" : "Your solar assessment report",
    subtitle: `${inv.size_kva ?? rec.inverter_kva ?? "—"} kVA inverter · ${bat.capacity_kwh ?? rec.battery_kwh ?? "—"} kWh storage · ${sizing.panel_count ?? rec.panel_count ?? "—"} × ${sizing.panel_wattage ?? rec.panel_w ?? "—"} W panels`,
    meta: [
      { label: "Date", value: new Date(row.created_at || Date.now()).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) },
      { label: "Client", value: row.full_name || "—" },
      { label: "Scope", value: `${row.building_type || "Property"} assessment — ${row.location || "Nigeria"}` },
    ],
    callout: `This assessment covers a daily demand of ${row.daily_kwh ? Number(row.daily_kwh).toFixed(2) : "—"} kWh with a peak load of ${fmt(row.peak_load_w, "W")}. The recommended system is sized to carry the listed appliances with an estimated ${bat.backup_hours_estimate ?? rec.backup_hours ?? "—"} hours of backup. Quantities and cable runs are confirmed on site.`,
    customer: { full_name: row.full_name, email: row.email, phone: row.phone, location: row.location },

    createdAt: row.created_at,
    appliances: Array.isArray(row.appliances) ? row.appliances : [],
    summary,
    system,
    sections,
    billOfMaterials: Array.isArray(fr.bill_of_materials) ? fr.bill_of_materials : [],
    engineerSummary: fr.engineer_summary || row.engineer_notes || null,
    internalNotes: row.internal_notes || null,
    internal: opts.internal,
  };
}
