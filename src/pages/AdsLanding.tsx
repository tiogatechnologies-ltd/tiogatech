import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import SEO from "@/components/SEO";
import SiteFooter from "@/components/SiteFooter";
import AdsTopBar from "@/components/landing/AdsTopBar";
import AdsHero from "@/components/landing/AdsHero";
import AdsHighlightOffers from "@/components/landing/AdsHighlightOffers";
import AdsSolutionsBento from "@/components/landing/AdsSolutionsBento";
import AdsLeadCaptureForm, {
  type AdsLeadExternalPrefill,
} from "@/components/landing/AdsLeadCaptureForm";
import AdsLeadGateModal, {
  getUnlockedVisitorProfile,
  type UnlockedVisitorProfile,
} from "@/components/landing/AdsLeadGateModal";
import AdsBottomSections from "@/components/landing/AdsBottomSections";
import { captureAttributionFromUrl } from "@/lib/attribution";
import { resolveCampaignConfig, type AdsServiceId } from "@/lib/adsLandingLogic";
import { useSolarPackages } from "@/hooks/useSolarPackages";
import { useSmartLocks } from "@/hooks/useSmartLocks";
import { useCctvPackages } from "@/hooks/useCctvPackages";
import { useHomeAutomationPackages } from "@/hooks/useHomeAutomationPackages";
import { PRODUCTS as STATIC_PRODUCTS } from "@/data/products";

const SolutionsBand = ({
  onQuoteService,
}: {
  onQuoteService: (service: AdsServiceId) => void;
}) => {
  const { packages: solarPackages } = useSolarPackages();
  const { items: smartLocks } = useSmartLocks();
  const { packages: cctvPackages } = useCctvPackages();
  const { packages: automationPackages } = useHomeAutomationPackages();

  const counts = useMemo(
    () => ({
      solar: solarPackages.length,
      locks: smartLocks.filter((l) => l.category !== "accessory").length,
      cctv: cctvPackages.length,
      automation: automationPackages.length,
      retail: STATIC_PRODUCTS.length,
    }),
    [solarPackages.length, smartLocks, cctvPackages.length, automationPackages.length],
  );

  return <AdsSolutionsBento counts={counts} onQuoteService={onQuoteService} />;
};

/**
 * Tioga Technologies Short, Conversion-Focused Ads Landing Page
 * Registered at `/get-started` (indexable) and `/lp/:campaign` (noindex, canonical -> `/get-started`).
 */
const AdsLanding = () => {
  const { campaign: campaignParam } = useParams<{ campaign?: string }>();
  const location = useLocation();

  const isCampaignRoute = Boolean(campaignParam) || location.pathname.startsWith("/lp/");
  const campaign = useMemo(
    () => resolveCampaignConfig(campaignParam),
    [campaignParam],
  );

  const heroRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLElement>(null);
  const solutionsSentinelRef = useRef<HTMLDivElement>(null);

  const [solutionsNearViewport, setSolutionsNearViewport] = useState(false);
  const [externalPrefill, setExternalPrefill] = useState<AdsLeadExternalPrefill | null>(null);
  const prefillSeq = useRef(0);
  const [visitorProfile, setVisitorProfile] = useState<UnlockedVisitorProfile | null>(() =>
    getUnlockedVisitorProfile(),
  );

  useEffect(() => {
    captureAttributionFromUrl();
  }, [location.search]);

  useEffect(() => {
    if (solutionsNearViewport) return;
    const el = solutionsSentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSolutionsNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSolutionsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [solutionsNearViewport]);

  const handleGateUnlocked = (profile: UnlockedVisitorProfile) => {
    setVisitorProfile(profile);
    prefillSeq.current += 1;
    setExternalPrefill({
      version: prefillSeq.current,
      fullName: profile.fullName,
      phone: profile.phone,
      email: profile.email,
      location: profile.location,
      propertyType: profile.propertyType,
      services: profile.services,
      preferredContact: profile.preferredContact,
    });
  };

  const scrollToForm = (prefill?: Omit<AdsLeadExternalPrefill, "version">) => {
    if (prefill) {
      prefillSeq.current += 1;
      setExternalPrefill({ version: prefillSeq.current, ...prefill });
    }
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-clip">
      <SEO
        title={campaign.seoTitle}
        description={campaign.seoDescription}
        path={location.pathname || "/get-started"}
        canonicalPath="/get-started"
        noindex={isCampaignRoute}
      />

      {/* Mandatory Entry Lead-Capture Popup — must be completed before interacting with the page */}
      <AdsLeadGateModal
        open={!visitorProfile}
        campaignSlug={campaign.slug}
        campaignHeadline={`${campaign.headline} ${campaign.headlineAccent}`}
        pathname={location.pathname || "/get-started"}
        defaultServices={campaign.defaultServices}
        onUnlocked={handleGateUnlocked}
      />

      {/* Minimal Top Bar & Short High-Converting Landing Flow */}
      <div
        aria-hidden={!visitorProfile}
        className={`flex flex-col flex-1 ${!visitorProfile ? "pointer-events-none select-none" : ""}`}
      >
        <AdsTopBar onScrollToForm={() => scrollToForm()} />

        <main className="flex-1">
          {/* 1. Compact Pure HTML+SVG Interactive Hero */}
          <AdsHero
            campaign={campaign}
            heroRef={heroRef}
            onGetQuote={() => scrollToForm()}
            onBookAudit={() => scrollToForm({ services: ["audit", "solar"] })}
          />

          {/* 2. Five Highlight Offers */}
          <AdsHighlightOffers
            onBookAudit={() => scrollToForm({ services: ["audit", "solar"] })}
            onGetQuote={() => scrollToForm()}
          />

          {/* 3. Our Solutions (6 service cards from footerLinks.solutions) */}
          <div ref={solutionsSentinelRef}>
            {solutionsNearViewport ? (
              <SolutionsBand
                onQuoteService={(serviceId) => scrollToForm({ services: [serviceId] })}
              />
            ) : (
              <div className="section-padding py-14 text-center text-xs text-muted-foreground">
                Loading Tioga solutions…
              </div>
            )}
          </div>

          {/* 4. 3-Step Lead Capture Form (#get-quote) */}
          <AdsLeadCaptureForm
            formRef={formRef}
            campaignSlug={campaign.slug}
            pathname={location.pathname || "/get-started"}
            defaultServices={campaign.defaultServices}
            externalPrefill={externalPrefill}
          />

          {/* 5. Compact Explore Tioga Hub (from footerLinks) + Mobile Sticky CTA */}
          <AdsBottomSections
            heroRef={heroRef}
            formRef={formRef}
            onScrollToForm={() => scrollToForm()}
          />
        </main>

        <SiteFooter />
      </div>
    </div>
  );
};

export default AdsLanding;
