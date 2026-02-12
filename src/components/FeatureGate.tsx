import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { Lock, ArrowUpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface FeatureGateProps {
  featureKey: string;
  children: React.ReactNode;
  className?: string;
  /** If true, shows grayed out content with upgrade badge instead of hiding */
  showLocked?: boolean;
  /** Custom message for locked state */
  lockedMessage?: string;
}

export const FeatureGate = ({ 
  featureKey, 
  children, 
  className,
  showLocked = true,
  lockedMessage = "Disponible avec un partenariat entreprise"
}: FeatureGateProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [user, featureKey]);

  const checkAccess = async () => {
    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    try {
      // Récupérer le profil utilisateur avec son entreprise
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Vérifier si l'entreprise a un partenariat actif
      if (profileData?.company_id) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("partnership_type")
          .eq("id", profileData.company_id)
          .maybeSingle();

        // Si l'entreprise a un partenariat actif (non "Aucun"), l'utilisateur a accès à tout
        const hasPartnership = companyData?.partnership_type && 
          companyData.partnership_type.toLowerCase() !== 'aucun';
        if (hasPartnership) {
          setHasAccess(true);
          setLoading(false);
          return;
        }
      }

      // Vérifier si la feature existe et est active
      const { data: featureData, error: featureError } = await supabase
        .from("features")
        .select("id, nom_fonctionnalite, requires_partnership")
        .eq("cle_technique", featureKey)
        .eq("active", true)
        .maybeSingle();

      if (featureError) throw featureError;

      if (!featureData) {
        // Feature n'existe pas, on autorise par défaut
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Si la feature nécessite un partenariat et l'utilisateur n'en a pas
      if (featureData.requires_partnership) {
        setHasAccess(false);
      } else {
        // La feature ne nécessite pas de partenariat, accès autorisé
        setHasAccess(true);
      }
    } catch (error) {
      console.error("Error checking feature access:", error);
      setHasAccess(true); // En cas d'erreur, autoriser
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <>{children}</>;
  }

  if (!hasAccess && showLocked) {
    return (
      <div 
        className={cn(
          "relative group cursor-pointer",
          className
        )}
        onClick={() => navigate('/proposer-partenariat')}
      >
        {/* Grayed out content */}
        <div className="opacity-40 grayscale pointer-events-none select-none">
          {children}
        </div>
        
        {/* Upgrade overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
          <Badge 
            variant="secondary" 
            className="gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground shadow-lg text-center"
          >
            <ArrowUpCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs leading-tight">Proposer un partenariat à mon entreprise pour débloquer</span>
          </Badge>
        </div>
        
        {/* Lock icon always visible */}
        <div className="absolute top-2 right-2">
          <div className="bg-muted/90 rounded-full p-1.5">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess && !showLocked) {
    return null;
  }

  return <>{children}</>;
};

// Hook pour vérifier l'accès à une feature
export const useFeatureAccess = (featureKey: string) => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .maybeSingle();

        // Vérifier si l'entreprise a un partenariat actif
        if (profileData?.company_id) {
          const { data: companyData } = await supabase
            .from("companies")
            .select("partnership_type")
            .eq("id", profileData.company_id)
            .maybeSingle();

          // Si l'entreprise a un partenariat, l'utilisateur a accès à tout
          if (companyData?.partnership_type) {
            setHasAccess(true);
            setLoading(false);
            return;
          }
        }

        const { data: featureData } = await supabase
          .from("features")
          .select("id, requires_partnership")
          .eq("cle_technique", featureKey)
          .eq("active", true)
          .maybeSingle();

        if (!featureData) {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // Si la feature nécessite un partenariat et l'utilisateur n'en a pas
        setHasAccess(!featureData.requires_partnership);
      } catch (error) {
        console.error("Error checking feature access:", error);
        setHasAccess(true);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, featureKey]);

  return { hasAccess, loading };
};
