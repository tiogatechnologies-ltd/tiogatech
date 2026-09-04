import { useEffect } from "react";
import heroBg from "@/assets/hero-bg.jpg";
import heroSmartHome from "@/assets/hero-smart-home.jpg";
import logoLight from "@/assets/tioga-logo-light.png";

/**
 * Injects <link rel="preload" as="image"> for the LCP-critical hero images
 * as early as possible. Because these assets are bundled by Vite (hashed
 * URLs), we cannot hard-code them in index.html - so we inject at runtime.
 */
const CRITICAL: { href: string; priority?: "high" | "low" }[] = [
  { href: heroBg, priority: "high" },
  { href: heroSmartHome, priority: "high" },
  { href: logoLight, priority: "high" },
];

export default function PreloadCritical() {
  useEffect(() => {
    CRITICAL.forEach(({ href, priority }) => {
      if (document.head.querySelector(`link[rel="preload"][href="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      if (priority) (link as any).fetchPriority = priority;
      document.head.appendChild(link);
    });
  }, []);
  return null;
}
