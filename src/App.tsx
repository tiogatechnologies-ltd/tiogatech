import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import BackgroundAura from "@/components/BackgroundAura";
import AutoReveal from "@/components/AutoReveal";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import RequireRole from "@/components/auth/RequireRole";
import { usePageTracker } from "@/hooks/usePageTracker";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import SmoothScroll from "@/components/SmoothScroll";
import RouteFade from "@/components/RouteFade";
import LeadFormHost from "@/components/LeadFormHost";
import { CartProvider } from "@/contexts/CartContext";
import PreloadCritical from "@/components/PreloadCritical";
import DeferredMount from "@/components/DeferredMount";

import Index from "./pages/Index.tsx";

const CartDrawer = lazy(() => import("@/components/CartDrawer"));
const TelegramWidget = lazy(() => import("@/components/TelegramWidget"));

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

const Auth = lazy(() => import("./pages/Auth.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Account = lazy(() => import("./pages/Account.tsx"));
const Checkout = lazy(() => import("./pages/Checkout.tsx"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess.tsx"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard.tsx"));

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
const AdminInventory = lazy(() => import("./pages/AdminInventory.tsx"));
const AdminAffiliates = lazy(() => import("./pages/AdminAffiliates.tsx"));
const AdminAffiliatePayouts = lazy(() => import("./pages/AdminAffiliatePayouts.tsx"));
const AdminAffiliateAnalytics = lazy(() => import("./pages/AdminAffiliateAnalytics.tsx"));
const AdminUsers = lazy(() => import("./pages/AdminUsers.tsx"));
const AdminDiscounts = lazy(() => import("./pages/AdminDiscounts.tsx"));
const AdminAuditLog = lazy(() => import("./pages/AdminAuditLog.tsx"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers.tsx"));
const AdminFinanceApplications = lazy(() => import("./pages/AdminFinanceApplications.tsx"));
const AdminFinanceSchedules = lazy(() => import("./pages/AdminFinanceSchedules.tsx"));
const AdminReports = lazy(() => import("./pages/AdminReports.tsx"));
const AdminStorage = lazy(() => import("./pages/AdminStorage.tsx"));
const AdminAssessments = lazy(() => import("./pages/AdminAssessments.tsx"));
const AdminCustomRequests = lazy(() => import("./pages/AdminCustomRequests.tsx"));
const AdminLumiVoltSizings = lazy(() => import("./pages/AdminLumiVoltSizings.tsx"));
const SolarAssessment = lazy(() => import("./pages/SolarAssessment.tsx"));
const SolarAssessmentReport = lazy(() => import("./pages/SolarAssessmentReport.tsx"));
const AccountAssessments = lazy(() => import("./pages/AccountAssessments.tsx"));


const FinanceApply = lazy(() => import("./pages/FinanceApply.tsx"));
const AccountFinance = lazy(() => import("./pages/AccountFinance.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const AdminAiSubscriptions = lazy(() => import("./pages/AdminAiSubscriptions.tsx"));
const AiChatWidget = lazy(() => import("@/components/AiChatWidget"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
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

const Admin = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => (
  <RequireRole roles={adminOnly ? ["admin"] : ["admin", "staff"]} redirectTo="/admin/login">{children}</RequireRole>
);

const PageTracker = () => { usePageTracker(); return null; };

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
          <Route path="/finance/apply" element={<RouteFade><FinanceApply /></RouteFade>} />
          <Route path="/blog" element={<RouteFade><Blog /></RouteFade>} />
          <Route path="/blog/:slug" element={<RouteFade><BlogPost /></RouteFade>} />
          <Route path="/newsletter/confirm" element={<RouteFade><NewsletterConfirm /></RouteFade>} />
          <Route path="/newsletter/unsubscribe" element={<RouteFade><NewsletterUnsubscribe /></RouteFade>} />
          <Route path="/solar-assessment" element={<RouteFade><SolarAssessment /></RouteFade>} />
          <Route path="/solar-assessment/:id/full" element={<RouteFade><SolarAssessmentReport /></RouteFade>} />
          <Route path="/ai-pricing" element={<RouteFade><Pricing /></RouteFade>} />
          
          <Route path="/account/assessments" element={<RequireRole><AccountAssessments /></RequireRole>} />

          {/* Auth + Account */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/signup" element={<Navigate to="/auth?mode=signup" replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/account" element={<RequireRole><Account /></RequireRole>} />
          <Route path="/account/finance" element={<RequireRole><AccountFinance /></RequireRole>} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/affiliate" element={<RequireRole roles={["affiliate", "admin"]}><AffiliateDashboard /></RequireRole>} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/setup" element={<AdminSetup />} />
          <Route path="/admin" element={<Admin><AdminDashboard /></Admin>} />
          <Route path="/admin/products" element={<Admin><AdminProducts /></Admin>} />
          <Route path="/admin/inventory" element={<Admin><AdminInventory /></Admin>} />
          <Route path="/admin/leads" element={<Admin><AdminLeads /></Admin>} />
          <Route path="/admin/forms" element={<Admin><AdminFormQuestions /></Admin>} />
          <Route path="/admin/landing" element={<Admin><AdminLandingPage /></Admin>} />
          <Route path="/admin/content" element={<Admin><AdminContent /></Admin>} />
          <Route path="/admin/orders" element={<Admin><AdminOrders /></Admin>} />
          <Route path="/admin/email" element={<Admin><AdminEmail /></Admin>} />
          <Route path="/admin/analytics" element={<Admin><AdminAnalytics /></Admin>} />
          <Route path="/admin/careers" element={<Admin><AdminCareers /></Admin>} />
          <Route path="/admin/career-applications" element={<Admin><AdminCareerApplications /></Admin>} />
          <Route path="/admin/solar-packages" element={<Admin><AdminSolarPackages /></Admin>} />
          <Route path="/admin/smart-locks" element={<Admin><AdminSmartLocks /></Admin>} />
          <Route path="/admin/home-automation" element={<Admin><AdminHomeAutomation /></Admin>} />
          <Route path="/admin/waitlist" element={<Admin><AdminWaitlist /></Admin>} />
          <Route path="/admin/blog" element={<Admin><AdminBlog /></Admin>} />
          <Route path="/admin/newsletter" element={<Admin><AdminNewsletter /></Admin>} />
          <Route path="/admin/affiliates" element={<Admin><AdminAffiliates /></Admin>} />
          <Route path="/admin/affiliates/payouts" element={<Admin><AdminAffiliatePayouts /></Admin>} />
          <Route path="/admin/affiliates/analytics" element={<Admin><AdminAffiliateAnalytics /></Admin>} />
          <Route path="/admin/users" element={<Admin adminOnly><AdminUsers /></Admin>} />
          <Route path="/admin/discounts" element={<Admin><AdminDiscounts /></Admin>} />
          <Route path="/admin/customers" element={<Admin><AdminCustomers /></Admin>} />
          <Route path="/admin/audit-log" element={<Admin adminOnly><AdminAuditLog /></Admin>} />
          
          <Route path="/admin/finance/applications" element={<Admin><AdminFinanceApplications /></Admin>} />
          <Route path="/admin/finance/schedules" element={<Admin><AdminFinanceSchedules /></Admin>} />
          <Route path="/admin/settings" element={<Admin adminOnly><AdminSettings /></Admin>} />
          <Route path="/admin/reports" element={<Admin><AdminReports /></Admin>} />
          <Route path="/admin/storage" element={<Admin><AdminStorage /></Admin>} />
          <Route path="/admin/assessments" element={<RequireRole roles={["admin","staff","engineer"]} redirectTo="/admin/login"><AdminAssessments /></RequireRole>} />
          <Route path="/admin/custom-requests" element={<RequireRole roles={["admin","staff","engineer"]} redirectTo="/admin/login"><AdminCustomRequests /></RequireRole>} />
          <Route path="/admin/lumivolt-sizings" element={<RequireRole roles={["admin","staff","engineer"]} redirectTo="/admin/login"><AdminLumiVoltSizings /></RequireRole>} />
          <Route path="/admin/ai-subscriptions" element={<Admin><AdminAiSubscriptions /></Admin>} />
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
              <DeferredMount delay={2500}>
                <TelegramWidget />
                <AiChatWidget />
              </DeferredMount>
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
