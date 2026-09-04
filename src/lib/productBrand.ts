/** Best-effort brand inference for products that don't have an explicit `brand` field. */
export function inferBrand(name: string, category: string | null | undefined): string {
  const n = name || "";
  if (n.includes("Deye")) return "Deye";
  if (n.includes("Felicity")) return "Felicity";
  if (n.includes("Longi")) return "Longi";
  if ((category || "").includes("Lock")) return "STAMA";
  return "Tioga";
}
