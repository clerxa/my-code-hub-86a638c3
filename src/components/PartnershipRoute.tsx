import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { hasActivePartnership } from "@/lib/partnership";
import { Building2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PartnershipRouteProps {
  children: React.ReactNode;
  /** Type of feature being protected - for custom messaging */
  featureType?: "company" | "community";
}

/**
 * Route guard that requires both authentication AND an active company partnership.
 * Users without a partnership are shown a dialog explaining how to get access.
 */
const PartnershipRoute = ({ children, featureType = "company" }: PartnershipRouteProps) => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [hasPartnership, setHasPartnership] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLockedDialog, setShowLockedDialog] = useState(false);

  useEffect(() => {
    checkPartnershipStatus();
  }, [user]);

  const checkPartnershipStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get user's profile with company
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setHasPartnership(false);
        setLoading(false);
        return;
      }

      if (!profile?.company_id) {
        setHasPartnership(false);
        setLoading(false);
        return;
      }

      // Check company's partnership status
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("partnership_type")
        .eq("id", profile.company_id)
        .maybeSingle();

      if (companyError) {
        console.error("Error fetching company:", companyError);
        setHasPartnership(false);
      } else {
        setHasPartnership(hasActivePartnership(company?.partnership_type));
      }
    } catch (error) {
      console.error("Error in checkPartnershipStatus:", error);
      setHasPartnership(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !session) {
    return <Navigate to="/login" replace />;
  }

  // Show locked dialog if no partnership
  if (hasPartnership === false) {
    const dialogConfig = {
      company: {
        title: "Espace Entreprise réservé aux partenaires",
        description: "Pour bénéficier de parcours de formation spécifiques à votre entreprise, il faut que votre entreprise soit partenaire officiel de MyFinCare.",
      },
      community: {
        title: "Communauté réservée aux partenaires",
        description: "Pour accéder à la communauté et échanger avec d'autres collaborateurs, il faut que votre entreprise soit partenaire officiel de MyFinCare.",
      },
    };

    const config = dialogConfig[featureType];

    return (
      <Dialog open={true} onOpenChange={() => navigate("/employee")}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">{config.title}</DialogTitle>
            <DialogDescription className="text-center">
              {config.description}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              className="w-full gap-2"
              onClick={() => navigate("/proposer-partenariat")}
            >
              <Building2 className="h-4 w-4" />
              Proposer un partenariat à mon entreprise
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/employee")}
            >
              Retourner au tableau de bord
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
};

export default PartnershipRoute;
