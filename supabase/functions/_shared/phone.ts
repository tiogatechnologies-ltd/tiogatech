/**
 * Customers type Nigerian numbers locally ("0803 123 4567"), but wa.me links
 * need the full international number with no leading 0 or +. Returns digits
 * only, or "" when there is nothing usable.
 */
export function toInternationalDigits(phone: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = "234" + digits.slice(1);
  else if (digits.length === 10) digits = "234" + digits;
  return digits;
}
