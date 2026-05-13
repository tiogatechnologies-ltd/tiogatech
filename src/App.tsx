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
import SmoothScroll from "@/components/SmoothScroll";
import RouteFade from "@/components/RouteFade";
import LeadFormHost from "@/components/LeadFormHost";
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
import AdminEmail from "./pages/AdminEmail.tsx";
import AdminAnalytics from "./pages/AdminAnalytics.tsx";
import About from "./pages/About.tsx";
import LumiVolt from "./pages/LumiVolt.tsx";
import VoltAi from "./pages/VoltAi.tsx";
import Finance from "./pages/Finance.tsx";
import Contact from "./pages/Contact.tsx";

import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import Packages from "./pages/Packages.tsx";
import Career from "./pages/Career.tsx";

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
        <Route path="/privacy" element={<RouteFade><Privacy /></RouteFade>} />
        <Route path="/terms" element={<RouteFade><Terms /></RouteFade>} />
        <Route path="/catalog" element={<RouteFade><Catalog /></RouteFade>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/setup" element={<AdminSetup />} />
        <Route path="/admin" element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
        <Route path="/admin/products" element={<ProtectedAdmin><AdminProducts /></ProtectedAdmin>} />
        <Route path="/admin/leads" element={<ProtectedAdmin><AdminLeads /></ProtectedAdmin>} />
        <Route path="/admin/forms" element={<ProtectedAdmin><AdminFormQuestions /></ProtectedAdmin>} />
        <Route path="/admin/landing" element={<ProtectedAdmin><AdminLandingPage /></ProtectedAdmin>} />
        <Route path="/admin/email" element={<ProtectedAdmin><AdminEmail /></ProtectedAdmin>} />
        <Route path="/admin/analytics" element={<ProtectedAdmin><AdminAnalytics /></ProtectedAdmin>} />
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
          <PageTracker />
          <ScrollToTop />
          <SmoothScroll />
          <BackgroundAura />
          <LeadFormHost />
          <AnimatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
