import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ScrollToTopButton from "@/components/ScrollToTopButton";

describe("ScrollToTopButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true,
    });
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <ScrollToTopButton />
      </BrowserRouter>
    );

  const simulateScroll = (newY: number) => {
    act(() => {
      window.scrollY = newY;
      window.dispatchEvent(new Event("scroll"));
    });
  };

  it("is hidden by default when at top of page", () => {
    renderComponent();
    const btn = screen.getByRole("button", { name: /scroll back to top/i });
    expect(btn.className).toContain("opacity-0");
    expect(btn.className).toContain("pointer-events-none");
  });

  it("stays hidden while scrolling down past the threshold", () => {
    renderComponent();
    const btn = screen.getByRole("button", { name: /scroll back to top/i });

    // Scroll down to 400px
    simulateScroll(400);
    expect(btn.className).toContain("opacity-0");

    // Scroll further down to 800px
    simulateScroll(800);
    expect(btn.className).toContain("opacity-0");
  });

  it("becomes visible ONLY when user scrolls back up past the threshold", () => {
    renderComponent();
    const btn = screen.getByRole("button", { name: /scroll back to top/i });

    // Scroll down to 1000px
    simulateScroll(1000);
    expect(btn.className).toContain("opacity-0");

    // Scroll back up to 900px (intentional upward delta of 100px)
    simulateScroll(900);
    expect(btn.className).toContain("opacity-100");
    expect(btn.className).toContain("pointer-events-auto");
  });

  it("disappears when user is stagnant (stopped scrolling for 2 seconds)", () => {
    renderComponent();
    const btn = screen.getByRole("button", { name: /scroll back to top/i });

    // Scroll down then up
    simulateScroll(1200);
    simulateScroll(1100);
    expect(btn.className).toContain("opacity-100");

    // Stagnant: fast-forward 1.5s -> still visible
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(btn.className).toContain("opacity-100");

    // Stagnant: advance past 2s total -> disappears
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(btn.className).toContain("opacity-0");
  });

  it("disappears immediately when user begins scrolling down again", () => {
    renderComponent();
    const btn = screen.getByRole("button", { name: /scroll back to top/i });

    // Scroll down to 1000 then up to 900 -> visible
    simulateScroll(1000);
    simulateScroll(900);
    expect(btn.className).toContain("opacity-100");

    // Now scroll down to 950 -> disappears immediately
    simulateScroll(950);
    expect(btn.className).toContain("opacity-0");
  });

  it("disappears when scroll position returns near the top (< 300px)", () => {
    renderComponent();
    const btn = screen.getByRole("button", { name: /scroll back to top/i });

    simulateScroll(800);
    simulateScroll(700);
    expect(btn.className).toContain("opacity-100");

    // Scrolled all the way back up to 200px
    simulateScroll(200);
    expect(btn.className).toContain("opacity-0");
  });

  it("scrolls smoothly to top and hides immediately when clicked", () => {
    renderComponent();
    const btn = screen.getByRole("button", { name: /scroll back to top/i });

    simulateScroll(1000);
    simulateScroll(800);
    expect(btn.className).toContain("opacity-100");

    act(() => {
      fireEvent.click(btn);
    });

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(btn.className).toContain("opacity-0");
  });
});
