/**
 * Single source of truth for Tioga Technologies footer navigation links.
 * Imported by both `SiteFooter.tsx` and the Ads Landing Page (`/get-started`, `/lp/:campaign`)
 * so every internal link on the landing page stays automatically synchronized with the footer.
 */

export interface FooterLinkItem {
  label: string;
  to: string;
  description: string;
}

export const companyLinks: FooterLinkItem[] = [
  {
    label: "About",
    to: "/about",
    description: "Our story, engineering team and mission across Nigeria.",
  },
  {
    label: "Career",
    to: "/career",
    description: "Open engineering, installation and operations roles.",
  },
  {
    label: "Blog",
    to: "/blog",
    description: "Practical solar sizing, smart security and automation guides.",
  },
  {
    label: "Contact",
    to: "/contact",
    description: "Reach our Abuja, Lagos and Jos engineering desks directly.",
  },
  {
    label: "Lumi - Residential",
    to: "/lumi",
    description: "Residential clean energy sizing and hybrid backup systems.",
  },
  {
    label: "VoltAi - Smart Automation",
    to: "/voltai",
    description: "Intelligent whole-home energy and smart automation platform.",
  },
];

export const solutionLinks: FooterLinkItem[] = [
  {
    label: "Engineering Solutions",
    to: "/solutions",
    description: "Custom solar, commercial backup, IoT and embedded deployments.",
  },
  {
    label: "Solar Packages",
    to: "/solar-packages",
    description: "Pre-engineered Lithium, Tubular and High-Voltage inverter kits.",
  },
  {
    label: "Smart Locks",
    to: "/smart-locks",
    description: "3D Face ID, fingerprint, PIN, RFID and hotel access systems.",
  },
  {
    label: "Home Automation",
    to: "/home-automation",
    description: "Apex, Aura and Riviera lighting, climate and curtain tiers.",
  },
  {
    label: "CCTV & Security",
    to: "/cctv",
    description: "ColorVu AI surveillance kits and off-grid 4G solar PTZ cameras.",
  },
  {
    label: "Retail Store",
    to: "/retail",
    description: "Shop inverters, LiFePO4 batteries, solar panels and smart devices.",
  },
];

export const supportLinks: FooterLinkItem[] = [
  {
    label: "Get a Free Quote",
    to: "/get-started",
    description: "Book a free energy audit or request a tailored quote in 24h.",
  },
  {
    label: "Track Your Order",
    to: "/track",
    description: "Check live dispatch and delivery progress for your order.",
  },
  {
    label: "How It Works",
    to: "/#how-it-works",
    description: "From free assessment and quoting to 48-72h installation.",
  },
  {
    label: "FAQs",
    to: "/#faq",
    description: "Answers on pricing, warranties, nationwide install and finance.",
  },
  {
    label: "Finance",
    to: "/finance",
    description: "Spread the cost of any system with flexible monthly plans.",
  },
  {
    label: "Privacy Policy",
    to: "/privacy",
    description: "How we collect, store and safeguard your personal details.",
  },
  {
    label: "Terms of Service",
    to: "/terms",
    description: "Service terms, installation commitments and warranty coverage.",
  },
];

export const footerLinks = {
  company: companyLinks,
  solutions: solutionLinks,
  support: supportLinks,
} as const;
