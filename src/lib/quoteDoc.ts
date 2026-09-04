// Maps a `quotes` row into the branded ReportData document model.
import type { ReportData } from "@/lib/reportPdf";

export type QuoteLineItem = { item: string; qty?: number | string; unit?: number; total?: number; note?: string };
export type QuoteSection = { title: string; items: QuoteLineItem[] };

export const ngn = (n: number | null | undefined) =>
  n === null || n === undefined || Number.isNaN(Number(n)) ? "-" : `NGN ${Number(n).toLocaleString("en-NG")}`;

export const sectionTotal = (s: QuoteSection) =>
  (s.items || []).reduce((sum, i) => sum + (Number(i.total) || (Number(i.unit) || 0) * (Number(i.qty) || 0)), 0);

export const quoteTotals = (sections: QuoteSection[], discount = 0) => {
  const subtotal = (sections || []).reduce((sum, s) => sum + sectionTotal(s), 0);
  return { subtotal, total: Math.max(0, subtotal - (Number(discount) || 0)) };
};

export const PAY_TO = {
  name: "Tioga Technologies Ltd",
  account: "1234567890",
  bank: "ZENITH BANK",
};

export function quoteToReport(row: any): ReportData {
  const sections: QuoteSection[] = Array.isArray(row.sections) ? row.sections : [];
  const { subtotal, total } = quoteTotals(sections, row.discount);

  return {
    reference: row.quote_number,
    documentLabel: `Quotation${row.version > 1 ? ` v${row.version}` : ""}`,
    title: row.title || "Solar System Quotation",
    subtitle: row.subtitle || undefined,
    createdAt: row.created_at,
    customer: {
      full_name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      location: row.customer_location,
    },
    meta: [
      { label: "Date", value: new Date(row.created_at || Date.now()).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) },
      { label: "Client", value: row.customer_name || "-" },
      { label: "Scope", value: row.scope || "Supply and installation" },
    ],
    callout: row.intro || undefined,
    payTo: PAY_TO,
    lineItemSections: sections.map((s) => ({
      title: s.title,
      items: (s.items || []).map((i) => ({
        item: i.item,
        qty: i.qty ?? 1,
        unit: Number(i.unit) || 0,
        total: Number(i.total) || (Number(i.unit) || 0) * (Number(i.qty) || 0),
        note: i.note,
      })),
      total: sectionTotal(s),
    })),
    optionsTable: row.options_table || undefined,
    grandTotal: {
      label: Number(row.discount) > 0 ? `Total after ${ngn(row.discount)} discount` : "Estimated total",
      value: ngn(row.total ?? total),
    },
    notes: [
      ...(Array.isArray(row.notes) ? row.notes : []),
      row.deposit_pct ? `${row.deposit_pct}% deposit to commence, balance on completion.` : "",
    ].filter(Boolean),
    exclusions: row.exclusions || undefined,
    validity: row.valid_until
      ? `Quotation valid until ${new Date(row.valid_until).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}.`
      : "Quotation valid for 7 days from date of issue.",
    appliances: [],
    summary: [],
    system: [],
    hideDefaultSections: true,
  };
}

export const emptySection = (): QuoteSection => ({ title: "New section", items: [{ item: "", qty: 1, unit: 0 }] });

export const subtotalOf = (sections: QuoteSection[]) => quoteTotals(sections).subtotal;
