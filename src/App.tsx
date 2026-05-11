import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { usePageTracker } from "@/hooks/usePageTracker";
import ScrollToTop from "@/components/ScrollToTop";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PageTracker />
          <ScrollToTop />
          <LeadFormHost />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/solutions" element={<Navigate to="/lumivolt" replace />} />
            <Route path="/lumivolt" element={<LumiVolt />} />
            <Route path="/voltai" element={<VoltAi />} />
            <Route path="/lumivolt-ai" element={<Navigate to="/lumivolt" replace />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/career" element={<Career />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/catalog" element={<Catalog />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
