import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  roles?: AppRole[]; // if omitted, only requires sign-in
  redirectTo?: string;
}

const FullPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

export const RequireRole = ({ children, roles, redirectTo = "/auth" }: Props) => {
  const { user, hasAnyRole, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default RequireRole;
