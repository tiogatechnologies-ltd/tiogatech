/**
 * Shared JSON-LD builders so every public page ships consistent structured data
 * for search engines and AI answer engines.
 */

export const SITE_URL = "https://tiogatechnologies.com";

const ORG_REF = { "@id": `${SITE_URL}/#organization` };

/** BreadcrumbList for a page. Pass the trail after Home, e.g. [{name:"Catalog", path:"/catalog"}]. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      ...trail.map((t, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: t.name,
        item: `${SITE_URL}${t.path}`,
      })),
    ],
  };
}

/** Service offering (solar, automation, financing) provided by Tioga. */
export function serviceJsonLd(opts: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    serviceType: opts.serviceType,
    url: `${SITE_URL}${opts.path}`,
    provider: ORG_REF,
    areaServed: [
      { "@type": "Country", name: "Nigeria" },
      { "@type": "City", name: "Lagos" },
      { "@type": "City", name: "Abuja" },
      { "@type": "City", name: "Port Harcourt" },
      { "@type": "City", name: "Jos" },
    ],
  };
}

/** ContactPage schema with the real contact points. */
export function contactPageJsonLd(contact?: { phone?: string; email?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    url: `${SITE_URL}/contact`,
    name: "Contact Tioga Technologies",
    mainEntity: {
      "@type": "Organization",
      ...ORG_REF,
      name: "Tioga Technologies",
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: contact?.phone || "+234 903 596 6388",
          email: contact?.email || "sales@tiogatechnologies.com",
          contactType: "sales",
          areaServed: "NG",
          availableLanguage: ["English"],
        },
      ],
    },
  };
}

/** AboutPage schema. */
export function aboutPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${SITE_URL}/about`,
    name: "About Tioga Technologies",
    mainEntity: ORG_REF,
  };
}
