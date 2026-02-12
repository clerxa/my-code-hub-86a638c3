import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Lock, Building2, Calculator } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { SimulationQuotaDialog } from "./SimulationQuotaDialog";
import { useSimulationQuota } from "@/hooks/useSimulationQuota";

interface CheckPlanAccessProps {
  featureKey: string;
  children: React.ReactNode;
}

export const CheckPlanAccess = ({ featureKey, children }: CheckPlanAccessProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(true);
  const [loading, setLoading] = useState(true);
  const [feature, setFeature] = useState<any>(null);
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [hasShownQuotaDialog, setHasShownQuotaDialog] = useState(false);

  // Use simulation quota hook
  const { 
    simulationsUsed = 0, 
    simulationsRemaining = 0, 
    hasPartnership, 
    isLimited,
    limit = 10,
    isLoading: quotaLoading,
    allowedSimulators = [],
    isSimulatorAllowed,
  } = useSimulationQuota() || {};

  useEffect(() => {
    checkAccess();
  }, [user, featureKey]);

  // Show quota dialog for non-partner users on first access (but not if limited)
  useEffect(() => {
    if (!quotaLoading && !hasPartnership && !hasShownQuotaDialog && hasAccess && !loading) {
      // Only show dialog if user has some simulations used (not first time)
      // or if they're getting low on quota
      if (simulationsUsed > 0 && simulationsRemaining <= 5 && !isLimited) {
        setShowQuotaDialog(true);
        setHasShownQuotaDialog(true);
      }
    }
  }, [quotaLoading, hasPartnership, hasShownQuotaDialog, simulationsUsed, simulationsRemaining, isLimited, hasAccess, loading]);

  const checkAccess = async () => {
    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    try {
      // Récupérer la fonctionnalité
      const { data: featureData, error: featureError } = await supabase
        .from("features")
        .select("*")
        .eq("cle_technique", featureKey)
        .eq("active", true)
        .maybeSingle();

      if (featureError) throw featureError;

      if (!featureData) {
        // Si la fonctionnalité n'existe pas, on autorise l'accès
        setHasAccess(true);
        setLoading(false);
        return;
      }

      setFeature(featureData);

      // Récupérer le profil et l'entreprise de l'utilisateur
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Vérifier si l'entreprise a un partenariat
      if (profileData?.company_id) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("partnership_type")
          .eq("id", profileData.company_id)
          .maybeSingle();

        const hasPartnership = companyData?.partnership_type && 
          companyData.partnership_type.toLowerCase() !== 'aucun';
        if (hasPartnership) {
          // L'entreprise a un partenariat actif, accès autorisé
          setHasAccess(true);
          setLoading(false);
          return;
        }
      }

      // L'utilisateur n'a pas de partenariat
      // Si la feature requiert un partenariat, vérifier le quota de simulations
      if (featureData.requires_partnership) {
        // Check simulation quota for simulator features
        const isSimulatorFeature = featureKey.startsWith('simulateur_') || featureKey === 'optimisation_fiscale';
        if (isSimulatorFeature) {
          // First check if this simulator is allowed for non-partners
          const simulatorAllowed = isSimulatorAllowed ? isSimulatorAllowed(featureKey) : allowedSimulators.includes(featureKey);
          
          if (!simulatorAllowed) {
            // Simulator not in allowed list for non-partners
            setHasAccess(false);
          } else {
            // Get simulation count
            const { count } = await supabase
              .from("simulation_logs")
              .select("*", { count: 'exact', head: true })
              .eq("user_id", user.id);
            
            const simsUsed = count || 0;
            const simsRemaining = Math.max(0, limit - simsUsed);
            
            // Allow access if quota not exhausted
            setHasAccess(simsRemaining > 0);
          }
        } else {
          setHasAccess(false);
        }
      } else {
        setHasAccess(true);
      }
    } catch (error) {
      console.error("Error checking plan access:", error);
      setHasAccess(true); // En cas d'erreur, on autorise l'accès
    } finally {
      setLoading(false);
    }
  };

  if (loading || quotaLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show quota exhausted state for non-partner users who ran out of simulations
  if (!hasAccess && !hasPartnership && isLimited && feature) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-2xl w-full border-2 border-red-200 dark:border-red-800">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Quota de simulations atteint</CardTitle>
            <CardDescription className="text-base">
              Vous avez utilisé vos {limit} simulations gratuites.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Simulations utilisées</span>
                <Badge variant="destructive">{simulationsUsed} / {limit}</Badge>
              </div>
              <Progress value={100} className="h-2 [&>div]:bg-red-500" />
            </div>

            <p className="text-center text-muted-foreground">
              Pour continuer à utiliser nos simulateurs financiers, proposez un partenariat à votre entreprise et bénéficiez d'un accès illimité.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => navigate('/proposer-partenariat')}
              >
                <Building2 className="h-4 w-4" />
                Proposer un partenariat
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => navigate(-1)}
              >
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Original locked state for non-simulator features
  if (!hasAccess && feature) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-2xl w-full border-2 border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{feature.nom_fonctionnalite}</CardTitle>
            <CardDescription className="text-base">
              {feature.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Cette fonctionnalité est disponible pour les entreprises partenaires
              </p>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg">
                <Building2 className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">
                  Partenariat requis
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full"
                onClick={() => navigate('/proposer-partenariat')}
              >
                Proposer un partenariat à mon entreprise
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => navigate(-1)}
              >
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {children}
      
      {/* Quota warning dialog for non-partner users */}
      <SimulationQuotaDialog
        open={showQuotaDialog}
        onOpenChange={setShowQuotaDialog}
        simulationsUsed={simulationsUsed}
        simulationsRemaining={simulationsRemaining}
        limit={limit}
        isLimited={isLimited || false}
      />
    </>
  );
};
