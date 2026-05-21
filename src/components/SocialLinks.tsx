import { Facebook, Instagram, Linkedin } from "lucide-react";

const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V9.55a8.16 8.16 0 0 0 4.77 1.52V7.71a4.79 4.79 0 0 1-1.84-1.02Z" />
  </svg>
);

export const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/tiogasmartlife_system", Icon: Instagram },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61583313523225", Icon: Facebook },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/tiogatechnologies/", Icon: Linkedin },
  { label: "TikTok", href: "https://www.tiktok.com/@tiogatechnologies", Icon: TikTokIcon },
];

interface Props {
  variant?: "light" | "dark";
  size?: "sm" | "md";
}

const SocialLinks = ({ variant = "dark", size = "md" }: Props) => {
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? 14 : 16;
  const base =
    variant === "light"
      ? "bg-primary-foreground/10 hover:bg-gold text-primary-foreground hover:text-midnight border-primary-foreground/15"
      : "bg-muted hover:bg-primary text-foreground hover:text-primary-foreground border-border";

  return (
    <div className="flex items-center gap-2">
      {SOCIALS.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Tioga Technologies on ${label}`}
          className={`${dim} ${base} grid place-items-center rounded-full border transition-all active:scale-95`}
        >
          <Icon size={icon} />
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
