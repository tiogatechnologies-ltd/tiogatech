import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FEATURED_GRAPHICS_DESIGNER_JOB, FALLBACK_JOBS } from "@/hooks/useCareers";
import JobCard from "@/components/JobCard";

describe("Career Page - Full-Time Remote Graphics Designer Role", () => {
  it("defines FEATURED_GRAPHICS_DESIGNER_JOB with clean job card fields", () => {
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.title).toBe("Graphics Designer (Full-Time, Remote)");
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.location).toBe("Remote");
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.highlights.length).toBeGreaterThanOrEqual(3);
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.requirements).toBeTruthy();
  });

  it("includes Graphics Designer as the first featured role in FALLBACK_JOBS", () => {
    expect(FALLBACK_JOBS.length).toBeGreaterThanOrEqual(5);
    expect(FALLBACK_JOBS[0].title).toBe("Graphics Designer (Full-Time, Remote)");
    expect(FALLBACK_JOBS[0].location).toBe("Remote");
  });

  it("renders JobCard with standard clean layout and no LinkedIn text or extra pills", () => {
    const onApply = vi.fn();
    render(<JobCard job={FEATURED_GRAPHICS_DESIGNER_JOB} index={0} onApply={onApply} />);

    expect(screen.getByText("Graphics Designer (Full-Time, Remote)")).toBeInTheDocument();
    expect(screen.getByText("Remote")).toBeInTheDocument();
    expect(screen.getByText("Now Hiring")).toBeInTheDocument();
    expect(screen.queryByText(/Easy Apply/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/LinkedIn/i)).not.toBeInTheDocument();

    const applyBtn = screen.getByRole("button", { name: /Quick Apply/i });
    fireEvent.click(applyBtn);
    expect(onApply).toHaveBeenCalledWith(FEATURED_GRAPHICS_DESIGNER_JOB);
  });

  it("never matches light-surface icons with the dark-surface white icon selector when PageHero/SiteFooter are siblings", () => {
    const container = document.createElement("div");
    container.className = "min-h-screen flex flex-col";
    container.innerHTML = `
      <header class="bg-background/80"><button class="bg-background/80 text-foreground"><svg id="nav-cart" class="lucide"></svg></button></header>
      <section class="bg-secondary"><a class="text-white"><svg id="hero-icon" class="lucide"></svg></a></section>
      <section class="section-padding">
        <div class="relative"><div class="bg-midnight/70"></div><div class="text-primary-foreground"><svg id="why-tioga-icon" class="lucide text-white"></svg></div></div>
      </section>
      <section class="section-padding bg-muted">
        <div class="bg-card"><svg id="how-we-work-icon" class="lucide text-muted-foreground"></svg></div>
      </section>
      <section class="section-padding">
        <div class="bg-card"><svg id="teams-we-hire-icon" class="lucide text-muted-foreground"></svg></div>
      </section>
      <footer class="bg-midnight text-primary-foreground"><svg id="footer-icon" class="lucide"></svg></footer>
    `;
    document.body.appendChild(container);

    const darkSurfaceSelector =
      `:is(.dark, footer, .bg-midnight, .bg-secondary, .bg-slate-900, .bg-slate-950, .bg-black, .text-white, .text-primary-foreground, .text-secondary-foreground) svg.lucide, svg.lucide:is(.text-white, .text-primary-foreground, .text-secondary-foreground)`;

    expect(container.querySelector("#nav-cart")!.matches(darkSurfaceSelector)).toBe(false);
    expect(container.querySelector("#how-we-work-icon")!.matches(darkSurfaceSelector)).toBe(false);
    expect(container.querySelector("#teams-we-hire-icon")!.matches(darkSurfaceSelector)).toBe(false);

    expect(container.querySelector("#hero-icon")!.matches(darkSurfaceSelector)).toBe(true);
    expect(container.querySelector("#why-tioga-icon")!.matches(darkSurfaceSelector)).toBe(true);
    expect(container.querySelector("#footer-icon")!.matches(darkSurfaceSelector)).toBe(true);

    document.body.removeChild(container);
  });
});

