import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Navigate } from "react-router-dom";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "hsl(var(--fuchsia))", borderRightColor: "hsl(var(--violet))" }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/connexion" replace />;
  if (!isAdmin) return <Navigate to="/app/dashboard" replace />;

  return <>{children}</>;
};
