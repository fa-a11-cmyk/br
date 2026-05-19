import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isSuspended } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: "hsl(var(--fuchsia))", borderRightColor: "hsl(var(--violet))" }} />
      </div>
    );
  }

  if (!user || isSuspended) return <Navigate to="/connexion" replace />;

  return <>{children}</>;
};
