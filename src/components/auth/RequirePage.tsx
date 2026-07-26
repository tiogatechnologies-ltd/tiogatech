import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import usePagePermissions from "@/hooks/usePagePermissions";
import { pageKeyForPath } from "@/lib/adminPages";

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

/**
 * Route-level gate that respects admin-controlled per-page overrides.
 * Assumes RequireRole already ensured the user is signed-in with a base role.
 * When `pageKey` is omitted it is derived from the current pathname.
 */
export const RequirePage = ({ pageKey, children }: { pageKey?: string; children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  const { allowedPages, canPage, loaded } = usePagePermissions();
  const location = useLocation();

  if (isAdmin) return <>{children}</>;

  const key = pageKey ?? pageKeyForPath(location.pathname);
  if (!key) return <>{children}</>; // unmapped admin route: base role gate already applied

  if (!loaded) return <Loader />;
  if (!canPage(key)) {
    const fallback = allowedPages.find((page) => page.key !== key)?.path ?? "/dashboard";
    return <Navigate to={fallback} state={{ blocked: location.pathname }} replace />;
  }
  return <>{children}</>;
};

export default RequirePage;

