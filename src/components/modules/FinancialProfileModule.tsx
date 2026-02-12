/**
 * Financial Profile Module - Redirects to the financial profile page
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, ExternalLink, Sparkles, Wallet } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface FinancialProfileModuleProps {
  module: {
    id: number;
    title: string;
    description: string;
  };
  onBack: () => void;
  onComplete: () => void;
}

export function FinancialProfileModule({ module, onBack, onComplete }: FinancialProfileModuleProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  // Check if financial profile is already complete
  useEffect(() => {
    const checkProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data } = await supabase
          .from('user_financial_profiles')
          .select('is_complete, revenu_mensuel_net, revenu_fiscal_annuel, epargne_livrets')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Consider complete if has basic financial data
        const hasData = data && (
          data.revenu_mensuel_net > 0 || 
          data.revenu_fiscal_annuel > 0 || 
          data.epargne_livrets > 0
        );
        
        setIsComplete(data?.is_complete || hasData);
      } catch (error) {
        console.error('Error checking profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkProfile();
  }, [user?.id]);

  const handleGoToProfile = () => {
    navigate('/employee/profile?tab=financial');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-lg font-semibold">{module.title}</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {isComplete ? (
            // Already complete view
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Profil financier complété</h2>
                <p className="text-muted-foreground">
                  Vous pouvez modifier vos informations ou continuer le parcours.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={onComplete} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Continuer le parcours
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleGoToProfile}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Modifier mon profil
                </Button>
              </div>
            </div>
          ) : (
            // Not complete - redirect to profile
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">{module.title}</CardTitle>
                <CardDescription className="text-base">
                  {module.description || "Complétez votre profil pour personnaliser vos recommandations et simulations."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Pourquoi renseigner ces informations ?
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Pré-remplissage automatique des simulateurs</li>
                    <li>• Recommandations personnalisées</li>
                    <li>• Calculs fiscaux précis (TMI, plafonds, etc.)</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    size="lg" 
                    onClick={handleGoToProfile}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Compléter mon profil
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={onComplete}
                    className="text-muted-foreground"
                  >
                    Passer cette étape
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
