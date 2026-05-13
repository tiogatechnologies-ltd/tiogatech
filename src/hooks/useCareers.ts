import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/components/JobCard";
import bgInstaller from "@/assets/bg-installer.jpg";
import bgRooftopInstall from "@/assets/bg-rooftop-install.jpg";
import bgOffice from "@/assets/bg-office.jpg";
import bgTeamMeeting from "@/assets/bg-team-meeting.jpg";

const JOB_BACKGROUNDS = [bgInstaller, bgRooftopInstall, bgOffice, bgTeamMeeting];

const FALLBACK: Job[] = [
  {
    title: "Call for Partnership — Nationwide Installers",
    location: "Nationwide, Nigeria",
    summary:
      "Inviting credible solar installers across Nigeria to partner with Tioga and deploy advanced energy solutions, integrated inverters and lithium battery systems, that reduce grid dependence.",
    highlights: ["Attractive commission structure", "Reduce client grid dependence", "Access to premium hardware stack"],
    requirements: "Graduate (B.Sc / HND) with valid technical certifications and a proven installation track record.",
    emailSubject: "Application - Partnership (Nationwide Installer)",
    backgroundImage: bgInstaller,
  },
  {
    title: "Engineering Force — Project Engineers & Solar Installers",
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

export const useCareers = () => {
  const [jobs, setJobs] = useState<Job[]>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("careers")
        .select("title, location, summary, highlights, requirements, email_subject, deadline")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (!active) return;
      if (!error && data && data.length > 0) {
        setJobs(
          data.map((d: any, index: number) => ({
            id: d.id,
            title: d.title,
            location: d.location,
            summary: d.summary,
            highlights: d.highlights || [],
            requirements: d.requirements,
            emailSubject: d.email_subject,
            deadline: d.deadline,
            backgroundImage: JOB_BACKGROUNDS[index % JOB_BACKGROUNDS.length],
          }))
        );
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { jobs, loading };
};
