import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdsLeadGateModal, {
  ADS_GATE_STORAGE_KEY,
  getUnlockedVisitorProfile,
} from "@/components/landing/AdsLeadGateModal";

vi.mock("@/hooks/useSiteSetting", () => ({
  useSiteSetting: () => ({
    settings: { flexible_payment_enabled: true },
    loading: false,
  }),
}));

describe("AdsLeadGateModal (/get-started mandatory popup)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("ignores legacy localStorage unlock key so returning visitors see the popup on new visits", () => {
    localStorage.setItem(
      "tioga_ads_lp_unlocked_v1",
      JSON.stringify({ unlocked: true, fullName: "Old Tester" }),
    );
    expect(getUnlockedVisitorProfile()).toBeNull();
    expect(localStorage.getItem("tioga_ads_lp_unlocked_v1")).toBeNull();
  });

  it("portals directly into document.body (outside RouteFade transforms) and renders form fields immediately", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/get-started"]}>
        <div style={{ transform: "translateY(12px)" }}>
          <AdsLeadGateModal
            open={true}
            campaignSlug="general"
            campaignHeadline="Power, protect and automate your home or business."
            pathname="/get-started"
            defaultServices={["audit"]}
            onUnlocked={vi.fn()}
          />
        </div>
      </MemoryRouter>,
    );

    const dialog = screen.getByTestId("ads-lead-gate-modal");
    expect(dialog).toBeInTheDocument();
    // Portaled directly into document.body, NOT trapped inside the transformed ancestor
    expect(dialog.parentElement).toBe(document.body);
    expect(container.querySelector('[data-testid="ads-lead-gate-modal"]')).toBeNull();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone \/ WhatsApp Number/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue & Get My Free Quote/i })).toBeInTheDocument();
  });

  it("persists unlock within the same tab session via sessionStorage", () => {
    sessionStorage.setItem(
      ADS_GATE_STORAGE_KEY,
      JSON.stringify({
        unlocked: true,
        fullName: "Chidi Okafor",
        phone: "+2348031234567",
        email: "",
        location: "Abuja",
        propertyType: "Flat",
        services: ["audit"],
        preferredContact: "WhatsApp",
        submittedAt: new Date().toISOString(),
      }),
    );
    const profile = getUnlockedVisitorProfile();
    expect(profile?.fullName).toBe("Chidi Okafor");
  });
});
