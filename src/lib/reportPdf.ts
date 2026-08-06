// Shared branded document renderer (block based) used by customer sizing reports,
// internal engineering briefs, quotations, invoices and receipts.
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportAppliance = { name?: string; qty?: number; watts?: number; hours?: number; wh?: number };

export type ReportSpec = { label: string; value: string };

export type LineItem = { item: string; qty?: number | string; unit?: number | string; total?: number | string; note?: string };

export type LineItemSection = {
  title: string;
  /** Optional shaded intro paragraph shown above the table. */
  intro?: string;
  items: LineItem[];
  /** Label + amount for the section total row. */
  totalLabel?: string;
  total?: number | string;
  /** Column headings override, defaults to Item / Qty / Unit price / Total. */
  head?: string[];
};

export type OptionsTable = {
  title: string;
  intro?: string;
  /** Column headings after the first "Component" column. */
  columns: string[];
  rows: { label: string; values: (string | number)[] }[];
};

export type BulletColumns = { title: string; items: string[] }[];

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

  // ---- Branded document extras (quotations, invoices, receipts) ----
  /** Document kind shown in the masthead pill. Defaults based on `internal`. */
  documentLabel?: string;
  /** Big centred title under the masthead. */
  title?: string;
  /** One-line spec summary under the title. */
  subtitle?: string;
  /** Date / Client / Scope style meta table. */
  meta?: ReportSpec[];
  /** Shaded callout paragraph with a left accent bar. */
  callout?: string;
  /** Payment strip: company / account / bank. */
  payTo?: { name: string; account: string; bank: string };
  /** Two-column bullet blocks. */
  bulletColumns?: BulletColumns;
  /** Priced sections with totals rows. */
  lineItemSections?: LineItemSection[];
  /** Side-by-side option comparison. */
  optionsTable?: OptionsTable;
  /** Grand total row rendered as a highlighted band. */
  grandTotal?: { label: string; value: string };
  notes?: string[];
  exclusions?: string;
  /** Footer validity note, e.g. "Quote valid for 7 days from 6 Aug 2026." */
  validity?: string;
  /** Suppress the default report blocks (energy summary, appliances, system). */
  hideDefaultSections?: boolean;
};

const GREEN: [number, number, number] = [21, 128, 61];
const NAVY: [number, number, number] = [10, 25, 47];
const GOLD: [number, number, number] = [214, 168, 0];
const LIGHT: [number, number, number] = [244, 247, 245];

const applianceWh = (a: ReportAppliance) =>
  Number(a.wh ?? (Number(a.watts) || 0) * (Number(a.qty) || 1) * (Number(a.hours) || 0));

const money = (v: number | string | undefined) => {
  if (v === undefined || v === null || v === "") return "";
  const num = typeof v === "number" ? v : Number(String(v).replace(/[^\d.-]/g, ""));
  if (Number.isNaN(num)) return String(v);
  return num.toLocaleString("en-NG", { maximumFractionDigits: 0 });
};

export function buildReportPdf(data: ReportData): jsPDF {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const M = 14;
  const W = pageW - M * 2;
  const accent = data.internal ? NAVY : GREEN;
  let y = 0;

  const space = (needed: number) => {
    if (y + needed > 278) {
      doc.addPage();
      y = 20;
    }
  };

  // ---------------- Masthead ----------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...NAVY);
  doc.text("TIOGA", M, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text("Tioga Technologies Ltd  |  Solar, Power & Smart Home", M, 26);
  doc.text("tiogatechnologies.com  |  Abuja  ·  Jos", M, 31);

  const pill = data.documentLabel || (data.internal ? "Internal Engineering Brief" : "Solar System Report");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  const pw = doc.getTextWidth(pill) + 12;
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageW - M - pw, 13, pw, 11, 5.5, 5.5, "S");
  doc.setTextColor(...accent);
  doc.text(pill, pageW - M - pw / 2, 20, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Ref ${data.reference}`, pageW - M, 30, { align: "right" });

  doc.setDrawColor(...NAVY);
  doc.setLineWidth(1);
  doc.line(M, 35, pageW - M, 35);
  doc.setTextColor(0);
  y = 43;

  // ---------------- Payment strip ----------------
  if (data.payTo) {
    doc.setDrawColor(220);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y, W, 13, 3, 3, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text(data.payTo.name, M + 5, y + 8.5);
    doc.setFont("courier", "normal");
    doc.text(data.payTo.account, M + W / 2, y + 8.5, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(data.payTo.bank, pageW - M - 5, y + 8.5, { align: "right" });
    doc.setTextColor(0);
    y += 20;
  }

  // ---------------- Title ----------------
  if (data.title) {
    space(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.setTextColor(...NAVY);
    doc.text(data.title, pageW / 2, y + 6, { align: "center", maxWidth: W });
    y += 12;
    if (data.subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(110);
      doc.text(data.subtitle, pageW / 2, y + 4, { align: "center", maxWidth: W });
      y += 10;
    }
    doc.setTextColor(0);
    y += 2;
  }

  const heading = (title: string) => {
    space(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...NAVY);
    doc.text(title, M, y);
    doc.setDrawColor(225);
    doc.setLineWidth(0.4);
    doc.line(M, y + 2, pageW - M, y + 2);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 7;
  };

  const table = (
    body: (string | number)[][],
    head?: string[],
    opts: { align?: ("left" | "right" | "center")[]; boldLast?: boolean; widths?: number[] } = {},
  ) => {
    const columnStyles: any = {};
    (opts.align || []).forEach((a, i) => {
      columnStyles[i] = { ...(columnStyles[i] || {}), halign: a };
    });
    (opts.widths || []).forEach((w, i) => {
      if (w) columnStyles[i] = { ...(columnStyles[i] || {}), cellWidth: w };
    });
    autoTable(doc, {
      startY: y,
      head: head ? [head] : undefined,
      body,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.6, lineColor: [225, 228, 226], textColor: [30, 30, 30] },
      headStyles: { fillColor: LIGHT, textColor: NAVY, fontStyle: "bold", lineColor: [210, 214, 211] },
      alternateRowStyles: { fillColor: [252, 253, 252] },
      columnStyles,
      margin: { left: M, right: M },
      didParseCell: (h: any) => {
        if (opts.boldLast && h.section === "body" && h.row.index === body.length - 1) {
          h.cell.styles.fontStyle = "bold";
          h.cell.styles.fillColor = LIGHT;
          h.cell.styles.textColor = NAVY;
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  };

  const callout = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(text, W - 12);
    const h = lines.length * 4.8 + 8;
    space(h + 4);
    doc.setFillColor(...LIGHT);
    doc.rect(M, y, W, h, "F");
    doc.setFillColor(...accent);
    doc.rect(M, y, 1.6, h, "F");
    doc.setTextColor(45);
    doc.text(lines, M + 7, y + 6);
    doc.setTextColor(0);
    y += h + 8;
  };

  // ---------------- Meta / customer ----------------
  if (data.meta?.length) {
    table(
      data.meta.map((m) => [m.label, m.value]),
      undefined,
      { widths: [45] },
    );
  }

  heading(data.internal ? "Client details" : "Prepared for");
  table(
    [
      ["Name", data.customer.full_name || "—"],
      ["Email", data.customer.email || "—"],
      ["Phone", data.customer.phone || "—"],
      ["Location", data.customer.location || "—"],
    ],
    undefined,
    { widths: [45] },
  );

  if (data.callout) callout(data.callout);

  // ---------------- Bullet columns ----------------
  if (data.bulletColumns?.length) {
    const colW = (W - 6) / data.bulletColumns.length;
    doc.setFontSize(9.5);
    const blocks = data.bulletColumns.map((c) => {
      const wrapped = c.items.map((i) => doc.splitTextToSize(`•  ${i}`, colW - 4));
      return { title: c.title, wrapped, lines: wrapped.reduce((s, w) => s + w.length, 0) };
    });
    const h = Math.max(...blocks.map((b) => b.lines * 4.6 + b.wrapped.length * 1.6)) + 8;
    space(h + 4);
    const top = y;
    blocks.forEach((b, i) => {
      const x = M + i * (colW + 6);
      let by = top;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...NAVY);
      doc.text(b.title, x, by);
      by += 5.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(50);
      b.wrapped.forEach((w) => {
        doc.text(w, x, by);
        by += w.length * 4.6 + 1.6;
      });
    });
    doc.setTextColor(0);
    y = top + h;
  }

  // ---------------- Priced sections ----------------
  for (const s of data.lineItemSections || []) {
    heading(s.title);
    if (s.intro) callout(s.intro);
    const head = s.head || ["ITEM", "QTY", "UNIT PRICE (NGN)", "TOTAL (NGN)"];
    const body: (string | number)[][] = s.items.map((it) => [
      it.note ? `${it.item}\n${it.note}` : it.item,
      it.qty ?? "",
      money(it.unit),
      money(it.total),
    ]);
    if (s.total !== undefined) body.push([s.totalLabel || `${s.title} total`, "", "", `NGN ${money(s.total)}`]);
    table(body, head, {
      align: ["left", "center", "right", "right"],
      boldLast: s.total !== undefined,
      widths: [84, 16, 36, 36],
    });
  }

  // ---------------- Options comparison ----------------
  if (data.optionsTable) {
    heading(data.optionsTable.title);
    if (data.optionsTable.intro) callout(data.optionsTable.intro);
    table(
      data.optionsTable.rows.map((r) => [r.label, ...r.values.map((v) => money(v))]),
      ["COMPONENT", ...data.optionsTable.columns],
      { align: ["left", ...data.optionsTable.columns.map(() => "right" as const)], boldLast: true },
    );
  }

  if (data.grandTotal) {
    space(16);
    doc.setFillColor(...accent);
    doc.rect(M, y, W, 12, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(data.grandTotal.label, M + 5, y + 8);
    doc.text(data.grandTotal.value, pageW - M - 5, y + 8, { align: "right" });
    doc.setTextColor(0);
    y += 20;
  }

  // ---------------- Standard report blocks ----------------
  if (!data.hideDefaultSections) {
    if (data.summary?.length) {
      heading("Energy summary");
      table(data.summary.map((s) => [s.label, s.value]), undefined, { widths: [70] });
    }

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
        ["APPLIANCE", "QTY", "RATING", "HRS/DAY", "DAILY ENERGY"],
        { align: ["left", "center", "right", "right", "right"] },
      );
    }

    if (data.system?.length) {
      heading("Recommended system");
      table(data.system.map((s) => [s.label, s.value]), undefined, { widths: [70] });
    }
  }

  for (const section of data.sections || []) {
    if (!section.rows.length) continue;
    heading(section.title);
    table(section.rows.map((r) => [r.label, r.value]), undefined, { widths: [70] });
  }

  if (data.billOfMaterials?.length) {
    heading("Bill of materials");
    table(
      data.billOfMaterials.map((b) => [b.item, String(b.qty ?? ""), b.notes || ""]),
      ["ITEM", "QTY", "NOTES"],
      { align: ["left", "center", "left"] },
    );
  }

  const paragraph = (title: string, text: string) => {
    heading(title);
    const lines = doc.splitTextToSize(text, W);
    space(lines.length * 5 + 4);
    doc.setFontSize(9.5);
    doc.text(lines, M, y);
    y += lines.length * 5 + 8;
  };

  if (data.engineerSummary) paragraph("Engineer summary", data.engineerSummary);
  if (data.internal && data.internalNotes) paragraph("Internal notes", data.internalNotes);

  if (data.notes?.length) {
    heading("Notes");
    doc.setFontSize(9.5);
    for (const note of data.notes) {
      const lines = doc.splitTextToSize(`•  ${note}`, W - 2);
      space(lines.length * 4.8 + 2);
      doc.text(lines, M, y);
      y += lines.length * 4.8 + 2.5;
    }
    y += 5;
  }

  if (data.exclusions) paragraph("Excludes", data.exclusions);

  if (data.validity || data.payTo) {
    space(16);
    doc.setFillColor(...LIGHT);
    doc.rect(M, y, W, 12, "F");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    const left = data.payTo ? `Payment to: ${data.payTo.name}  |  ${data.payTo.account}  |  ${data.payTo.bank}` : "";
    if (left) doc.text(left, M + 4, y + 7.5);
    if (data.validity) doc.text(data.validity, pageW - M - 4, y + 7.5, { align: "right" });
    doc.setTextColor(0);
    y += 18;
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(230);
    doc.setLineWidth(0.4);
    doc.line(M, 284, pageW - M, 284);
    doc.setFontSize(7.5);
    doc.setTextColor(140);
    doc.text(
      data.internal
        ? "Tioga Technologies — internal use only. Do not share with customers."
        : "Tioga Technologies · tiogatechnologies.com · Estimates are indicative pending a site survey.",
      M,
      289,
    );
    doc.text(`${p} / ${pages}`, pageW - M, 289, { align: "right" });
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

export const TIOGA_PAY_TO = { name: "Tioga Technologies Ltd", account: "—", bank: "—" };
