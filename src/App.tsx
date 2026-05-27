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
import CartDrawer from "@/components/CartDrawer";
import TelegramWidget from "@/components/TelegramWidget";
import Index from "./pages/Index.tsx";
import Catalog from "./pages/Catalog.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminProducts from "./pages/AdminProducts.tsx";
import AdminLeads from "./pages/AdminLeads.tsx";
import AdminSettings from "./pages/AdminSettings.tsx";
import AdminSetup from "./pages/AdminSetup.tsx";
import AdminFormQuestions from "./pages/AdminFormQuestions.tsx";
import AdminLandingPage from "./pages/AdminLandingPage.tsx";
import AdminContent from "./pages/AdminContent.tsx";
import AdminEmail from "./pages/AdminEmail.tsx";
import AdminAnalytics from "./pages/AdminAnalytics.tsx";
import AdminCareers from "./pages/AdminCareers.tsx";
import AdminCareerApplications from "./pages/AdminCareerApplications.tsx";
import AdminSolarPackages from "./pages/AdminSolarPackages.tsx";
import AdminSmartLocks from "./pages/AdminSmartLocks.tsx";
import AdminHomeAutomation from "./pages/AdminHomeAutomation.tsx";
import AdminWaitlist from "./pages/AdminWaitlist.tsx";
import About from "./pages/About.tsx";
import LumiVolt from "./pages/LumiVolt.tsx";
import VoltAi from "./pages/VoltAi.tsx";
import Finance from "./pages/Finance.tsx";
import Contact from "./pages/Contact.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import AdminBlog from "./pages/AdminBlog.tsx";
import AdminNewsletter from "./pages/AdminNewsletter.tsx";
import NewsletterConfirm from "./pages/NewsletterConfirm.tsx";
import NewsletterUnsubscribe from "./pages/NewsletterUnsubscribe.tsx";

import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import Packages from "./pages/Packages.tsx";
import Career from "./pages/Career.tsx";
import Jobs from "./pages/Jobs.tsx";
import ComingSoon from "./pages/ComingSoon.tsx";

const queryClient = new QueryClient();

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
        <Route path="/admin/email" element={<ProtectedAdmin><AdminEmail /></ProtectedAdmin>} />
        <Route path="/admin/analytics" element={<ProtectedAdmin><AdminAnalytics /></ProtectedAdmin>} />
        <Route path="/admin/careers" element={<ProtectedAdmin><AdminCareers /></ProtectedAdmin>} />
        <Route path="/admin/career-applications" element={<ProtectedAdmin><AdminCareerApplications /></ProtectedAdmin>} />
        <Route path="/admin/solar-packages" element={<ProtectedAdmin><AdminSolarPackages /></ProtectedAdmin>} />
        <Route path="/admin/smart-locks" element={<ProtectedAdmin><AdminSmartLocks /></ProtectedAdmin>} />
        <Route path="/admin/home-automation" element={<ProtectedAdmin><AdminHomeAutomation /></ProtectedAdmin>} />
        <Route path="/admin/waitlist" element={<ProtectedAdmin><AdminWaitlist /></ProtectedAdmin>} />
        <Route path="/admin/settings" element={<ProtectedAdmin><AdminSettings /></ProtectedAdmin>} />
        <Route path="*" element={<RouteFade><NotFound /></RouteFade>} />
      </Routes>
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
            <ScrollToTop />
            <SmoothScroll />
            <BackgroundAura />
            <AutoReveal />
            <LeadFormHost />
            <CartDrawer />
            <TelegramWidget />
            <ScrollToTopButton />
            <AnimatedRoutes />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
