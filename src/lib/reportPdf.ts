// Shared solar report PDF renderer used by the customer-facing sizing summary,
// the full assessment report, and the internal engineering brief.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportAppliance = { name?: string; qty?: number; watts?: number; hours?: number; wh?: number };

export type ReportSpec = { label: string; value: string };

export type ReportData = {
  reference: string;
  customer: { full_name?: string | null; email?: string | null; phone?: string | null; location?: string | null };
  createdAt?: string | null;
  appliances: ReportAppliance[];
  summary: ReportSpec[];
  system: ReportSpec[];
  /** Optional extra grouped sections (engineering detail, BOM notes, etc.) */
  sections?: { title: string; rows: ReportSpec[] }[];
  billOfMaterials?: { item: string; qty: number | string; notes?: string }[];
  engineerSummary?: string | null;
  internalNotes?: string | null;
  /** Internal briefs carry ownership + pipeline info and a confidential watermark line. */
  internal?: boolean;
};

const GREEN: [number, number, number] = [21, 128, 61];
const NAVY: [number, number, number] = [10, 25, 47];

const applianceWh = (a: ReportAppliance) =>
  Number(a.wh ?? (Number(a.watts) || 0) * (Number(a.qty) || 1) * (Number(a.hours) || 0));

export function buildReportPdf(data: ReportData): jsPDF {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  let y = 0;

  // Header band
  doc.setFillColor(...(data.internal ? NAVY : GREEN));
  doc.rect(0, 0, pageW, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Tioga Technologies", 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(data.internal ? "Internal Engineering Brief" : "Solar System Report", 14, 19);
  doc.setFontSize(9);
  doc.text(`Ref ${data.reference}`, pageW - 14, 12, { align: "right" });
  doc.text(new Date(data.createdAt || Date.now()).toLocaleDateString(), pageW - 14, 19, { align: "right" });
  doc.setTextColor(0, 0, 0);
  y = 34;

  const heading = (title: string) => {
    if (y > 255) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...GREEN);
    doc.text(title, 14, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 5;
  };

  const table = (body: (string | number)[][], head?: string[]) => {
    autoTable(doc, {
      startY: y,
      head: head ? [head] : undefined,
      body,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: GREEN, textColor: 255 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  };

  // Customer
  heading("Prepared for");
  table([
    ["Name", data.customer.full_name || "—"],
    ["Email", data.customer.email || "—"],
    ["Phone", data.customer.phone || "—"],
    ["Location", data.customer.location || "—"],
  ]);

  // Load summary
  if (data.summary.length) {
    heading("Energy summary");
    table(data.summary.map((s) => [s.label, s.value]));
  }

  // Appliances
  if (data.appliances?.length) {
    heading("Appliance load profile");
    table(
      data.appliances.map((a) => [
        a.name || "Appliance",
        String(a.qty ?? 1),
        `${Math.round(Number(a.watts) || 0)} W`,
        `${Number(a.hours) || 0} h`,
        `${applianceWh(a).toFixed(0)} Wh`,
      ]),
      ["Appliance", "Qty", "Rating", "Hrs/day", "Daily energy"],
    );
  }

  // Recommended system
  if (data.system.length) {
    heading("Recommended system");
    table(data.system.map((s) => [s.label, s.value]));
  }

  for (const section of data.sections || []) {
    if (!section.rows.length) continue;
    heading(section.title);
    table(section.rows.map((r) => [r.label, r.value]));
  }

  if (data.billOfMaterials?.length) {
    heading("Bill of materials");
    table(
      data.billOfMaterials.map((b) => [b.item, String(b.qty ?? ""), b.notes || ""]),
      ["Item", "Qty", "Notes"],
    );
  }

  const paragraph = (title: string, text: string) => {
    heading(title);
    const lines = doc.splitTextToSize(text, pageW - 28);
    if (y + lines.length * 5 > 280) { doc.addPage(); y = 20; }
    doc.text(lines, 14, y);
    y += lines.length * 5 + 6;
  };

  if (data.engineerSummary) paragraph("Engineer summary", data.engineerSummary);
  if (data.internal && data.internalNotes) paragraph("Internal notes", data.internalNotes);

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text(
      data.internal
        ? "Tioga Technologies — internal use only. Do not share with customers."
        : "Tioga Technologies · tiogatechnologies.com · Estimates are indicative pending a site survey.",
      14,
      289,
    );
    doc.text(`${p} / ${pages}`, pageW - 14, 289, { align: "right" });
  }

  return doc;
}

export function downloadReportPdf(data: ReportData, filename: string) {
  buildReportPdf(data).save(filename);
}

export function whatsappShareUrl(message: string, phone?: string) {
  const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}
