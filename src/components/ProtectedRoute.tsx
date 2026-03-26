import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireCompanyContact?: boolean;
  requireAdvisor?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false, requireCompanyContact = false }: ProtectedRouteProps) => {
  const { user, session } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCompanyContact, setIsCompanyContact] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!requireAdmin && !requireCompanyContact) {
      setIsAdmin(true);
      setIsCompanyContact(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking user role:", error);
        setIsAdmin(false);
        setIsCompanyContact(false);
      } else {
        const userRole = data?.role;
        setIsAdmin(userRole === "admin");
        setIsCompanyContact(userRole === "contact_entreprise" || userRole === "admin");
      }
    } catch (error) {
      console.error("Error in checkAdminStatus:", error);
      setIsAdmin(false);
      setIsCompanyContact(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/employee" replace />;
  }

  if (requireCompanyContact && !isCompanyContact) {
    return <Navigate to="/employee" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
