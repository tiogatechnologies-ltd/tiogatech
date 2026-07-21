import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

/**
 * Central post-login router that sends each role to its own dashboard.
 * Uses the user_roles table as the single source of truth via AuthContext.
 */
const DashboardRouter = () => {
  const { user, loading, rolesLoaded, isAdmin, isStaff, isAffiliate, hasRole } = useAuth();

  if (loading || (user && !rolesLoaded)) return <Loader />;
  if (!user) return <Navigate to="/auth" replace />;

  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isStaff) return <Navigate to="/staff" replace />;
  if (hasRole("engineer")) return <Navigate to="/admin/assessments" replace />;
  if (isAffiliate) return <Navigate to="/affiliate" replace />;
  return <Navigate to="/account" replace />;
};

export default DashboardRouter;
