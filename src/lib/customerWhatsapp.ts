/**
 * Nigerian customers almost always enter phone numbers in local format
 * ("0801 234 5678"), but wa.me links need the full international number with
 * no leading 0. Several admin pages built wa.me links straight from the raw
 * digits, which silently produced a dead link for any locally-formatted
 * number - this is the one place that conversion happens.
 */
export function internationalDigits(phone: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = "234" + digits.slice(1);
  else if (digits.length === 10) digits = "234" + digits;
  return digits;
}

/** Storage format for customer numbers: "+2348031234567", or "" when empty. */
export function toNigerianE164(phone: string): string {
  const digits = internationalDigits(phone);
  return digits ? `+${digits}` : "";
}

/** True for a Nigerian mobile/landline number: +234 followed by 10 digits. */
export function isValidNigerianPhone(phone: string): boolean {
  return /^234\d{10}$/.test(internationalDigits(phone));
}

export function customerWhatsappLink(phone: string, text?: string): string {
  const base = `https://wa.me/${internationalDigits(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
