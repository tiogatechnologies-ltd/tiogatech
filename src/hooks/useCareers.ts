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
  title: "Graphics Designer",
  company: "Tioga Technologies",
  location: "Nigeria (Remote)",
  workplaceType: "Remote",
  employmentType: "Full-time",
  experienceLevel: "Mid-Senior level · 2+ yrs",
  department: "Creative, Brand & Marketing",
  postedAt: "Actively hiring",
  applicantsText: "Be among the first applicants",
  activelyRecruiting: true,
  easyApply: true,
  summary:
    "Full-time remote Graphics Designer at Tioga Technologies. Lead visual storytelling across social media campaigns, solar & smart-home product launches, retail promos, and brand collateral.",
  aboutRole:
    "At Tioga Technologies, we are building Nigeria's leading clean energy, smart security, and home automation brand. As our Full-Time Remote Graphics Designer, you will work closely with our marketing, product, and executive teams to translate high-tech energy products—including hybrid inverters, LiFePO4 batteries, EcoFlow power stations, smart locks, and CCTV packages—into clean, high-converting visual assets across digital and print channels.",
  responsibilities: [
    "Design high-impact social media graphics, carousel posts, promotional banners, and ad creatives for Instagram, LinkedIn, Facebook, and X.",
    "Create clean, high-conversion product promotional flyers, dealer price list graphics, and hero visuals for solar inverters, lithium batteries, and smart home packages.",
    "Develop marketing brochures, pitch decks, company profiles, installation guides, and technical datasheets that maintain strict brand consistency.",
    "Retouch, cutout (HD transparent PNGs), and composite product photography for the Tioga Technologies e-commerce retail store and hero carousels.",
    "Collaborate with copywriters, video editors, and the growth team to execute end-to-end product launch campaigns and flash deal promotions.",
    "Create short-form motion graphics, animated reels, or product explainers (added advantage).",
  ],
  qualifications: [
    "2+ years of proven experience as a Graphics Designer, Visual Designer, or Brand Designer (experience with tech, e-commerce, or renewable energy brands is a strong plus).",
    "A strong, verifiable design portfolio (Behance, Dribbble, website, or PDF) showcasing clean typography, layout hierarchy, product flyers, and social media campaigns.",
    "Expert proficiency in Adobe Creative Suite (Photoshop, Illustrator, InDesign), Figma, CorelDRAW, and/or Canva.",
    "Sharp eye for visual composition, color grading, high-resolution product cutouts, and modern tech aesthetics.",
    "Self-motivated with strong communication skills and a reliable remote workstation/internet setup to deliver on tight turnaround times.",
  ],
  benefits: [
    "100% Remote role — work from anywhere with a flexible, results-driven team.",
    "Competitive monthly Naira salary paid promptly.",
    "Direct creative ownership over a fast-growing clean energy & smart-tech brand.",
    "Zero-politics engineering & creative culture with modern tools and resources.",
  ],
  skills: [
    "Graphic Design",
    "Adobe Photoshop",
    "Adobe Illustrator",
    "Figma",
    "Social Media Design",
    "Brand Identity",
    "Product Flyers",
    "Photo Retouching",
    "Typography",
    "Motion Graphics",
  ],
  highlights: [
    "Full-time · 100% Remote role at Tioga Technologies",
    "Own social media creatives, product promo flyers, e-commerce visuals & brand identity",
    "Competitive Naira salary + direct creative ownership",
  ],
  requirements:
    "2+ years Graphic Design experience with a strong portfolio (Behance / Dribbble / Drive). Mastery of Photoshop, Illustrator, Figma or CorelDRAW.",
  emailSubject: "Application - Graphics Designer (Full-Time Remote)",
  deadline: "Rolling Recruitment",
  backgroundImage: bgFluidWave,
};

export const FALLBACK_JOBS: Job[] = [
  FEATURED_GRAPHICS_DESIGNER_JOB,
  {
    title: "Call for Partnership - Nationwide Installers",
    company: "Tioga Technologies",
    location: "Nationwide, Nigeria",
    workplaceType: "On-site",
    employmentType: "Partnership",
    activelyRecruiting: true,
    easyApply: true,
    summary:
      "Inviting credible solar installers across Nigeria to partner with Tioga and deploy advanced energy solutions, integrated inverters and lithium battery systems, that reduce grid dependence.",
    highlights: ["Attractive commission structure", "Reduce client grid dependence", "Access to premium hardware stack"],
    requirements: "Graduate (B.Sc / HND) with valid technical certifications and a proven installation track record.",
    emailSubject: "Application - Partnership (Nationwide Installer)",
    backgroundImage: bgInstaller,
  },
  {
    title: "Engineering Force - Project Engineers & Solar Installers",
    company: "Tioga Technologies",
    location: "Lagos | Abuja | Jos",
    workplaceType: "On-site",
    employmentType: "Contract",
    activelyRecruiting: true,
    easyApply: true,
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
    company: "Tioga Technologies",
    location: "Jos",
    workplaceType: "On-site",
    employmentType: "Full-time",
    activelyRecruiting: true,
    easyApply: true,
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
    company: "Tioga Technologies",
    location: "Abuja | Jos",
    workplaceType: "Hybrid",
    employmentType: "Full-time",
    activelyRecruiting: true,
    easyApply: true,
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
  const [jobs, setJobs] = useState<Job[]>(FALLBACK_JOBS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("careers")
        .select("id, title, location, summary, highlights, requirements, email_subject, deadline")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (!active) return;
      if (!error && data && data.length > 0) {
        const dbJobs: Job[] = normalizeDeep(data).map((d: any, index: number) => {
          const isGraphics = d.title?.toLowerCase().includes("graphic");
          if (isGraphics) {
            return {
              ...FEATURED_GRAPHICS_DESIGNER_JOB,
              id: d.id,
              title: d.title || FEATURED_GRAPHICS_DESIGNER_JOB.title,
              location: d.location || FEATURED_GRAPHICS_DESIGNER_JOB.location,
              summary: d.summary || FEATURED_GRAPHICS_DESIGNER_JOB.summary,
              highlights:
                Array.isArray(d.highlights) && d.highlights.length > 0
                  ? d.highlights
                  : FEATURED_GRAPHICS_DESIGNER_JOB.highlights,
              requirements: d.requirements || FEATURED_GRAPHICS_DESIGNER_JOB.requirements,
              emailSubject: d.email_subject || FEATURED_GRAPHICS_DESIGNER_JOB.emailSubject,
              deadline: d.deadline || FEATURED_GRAPHICS_DESIGNER_JOB.deadline,
            };
          }
          return {
            id: d.id,
            title: d.title,
            company: "Tioga Technologies",
            location: d.location,
            activelyRecruiting: true,
            easyApply: true,
            summary: d.summary,
            highlights: d.highlights || [],
            requirements: d.requirements,
            emailSubject: d.email_subject,
            deadline: d.deadline,
            backgroundImage: JOB_BACKGROUNDS[(index + 1) % JOB_BACKGROUNDS.length],
          };
        });

        const hasGraphicsDesigner = dbJobs.some((j) =>
          j.title.toLowerCase().includes("graphic")
        );

        setJobs(
          hasGraphicsDesigner
            ? dbJobs
            : [FEATURED_GRAPHICS_DESIGNER_JOB, ...dbJobs]
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
