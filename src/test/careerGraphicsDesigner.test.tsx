import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FEATURED_GRAPHICS_DESIGNER_JOB, FALLBACK_JOBS } from "@/hooks/useCareers";
import JobCard from "@/components/JobCard";

describe("Career Page - Full-Time Remote Graphics Designer Role (LinkedIn Style)", () => {
  it("defines FEATURED_GRAPHICS_DESIGNER_JOB with full LinkedIn-style attributes", () => {
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.title).toBe("Graphics Designer");
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.company).toBe("Tioga Technologies");
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.workplaceType).toBe("Remote");
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.employmentType).toBe("Full-time");
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.location).toContain("Remote");
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.activelyRecruiting).toBe(true);
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.easyApply).toBe(true);
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.responsibilities?.length).toBeGreaterThanOrEqual(5);
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.qualifications?.length).toBeGreaterThanOrEqual(4);
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.benefits?.length).toBeGreaterThanOrEqual(3);
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.skills).toContain("Adobe Photoshop");
    expect(FEATURED_GRAPHICS_DESIGNER_JOB.skills).toContain("Figma");
  });

  it("includes Graphics Designer as the first featured role in FALLBACK_JOBS", () => {
    expect(FALLBACK_JOBS.length).toBeGreaterThanOrEqual(5);
    expect(FALLBACK_JOBS[0].title).toBe("Graphics Designer");
    expect(FALLBACK_JOBS[0].workplaceType).toBe("Remote");
    expect(FALLBACK_JOBS[0].employmentType).toBe("Full-time");
  });

  it("renders JobCard with LinkedIn-style badges, skills, Easy Apply CTA, and opens full Job Details dialog", () => {
    const onApply = vi.fn();
    render(<JobCard job={FEATURED_GRAPHICS_DESIGNER_JOB} index={0} onApply={onApply} />);

    expect(screen.getByText("Graphics Designer")).toBeInTheDocument();
    expect(screen.getByText("Tioga Technologies")).toBeInTheDocument();
    expect(screen.getByText("Remote")).toBeInTheDocument();
    expect(screen.getByText("Full-time")).toBeInTheDocument();
    expect(screen.getByText("Actively Recruiting")).toBeInTheDocument();
    expect(screen.getByText("Adobe Photoshop")).toBeInTheDocument();

    // Easy Apply button triggers onApply callback
    const easyApplyBtns = screen.getAllByText(/Easy Apply/i);
    fireEvent.click(easyApplyBtns[easyApplyBtns.length - 1]);
    expect(onApply).toHaveBeenCalledWith(FEATURED_GRAPHICS_DESIGNER_JOB);

    // Job Details button opens LinkedIn-style modal with About the job, Responsibilities & Benefits
    const detailsBtn = screen.getByRole("button", { name: /Job Details/i });
    fireEvent.click(detailsBtn);
    expect(screen.getByText("About the job")).toBeInTheDocument();
    expect(screen.getByText(/What You’ll Do/i)).toBeInTheDocument();
    expect(screen.getByText(/Benefits & Perks/i)).toBeInTheDocument();
  });
});
