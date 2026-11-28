import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdsLeadGateModal, {
  ADS_GATE_STORAGE_KEY,
  getUnlockedVisitorProfile,
} from "@/components/landing/AdsLeadGateModal";

describe("AdsLeadGateModal (/get-started quick lead popup)", () => {
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

  it("portals directly into document.body (outside RouteFade transforms) with 3 quick fields and WhatsApp option", () => {
    const onDismiss = vi.fn();
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
            onDismiss={onDismiss}
          />
        </div>
      </MemoryRouter>,
    );

    const dialog = screen.getByTestId("ads-lead-gate-modal");
    expect(dialog).toBeInTheDocument();
    expect(dialog.parentElement).toBe(document.body);
    expect(container.querySelector('[data-testid="ads-lead-gate-modal"]')).toBeNull();

    // Streamlined 4 fields (Name, Phone, Email, City/State) + instant WhatsApp CTA + browse-first escape hatch
    expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/WhatsApp \/ Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City \/ State/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue & See Prices/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Chat Instantly on WhatsApp/i })).toHaveAttribute(
      "href",
      expect.stringContaining("https://wa.me/2348178000023"),
    );

    fireEvent.click(screen.getByRole("button", { name: /Just browsing\? View packages first/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
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
        services: ["solar"],
        preferredContact: "WhatsApp",
        submittedAt: new Date().toISOString(),
      }),
    );
    const profile = getUnlockedVisitorProfile();
    expect(profile?.fullName).toBe("Chidi Okafor");
  });
});
