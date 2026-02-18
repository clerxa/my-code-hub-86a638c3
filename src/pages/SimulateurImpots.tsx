import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { ArrowLeft, Edit, Loader2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { useCTARulesEngine } from "@/hooks/useCTARulesEngine";
import { SimulationCTASection } from "@/components/simulators/SimulationCTASection";
import { useFinancialProfilePrefill } from "@/hooks/useFinancialProfilePrefill";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SimulationValidationOverlay } from "@/components/simulators/SimulationValidationOverlay";
import { useSimulationTracking } from "@/hooks/useSimulationTracking";
import { useUnifiedSimulationSave } from "@/hooks/useUnifiedSimulationSave";
import { SaveSimulationDialog } from "@/components/simulators/SaveSimulationDialog";
import { SimulatorDisclaimer } from "@/components/simulators/SimulatorDisclaimer";
import { useSimulationLoader } from "@/hooks/useSimulationLoader";
import { format } from "date-fns";
import { TaxInputForm, TaxResultsSection, TaxBracketChart } from "@/components/simulators/impots";

import { useFiscalRules } from "@/contexts/GlobalSettingsContext";
import { calculateImpotDetaille, calculatePartsFiscales, getPlafondDemiPart } from "@/utils/taxCalculations";

interface TaxResult {
  parts: number;
  quotientFamilial: number;
  impotBrut: number;
  reductionsImpot: number;
  creditsImpot: number;
  impotNet: number;
  tauxMoyen: number;
  tauxMarginal: number;
  economieQuotientFamilial: number;
}

const SimulateurImpots = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fiscalRules = useFiscalRules();
  const { tax_brackets } = fiscalRules;
  const { getPrefillData, hasProfile, isLoading: profileLoading } = useFinancialProfilePrefill();
  const [isProfilePrefilled, setIsProfilePrefilled] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Simulation tracking
  const {
    isValidated,
    showValidationOverlay,
    startValidation,
    completeValidation,
    validateSimulation,
    markAsSaved,
    trackCTAClick,
  } = useSimulationTracking();
  
  const [revenuImposable, setRevenuImposable] = useState("");
  const [statutMarital, setStatutMarital] = useState("celibataire");
  const [nombreEnfants, setNombreEnfants] = useState("0");
  const [reductionsImpot, setReductionsImpot] = useState("");
  const [creditsImpot, setCreditsImpot] = useState("");
  
  const [resultat, setResultat] = useState<TaxResult | null>(null);

  // Fonction pour restaurer les données
  const restoreSimulationData = (simData: Record<string, unknown>) => {
    if (simData.revenu_imposable !== undefined) setRevenuImposable(String(simData.revenu_imposable));
    if (simData.statut_marital !== undefined) setStatutMarital(simData.statut_marital as string);
    if (simData.nombre_enfants !== undefined) setNombreEnfants(String(simData.nombre_enfants));
    if (simData.reductions_impot !== undefined) setReductionsImpot(String(simData.reductions_impot));
    if (simData.credits_impot !== undefined) setCreditsImpot(String(simData.credits_impot));
    
    // Recalcul automatique si on a les résultats
    if (simData.parts !== undefined && simData.impot_net !== undefined) {
      setResultat({
        parts: simData.parts as number,
        quotientFamilial: simData.quotient_familial as number,
        impotBrut: simData.impot_brut as number,
        reductionsImpot: (simData.reductions_impot as number) || 0,
        creditsImpot: (simData.credits_impot as number) || 0,
        impotNet: simData.impot_net as number,
        tauxMoyen: simData.taux_moyen as number,
        tauxMarginal: simData.taux_marginal as number,
        economieQuotientFamilial: (simData.economie_quotient_familial as number) || 0,
      });
    }
  };

  // Hook de chargement unifié
  const { isLoadingSimulation, loadedSimulationName, isFromHistory } = useSimulationLoader({
    onDataLoaded: (data, name) => {
      restoreSimulationData(data);
      if (name) setSimulationName(name);
    },
  });

  // Hook unifié pour la sauvegarde
  const {
    showSaveDialog,
    openSaveDialog,
    closeSaveDialog,
    simulationName,
    setSimulationName,
    saveSimulation,
    isSaving,
    showExpertPrompt,
    closeExpertPrompt,
  } = useUnifiedSimulationSave({
    type: 'impots',
    queryCacheKey: 'simulations',
    onSuccess: () => markAsSaved(),
  });

  // Pré-remplir avec le profil financier (seulement si pas chargé depuis historique)
  useEffect(() => {
    if (!profileLoading && hasProfile && !isFromHistory) {
      const prefillData = getPrefillData();
      if (prefillData.revenuFiscalAnnuel > 0) {
        setRevenuImposable(prefillData.revenuFiscalAnnuel.toString());
      }
      if (prefillData.situationFamiliale) {
        setStatutMarital(prefillData.situationFamiliale);
      }
      if (prefillData.nbEnfants > 0) {
        setNombreEnfants(prefillData.nbEnfants.toString());
      }
      setIsProfilePrefilled(true);
    }
  }, [profileLoading, hasProfile, isFromHistory]);

  const calculerParts = (statut: string, enfants: number): number => {
    return calculatePartsFiscales(statut, enfants, fiscalRules);
  };

  const calculerImpot = (revenu: number, parts: number): { impot: number; tauxMarginal: number } => {
    return calculateImpotDetaille(revenu, parts, tax_brackets);
  };

  // Calcul de l'économie grâce au quotient familial (vs célibataire)
  const calculerEconomieQF = (revenu: number, partsActuelles: number): number => {
    if (partsActuelles <= 1) return 0;
    
    const { impot: impotCelibataire } = calculerImpot(revenu, 1);
    const { impot: impotActuel } = calculerImpot(revenu, partsActuelles);
    
    const plafondDemiPart = getPlafondDemiPart(fiscalRules);
    const demiPartsSupp = (partsActuelles - 1) * 2;
    const plafondTotal = demiPartsSupp * plafondDemiPart;
    const economieTheorique = impotCelibataire - impotActuel;
    
    return Math.min(economieTheorique, plafondTotal);
  };

  const handleCalculer = async () => {
    const revenu = parseFloat(revenuImposable);
    const enfants = parseInt(nombreEnfants);

    if (isNaN(revenu) || revenu < 0) {
      toast.error("Veuillez entrer un revenu valide");
      return;
    }

    setIsCalculating(true);

    // Simuler un délai pour l'effet de calcul
    await new Promise(resolve => setTimeout(resolve, 800));

    const parts = calculerParts(statutMarital, enfants);
    const quotientFamilial = revenu / parts;
    const { impot, tauxMarginal } = calculerImpot(revenu, parts);
    const economieQF = calculerEconomieQF(revenu, parts);
    
    const reductions = parseFloat(reductionsImpot) || 0;
    const credits = parseFloat(creditsImpot) || 0;
    
    const impotApresReductions = Math.max(0, impot - reductions);
    const impotFinal = Math.max(0, impotApresReductions - credits);
    const tauxMoyen = revenu > 0 ? (impotFinal / revenu) * 100 : 0;

    setResultat({
      parts,
      quotientFamilial,
      impotBrut: Math.max(0, impot),
      reductionsImpot: reductions,
      creditsImpot: credits,
      impotNet: impotFinal,
      tauxMoyen,
      tauxMarginal,
      economieQuotientFamilial: economieQF,
    });

    setIsCalculating(false);
    startValidation();

    // Scroll vers les résultats
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleValidationComplete = useCallback(async () => {
    if (!resultat) {
      completeValidation();
      return;
    }
    
    await validateSimulation({
      simulatorType: 'impots',
      simulationData: {
        revenu_imposable: parseFloat(revenuImposable),
        statut_marital: statutMarital,
        nombre_enfants: parseInt(nombreEnfants),
        reductions_impot: parseFloat(reductionsImpot) || 0,
        credits_impot: parseFloat(creditsImpot) || 0,
      },
      resultsData: {
        parts: resultat.parts,
        quotient_familial: resultat.quotientFamilial,
        impot_brut: resultat.impotBrut,
        impot_net: resultat.impotNet,
        taux_moyen: resultat.tauxMoyen,
        taux_marginal: resultat.tauxMarginal,
        economie_quotient_familial: resultat.economieQuotientFamilial,
      },
    });

    completeValidation();
  }, [resultat, revenuImposable, statutMarital, nombreEnfants, reductionsImpot, creditsImpot, validateSimulation, completeValidation]);

  const handleCTAClick = (ctaId: string, isAppointment: boolean) => {
    trackCTAClick(ctaId, isAppointment);
  };

  const handleOpenSaveDialog = () => {
    if (!resultat) {
      toast.error("Veuillez d'abord calculer votre simulation");
      return;
    }
    const now = new Date();
    const defaultName = `Impôts - ${format(now, 'dd/MM/yyyy HH:mm')}`;
    openSaveDialog(loadedSimulationName || defaultName);
  };

  const handleSave = () => {
    if (!resultat) {
      toast.error("Veuillez d'abord calculer votre simulation");
      return;
    }
    
    saveSimulation({
      revenu_imposable: parseFloat(revenuImposable),
      statut_marital: statutMarital,
      nombre_enfants: parseInt(nombreEnfants),
      reductions_impot: parseFloat(reductionsImpot) || 0,
      credits_impot: parseFloat(creditsImpot) || 0,
      parts: resultat.parts,
      quotient_familial: resultat.quotientFamilial,
      impot_brut: resultat.impotBrut,
      impot_net: resultat.impotNet,
      taux_moyen: resultat.tauxMoyen,
      taux_marginal: resultat.tauxMarginal,
      economie_quotient_familial: resultat.economieQuotientFamilial,
    });
  };

  const handleModifier = () => {
    setResultat(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // CTA intelligents
  const { ctas } = useCTARulesEngine('impots', {
    tmi: resultat?.tauxMarginal,
    impot_net: resultat?.impotNet,
    nb_enfants: parseInt(nombreEnfants),
    statut_marital: statutMarital,
  });

  // Loading state
  if (isLoadingSimulation) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Validation Overlay */}
      <SimulationValidationOverlay 
        isValidating={showValidationOverlay} 
        onComplete={handleValidationComplete}
        simulatorName="Simulateur d'Impôts"
        simulatorId="impots"
      />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Bandeau simulation chargée */}
        {isFromHistory && loadedSimulationName && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/20 rounded-lg mb-6 p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary">
                Simulation : {loadedSimulationName}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/employee/simulations?tab=historique')}
              className="text-primary hover:text-primary/80"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour à l'historique
            </Button>
          </motion.div>
        )}

        <Button
          variant="ghost"
          onClick={() => navigate('/employee/simulations')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux simulateurs
        </Button>

        {/* Header */}
        <div className="text-center mb-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold hero-gradient mb-3"
          >
            Simulateur d'impôt sur le revenu
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Estimez votre impôt 2025 en quelques clics
          </motion.p>
          
          {isProfilePrefilled && !isFromHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Alert className="mt-4 border-primary/20 bg-primary/5 max-w-xl mx-auto">
                <User className="h-4 w-4" />
                <AlertDescription>
                  Champs pré-remplis avec votre profil financier
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </div>

        {/* Formulaire de saisie - Visible uniquement si pas de résultat */}
        <AnimatePresence mode="wait">
          {!resultat && (
            <TaxInputForm
              revenuImposable={revenuImposable}
              setRevenuImposable={setRevenuImposable}
              statutMarital={statutMarital}
              setStatutMarital={setStatutMarital}
              nombreEnfants={nombreEnfants}
              setNombreEnfants={setNombreEnfants}
              reductionsImpot={reductionsImpot}
              setReductionsImpot={setReductionsImpot}
              creditsImpot={creditsImpot}
              setCreditsImpot={setCreditsImpot}
              onCalculer={handleCalculer}
              isCalculating={isCalculating}
            />
          )}
        </AnimatePresence>

        {/* Résultats - Affichés après calcul */}
        <AnimatePresence>
          {resultat && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Bouton modifier */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <Button
                  variant="outline"
                  onClick={handleModifier}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Modifier mes informations
                </Button>
              </motion.div>

              {/* Section des résultats */}
              <TaxResultsSection 
                resultat={resultat} 
                revenuImposable={parseFloat(revenuImposable)}
              />

              {/* Graphique waterfall des tranches */}
              <TaxBracketChart 
                revenuImposable={parseFloat(revenuImposable)}
                parts={resultat.parts}
              />

              {/* CTA intelligents */}
              {isValidated && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="pb-20 relative z-10"
                >
                  <SimulationCTASection 
                    ctas={ctas}
                    onSave={handleOpenSaveDialog}
                    onCTAClick={handleCTAClick}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <SimulatorDisclaimer />

        <SaveSimulationDialog
          open={showSaveDialog}
          onOpenChange={(open) => !open && closeSaveDialog()}
          simulationName={simulationName}
          onSimulationNameChange={setSimulationName}
          onSave={handleSave}
          isSaving={isSaving}
          showExpertPrompt={showExpertPrompt}
          onCloseExpertPrompt={closeExpertPrompt}
        />
      </div>
    </div>
  );
};

export default SimulateurImpots;
