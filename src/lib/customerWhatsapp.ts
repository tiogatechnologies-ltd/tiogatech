/**
 * Nigerian customers almost always enter phone numbers in local format
 * ("0801 234 5678"), but wa.me links need the full international number with
 * no leading 0. Several admin pages built wa.me links straight from the raw
 * digits, which silently produced a dead link for any locally-formatted
 * number - this is the one place that conversion happens.
 */
export function customerWhatsappLink(phone: string, text?: string): string {
  const digits = (phone || "").replace(/\D/g, "").replace(/^0/, "234");
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
