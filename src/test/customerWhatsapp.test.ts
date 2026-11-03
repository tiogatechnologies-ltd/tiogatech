import { describe, expect, it } from "vitest";
import { customerWhatsappLink, isValidNigerianPhone, toNigerianE164 } from "@/lib/customerWhatsapp";

describe("customer phone normalisation", () => {
  it("drops the leading 0 and adds +234", () => {
    expect(toNigerianE164("0803 123 4567")).toBe("+2348031234567");
    expect(customerWhatsappLink("08031234567")).toBe("https://wa.me/2348031234567");
  });

  it("accepts numbers typed without the 0 or already in international form", () => {
    expect(toNigerianE164("803 123 4567")).toBe("+2348031234567");
    expect(toNigerianE164("+234 803 123 4567")).toBe("+2348031234567");
    expect(toNigerianE164("2348031234567")).toBe("+2348031234567");
  });

  it("validates length", () => {
    expect(isValidNigerianPhone("0803123")).toBe(false);
    expect(isValidNigerianPhone("")).toBe(false);
    expect(isValidNigerianPhone("08031234567")).toBe(true);
  });
});
