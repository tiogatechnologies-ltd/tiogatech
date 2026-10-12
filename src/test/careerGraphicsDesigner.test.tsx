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
});
