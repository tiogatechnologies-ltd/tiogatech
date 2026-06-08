import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import BackgroundAura from "@/components/BackgroundAura";
import AutoReveal from "@/components/AutoReveal";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { usePageTracker } from "@/hooks/usePageTracker";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import SmoothScroll from "@/components/SmoothScroll";
import RouteFade from "@/components/RouteFade";
import LeadFormHost from "@/components/LeadFormHost";
import { CartProvider } from "@/contexts/CartContext";
import PreloadCritical from "@/components/PreloadCritical";

// Eager: above-the-fold landing page only (fastest first paint)
import Index from "./pages/Index.tsx";

// Floating overlays — lazy so they don't block first paint
const CartDrawer = lazy(() => import("@/components/CartDrawer"));
const TelegramWidget = lazy(() => import("@/components/TelegramWidget"));

// Public routes — lazy
const About = lazy(() => import("./pages/About.tsx"));
const Catalog = lazy(() => import("./pages/Catalog.tsx"));
const LumiVolt = lazy(() => import("./pages/LumiVolt.tsx"));
const VoltAi = lazy(() => import("./pages/VoltAi.tsx"));
const Finance = lazy(() => import("./pages/Finance.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const BlogPost = lazy(() => import("./pages/BlogPost.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Packages = lazy(() => import("./pages/Packages.tsx"));
const Customize = lazy(() => import("./pages/Customize.tsx"));
const Career = lazy(() => import("./pages/Career.tsx"));
const Jobs = lazy(() => import("./pages/Jobs.tsx"));
const ComingSoon = lazy(() => import("./pages/ComingSoon.tsx"));
const NewsletterConfirm = lazy(() => import("./pages/NewsletterConfirm.tsx"));
const NewsletterUnsubscribe = lazy(() => import("./pages/NewsletterUnsubscribe.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Admin routes — lazy (massive bundles never shipped to public visitors)
const AdminLogin = lazy(() => import("./pages/AdminLogin.tsx"));
const AdminSetup = lazy(() => import("./pages/AdminSetup.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const AdminProducts = lazy(() => import("./pages/AdminProducts.tsx"));
const AdminLeads = lazy(() => import("./pages/AdminLeads.tsx"));
const AdminSettings = lazy(() => import("./pages/AdminSettings.tsx"));
const AdminFormQuestions = lazy(() => import("./pages/AdminFormQuestions.tsx"));
const AdminLandingPage = lazy(() => import("./pages/AdminLandingPage.tsx"));
const AdminContent = lazy(() => import("./pages/AdminContent.tsx"));
const AdminEmail = lazy(() => import("./pages/AdminEmail.tsx"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics.tsx"));
const AdminCareers = lazy(() => import("./pages/AdminCareers.tsx"));
const AdminCareerApplications = lazy(() => import("./pages/AdminCareerApplications.tsx"));
const AdminSolarPackages = lazy(() => import("./pages/AdminSolarPackages.tsx"));
const AdminSmartLocks = lazy(() => import("./pages/AdminSmartLocks.tsx"));
const AdminHomeAutomation = lazy(() => import("./pages/AdminHomeAutomation.tsx"));
const AdminWaitlist = lazy(() => import("./pages/AdminWaitlist.tsx"));
const AdminBlog = lazy(() => import("./pages/AdminBlog.tsx"));
const AdminNewsletter = lazy(() => import("./pages/AdminNewsletter.tsx"));
const AdminOrders = lazy(() => import("./pages/AdminOrders.tsx"));
const AdminAffiliates = lazy(() => import("./pages/AdminAffiliates.tsx"));
const AdminAffiliatePayouts = lazy(() => import("./pages/AdminAffiliatePayouts.tsx"));
const AdminAffiliateAnalytics = lazy(() => import("./pages/AdminAffiliateAnalytics.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — avoid refetch storms
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const ProtectedAdmin = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

const PageTracker = () => {
  usePageTracker();
  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<RouteFade><Index /></RouteFade>} />
          <Route path="/about" element={<RouteFade><About /></RouteFade>} />
          <Route path="/solutions" element={<Navigate to="/lumivolt" replace />} />
          <Route path="/lumivolt" element={<RouteFade><LumiVolt /></RouteFade>} />
          <Route path="/voltai" element={<RouteFade><VoltAi /></RouteFade>} />
          <Route path="/lumivolt-ai" element={<Navigate to="/lumivolt" replace />} />
          <Route path="/finance" element={<RouteFade><Finance /></RouteFade>} />
          <Route path="/contact" element={<RouteFade><Contact /></RouteFade>} />
          <Route path="/packages" element={<RouteFade><Packages /></RouteFade>} />
          <Route path="/customize/:type/:id" element={<RouteFade><Customize /></RouteFade>} />

          <Route path="/career" element={<RouteFade><Career /></RouteFade>} />
          <Route path="/careers/jobs" element={<RouteFade><Jobs /></RouteFade>} />
          <Route path="/coming-soon" element={<RouteFade><ComingSoon /></RouteFade>} />
          <Route path="/privacy" element={<RouteFade><Privacy /></RouteFade>} />
          <Route path="/terms" element={<RouteFade><Terms /></RouteFade>} />
          <Route path="/catalog" element={<RouteFade><Catalog /></RouteFade>} />
          <Route path="/blog" element={<RouteFade><Blog /></RouteFade>} />
          <Route path="/blog/:slug" element={<RouteFade><BlogPost /></RouteFade>} />
          <Route path="/newsletter/confirm" element={<RouteFade><NewsletterConfirm /></RouteFade>} />
          <Route path="/newsletter/unsubscribe" element={<RouteFade><NewsletterUnsubscribe /></RouteFade>} />
          <Route path="/admin/blog" element={<ProtectedAdmin><AdminBlog /></ProtectedAdmin>} />
          <Route path="/admin/newsletter" element={<ProtectedAdmin><AdminNewsletter /></ProtectedAdmin>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/setup" element={<AdminSetup />} />
          <Route path="/admin" element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
          <Route path="/admin/products" element={<ProtectedAdmin><AdminProducts /></ProtectedAdmin>} />
          <Route path="/admin/leads" element={<ProtectedAdmin><AdminLeads /></ProtectedAdmin>} />
          <Route path="/admin/forms" element={<ProtectedAdmin><AdminFormQuestions /></ProtectedAdmin>} />
          <Route path="/admin/landing" element={<ProtectedAdmin><AdminLandingPage /></ProtectedAdmin>} />
          <Route path="/admin/content" element={<ProtectedAdmin><AdminContent /></ProtectedAdmin>} />
          <Route path="/admin/orders" element={<ProtectedAdmin><AdminOrders /></ProtectedAdmin>} />
          <Route path="/admin/email" element={<ProtectedAdmin><AdminEmail /></ProtectedAdmin>} />
          <Route path="/admin/analytics" element={<ProtectedAdmin><AdminAnalytics /></ProtectedAdmin>} />
          <Route path="/admin/careers" element={<ProtectedAdmin><AdminCareers /></ProtectedAdmin>} />
          <Route path="/admin/career-applications" element={<ProtectedAdmin><AdminCareerApplications /></ProtectedAdmin>} />
          <Route path="/admin/solar-packages" element={<ProtectedAdmin><AdminSolarPackages /></ProtectedAdmin>} />
          <Route path="/admin/smart-locks" element={<ProtectedAdmin><AdminSmartLocks /></ProtectedAdmin>} />
          <Route path="/admin/home-automation" element={<ProtectedAdmin><AdminHomeAutomation /></ProtectedAdmin>} />
          <Route path="/admin/waitlist" element={<ProtectedAdmin><AdminWaitlist /></ProtectedAdmin>} />
          <Route path="/admin/affiliates" element={<ProtectedAdmin><AdminAffiliates /></ProtectedAdmin>} />
          <Route path="/admin/affiliates/payouts" element={<ProtectedAdmin><AdminAffiliatePayouts /></ProtectedAdmin>} />
          <Route path="/admin/affiliates/analytics" element={<ProtectedAdmin><AdminAffiliateAnalytics /></ProtectedAdmin>} />
          <Route path="/admin/settings" element={<ProtectedAdmin><AdminSettings /></ProtectedAdmin>} />
          <Route path="*" element={<RouteFade><NotFound /></RouteFade>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <PageTracker />
            <PreloadCritical />
            <ScrollToTop />
            <SmoothScroll />
            <BackgroundAura />
            <AutoReveal />
            <LeadFormHost />
            <Suspense fallback={null}>
              <CartDrawer />
              <TelegramWidget />
            </Suspense>
            <ScrollToTopButton />
            <AnimatedRoutes />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
