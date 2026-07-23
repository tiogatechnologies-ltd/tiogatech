import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import usePagePermissions from "@/hooks/usePagePermissions";

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

/**
 * Route-level gate that respects admin-controlled per-page overrides.
 * Assumes RequireRole already ensured the user is signed-in with a base role.
 */
export const RequirePage = ({ pageKey, children }: { pageKey: string; children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  const { canPage, loaded } = usePagePermissions();
  const location = useLocation();
  if (isAdmin) return <>{children}</>;
  if (!loaded) return <Loader />;
  if (!canPage(pageKey)) return <Navigate to="/admin" state={{ blocked: location.pathname }} replace />;
  return <>{children}</>;
};

export default RequirePage;
