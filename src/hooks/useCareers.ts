import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeDeep } from "@/lib/normalizeText";
import type { Job } from "@/components/JobCard";
import bgInstaller from "@/assets/bg-installer.jpg";
import bgRooftopInstall from "@/assets/bg-rooftop-install.jpg";
import bgOffice from "@/assets/bg-office.jpg";
import bgTeamMeeting from "@/assets/bg-team-meeting.jpg";
import bgFluidWave from "@/assets/bg-fluid-wave.jpg";

const JOB_BACKGROUNDS = [bgFluidWave, bgInstaller, bgRooftopInstall, bgOffice, bgTeamMeeting];

export const FEATURED_GRAPHICS_DESIGNER_JOB: Job = {
  title: "Graphics Designer (Full-Time, Remote)",
  location: "Remote",
  summary:
    "We are seeking a creative Full-Time Remote Graphics Designer to craft compelling visual campaigns, social media creatives, product flyers, and brand collateral for Tioga Technologies' solar energy, smart security, and home automation lines.",
  highlights: [
    "Full-time, 100% Remote role at Tioga Technologies",
    "Design high-converting social media graphics, product promos & brand assets",
    "2+ years experience in Adobe Photoshop, Illustrator, Figma or CorelDRAW",
  ],
  requirements:
    "Proven Graphic Design experience with a strong portfolio (Behance, Dribbble, or PDF). Strong mastery of typography, layout hierarchy, and product visual storytelling.",
  emailSubject: "Application - Graphics Designer (Full-Time Remote)",
  backgroundImage: bgFluidWave,
};

export const FALLBACK_JOBS: Job[] = [
  FEATURED_GRAPHICS_DESIGNER_JOB,
  {
    title: "Call for Partnership - Nationwide Installers",
    location: "Nationwide, Nigeria",
    summary:
      "Inviting credible solar installers across Nigeria to partner with Tioga and deploy advanced energy solutions, integrated inverters and lithium battery systems, that reduce grid dependence.",
    highlights: ["Attractive commission structure", "Reduce client grid dependence", "Access to premium hardware stack"],
    requirements: "Graduate (B.Sc / HND) with valid technical certifications and a proven installation track record.",
    emailSubject: "Application - Partnership (Nationwide Installer)",
    backgroundImage: bgInstaller,
  },
  {
    title: "Engineering Force - Project Engineers & Solar Installers",
    location: "Lagos | Abuja | Jos",
    summary: "Contract-based roles for engineers who can design, install and commission PV and ESS storage systems at scale.",
    highlights: [
      "2 to 5 years in Renewable Energy or Electrical Engineering",
      "PV, ESS Storage and commissioning experience",
      "Field-ready, safety-first mindset",
    ],
    requirements: "HND / B.Eng in Electrical Engineering or related field. COREN / NSE certification is an advantage.",
    emailSubject: "Application - Project Engineer / Solar Installer",
    backgroundImage: bgRooftopInstall,
  },
  {
    title: "Admin / Sales Representative",
    location: "Jos",
    summary: "Front-line role supporting customers, coordinating quotes and keeping the Jos office running smoothly.",
    highlights: [
      "1 to 3 years in Admin or Sales",
      "Strong multitasking and customer service skills",
      "Comfortable with CRM and basic reporting",
    ],
    requirements: "Minimum OND / HND / B.Sc in any related discipline.",
    emailSubject: "Application - Admin/Sales Representative (Jos)",
    backgroundImage: bgOffice,
  },
  {
    title: "Business Development Manager",
    location: "Abuja | Jos",
    summary:
      "Drive strategic growth across enterprise, SME and residential segments. Own pipeline, partnerships and regional expansion.",
    highlights: [
      "3 to 6 years in business development",
      "Strategic growth and partnership focus",
      "Renewable Energy background is an advantage",
    ],
    requirements: "Bachelor's degree in Business, Engineering or a related field.",
    emailSubject: "Application - Business Development Manager",
    backgroundImage: bgTeamMeeting,
  },
];

// Only advertise roles returned by the database. Never resurrect closed roles on error.
export const useCareers = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("careers")
          .select("id, title, location, summary, highlights, requirements, email_subject, deadline")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (!active) return;
        if (error || !data) {
          setJobs([]);
          setErrorMessage("We could not load open roles. Please try again shortly or email our careers team.");
        } else {
          setJobs(
            normalizeDeep(data).map((d: any, index: number) => ({
              id: d.id,
              title: d.title,
              location: d.location,
              summary: d.summary,
              highlights: d.highlights || [],
              requirements: d.requirements,
              emailSubject: d.email_subject,
              deadline: d.deadline,
              backgroundImage: JOB_BACKGROUNDS[(index + 1) % JOB_BACKGROUNDS.length],
            })),
          );
        }
      } catch {
        if (active) {
          setJobs([]);
          setErrorMessage("We could not load open roles. Please try again shortly or email our careers team.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { jobs, loading, error: errorMessage };
};
