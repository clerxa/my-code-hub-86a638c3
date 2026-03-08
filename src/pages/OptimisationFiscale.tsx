import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setBookingReferrer } from "@/hooks/useBookingReferrer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Save, User, CheckCircle, Loader2 } from "lucide-react";
import { OptimisationFiscaleSimulation } from "@/types/optimisation-fiscale";
import { OptimisationIntroScreen } from "@/components/optimisation/OptimisationIntroScreen";
import { SituationFiscaleStep } from "@/components/optimisation/SituationFiscaleStep";
import { DispositifsStep } from "@/components/optimisation/DispositifsStep";
import { MontantsStep } from "@/components/optimisation/MontantsStep";
import { ResultatsStep } from "@/components/optimisation/ResultatsStep";
import { toast } from "sonner";
import { useOptimisationFiscaleCalculations } from "@/hooks/useOptimisationFiscaleCalculations";
import { useFinancialProfilePrefill } from "@/hooks/useFinancialProfilePrefill";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SimulationValidationOverlay } from "@/components/simulators/SimulationValidationOverlay";
import { useSimulationTracking } from "@/hooks/useSimulationTracking";
import { useUnifiedSimulationSave } from "@/hooks/useUnifiedSimulationSave";
import { SaveSimulationDialog } from "@/components/simulators/SaveSimulationDialog";
import { useSimulationLoader } from "@/hooks/useSimulationLoader";
import { format } from "date-fns";

const STEPS = [
  { id: 1, title: "Situation fiscale" },
  { id: 2, title: "Choix des dispositifs" },
  { id: 3, title: "Saisie des montants" },
  { id: 4, title: "Résultats" },
];

export default function OptimisationFiscale() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const { calculerImpotFinal, calculerPlafondPERTotal } = useOptimisationFiscaleCalculations();
  const { getPrefillData, hasProfile, isLoading: profileLoading } = useFinancialProfilePrefill();
  const [isProfilePrefilled, setIsProfilePrefilled] = useState(false);

  // Simulation tracking
  const {
    isValidated,
    showValidationOverlay,
    startValidation,
    completeValidation,
    validateSimulation,
    markAsSaved,
    trackCTAClick,
    resetValidation,
  } = useSimulationTracking();

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
    type: 'optimisation_fiscale',
    queryCacheKey: 'simulations',
    onSuccess: () => markAsSaved(),
  });

  const [data, setData] = useState<Partial<OptimisationFiscaleSimulation>>({
    revenu_imposable: 0,
    revenus_professionnels: 0,
    situation_familiale: 'celibataire',
    nb_enfants: 0,
    tmi: 30,
    impot_avant: 0,
    montant_per: 0,
    plafond_per: 0,
    plafond_per_report_n1: 0,
    plafond_per_report_n2: 0,
    plafond_per_report_n3: 0,
    plafond_per_total: 0,
    reduction_per: 0,
    plafond_per_utilise: 0,
    dons_75_montant: 0,
    reduction_dons_75: 0,
    dons_66_montant: 0,
    reduction_dons_66: 0,
    montant_aide_domicile: 0,
    reduction_aide_domicile: 0,
    montant_garde_enfant: 0,
    reduction_garde_enfant: 0,
    prix_pinel: 0,
    taux_pinel: 9,
    duree_pinel: 6,
    reduction_pinel_annuelle: 0,
    prix_pinel_om: 0,
    taux_pinel_om: 23,
    duree_pinel_om: 6,
    reduction_pinel_om_annuelle: 0,
    montant_girardin: 0,
    taux_girardin: 110,
    reduction_girardin: 0,
    montant_pme: 0,
    reduction_pme: 0,
    montant_esus: 0,
    reduction_esus: 0,
    dispositifs_selectionnes: [],
    impot_apres: 0,
    economie_totale: 0,
  });

  // Fonction pour restaurer les données
  const restoreSimulationData = (simData: Record<string, unknown>) => {
    setData(prev => ({
      ...prev,
      revenu_imposable: (simData.revenu_imposable as number) || 0,
      revenus_professionnels: (simData.revenus_professionnels as number) || 0,
      situation_familiale: (simData.situation_familiale as any) || 'celibataire',
      nb_enfants: (simData.nb_enfants as number) || 0,
      tmi: (simData.tmi as number) || 30,
      impot_avant: (simData.impot_avant as number) || 0,
      montant_per: (simData.montant_per as number) || 0,
      plafond_per: (simData.plafond_per as number) || 0,
      plafond_per_report_n1: (simData.plafond_per_report_n1 as number) || 0,
      plafond_per_report_n2: (simData.plafond_per_report_n2 as number) || 0,
      plafond_per_report_n3: (simData.plafond_per_report_n3 as number) || 0,
      dons_75_montant: (simData.dons_75_montant as number) || 0,
      dons_66_montant: (simData.dons_66_montant as number) || 0,
      montant_aide_domicile: (simData.montant_aide_domicile as number) || 0,
      montant_garde_enfant: (simData.montant_garde_enfant as number) || 0,
      prix_pinel: (simData.prix_pinel as number) || 0,
      taux_pinel: (simData.taux_pinel as number) || 9,
      duree_pinel: (simData.duree_pinel as number) || 6,
      prix_pinel_om: (simData.prix_pinel_om as number) || 0,
      taux_pinel_om: (simData.taux_pinel_om as number) || 23,
      duree_pinel_om: (simData.duree_pinel_om as number) || 6,
      montant_girardin: (simData.montant_girardin as number) || 0,
      taux_girardin: (simData.taux_girardin as number) || 110,
      montant_pme: (simData.montant_pme as number) || 0,
      montant_esus: (simData.montant_esus as number) || 0,
      dispositifs_selectionnes: (simData.dispositifs_selectionnes as string[]) || [],
    }));
    setCurrentStep(4);
  };

  // Hook de chargement unifié
  const { isLoadingSimulation, loadedSimulationName, isFromHistory } = useSimulationLoader({
    onDataLoaded: (data, name) => {
      restoreSimulationData(data);
      if (name) setSimulationName(name);
      setShowIntro(false); // Skip intro when loading from history
    },
  });

  // Pré-remplir avec le profil financier (seulement si pas chargé depuis historique)
  useEffect(() => {
    if (!profileLoading && hasProfile && !isFromHistory) {
      const prefillData = getPrefillData();
      const situationMap: Record<string, 'celibataire' | 'marie' | 'pacse' | 'divorce' | 'veuf'> = {
        'celibataire': 'celibataire',
        'marie': 'marie',
        'pacse': 'pacse',
        'divorce': 'divorce',
        'veuf': 'veuf',
      };
      setData(prev => ({
        ...prev,
        revenu_imposable: prefillData.revenuFiscalAnnuel || prev.revenu_imposable,
        revenus_professionnels: prefillData.revenuMensuelNet * 12 || prev.revenus_professionnels,
        situation_familiale: situationMap[prefillData.situationFamiliale] || prev.situation_familiale,
        nb_enfants: prefillData.nbEnfants || prev.nb_enfants,
        tmi: prefillData.tmi || prev.tmi,
        plafond_per_report_n1: prefillData.plafondPERReportable || prev.plafond_per_report_n1,
      }));
      setIsProfilePrefilled(true);
    }
  }, [profileLoading, hasProfile, isFromHistory]);

  // Handle validation completion - log to back-office
  const handleValidationComplete = useCallback(async () => {
    const resultats = calculerImpotFinal(data);
    
    await validateSimulation({
      simulatorType: 'optimisation_fiscale',
      simulationData: data,
      resultsData: {
        impot_avant: data.impot_avant,
        impot_apres: resultats.impot_apres,
        economie_totale: resultats.economie_totale,
        reductions: resultats.reductions,
        tmi: data.tmi,
      },
    });

    completeValidation();
  }, [data, calculerImpotFinal, validateSimulation, completeValidation]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      // Before showing results, trigger validation overlay
      if (currentStep === 3) {
        startValidation();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Reset validation if going back from results
      if (currentStep === 4) {
        resetValidation();
      }
    }
  };

  const handleOpenSaveDialog = () => {
    const now = new Date();
    const defaultName = `Optimisation fiscale - ${format(now, 'dd/MM/yyyy HH:mm')}`;
    openSaveDialog(loadedSimulationName || defaultName);
  };

  const handleSave = () => {
    const resultats = calculerImpotFinal(data);
    
    saveSimulation({
      revenu_imposable: data.revenu_imposable || 0,
      revenus_professionnels: data.revenus_professionnels || 0,
      situation_familiale: data.situation_familiale || 'celibataire',
      nb_enfants: data.nb_enfants || 0,
      tmi: data.tmi || 0,
      impot_avant: data.impot_avant || 0,
      montant_per: data.montant_per || 0,
      plafond_per: data.plafond_per || 0,
      plafond_per_report_n1: data.plafond_per_report_n1 || 0,
      plafond_per_report_n2: data.plafond_per_report_n2 || 0,
      plafond_per_report_n3: data.plafond_per_report_n3 || 0,
      plafond_per_total: calculerPlafondPERTotal(data),
      reduction_per: resultats.reductions.reduction_per,
      plafond_per_utilise: resultats.reductions.plafond_per_utilise,
      dons_75_montant: data.dons_75_montant || 0,
      reduction_dons_75: resultats.reductions.reduction_dons_75,
      dons_66_montant: resultats.reductions.dons_66_montant,
      reduction_dons_66: resultats.reductions.reduction_dons_66,
      montant_aide_domicile: data.montant_aide_domicile || 0,
      reduction_aide_domicile: resultats.reductions.reduction_aide_domicile,
      montant_garde_enfant: data.montant_garde_enfant || 0,
      reduction_garde_enfant: resultats.reductions.reduction_garde_enfant,
      prix_pinel: data.prix_pinel || 0,
      taux_pinel: data.taux_pinel || 0,
      duree_pinel: data.duree_pinel || 0,
      reduction_pinel_annuelle: resultats.reductions.reduction_pinel_annuelle,
      prix_pinel_om: data.prix_pinel_om || 0,
      taux_pinel_om: data.taux_pinel_om || 0,
      duree_pinel_om: data.duree_pinel_om || 0,
      reduction_pinel_om_annuelle: resultats.reductions.reduction_pinel_om_annuelle,
      montant_girardin: data.montant_girardin || 0,
      reduction_girardin: resultats.reductions.reduction_girardin,
      montant_pme: data.montant_pme || 0,
      reduction_pme: resultats.reductions.reduction_pme,
      montant_esus: data.montant_esus || 0,
      reduction_esus: resultats.reductions.reduction_esus,
      dispositifs_selectionnes: data.dispositifs_selectionnes || [],
      impot_apres: resultats.impot_apres,
      economie_totale: resultats.economie_totale,
    });
  };

  const handlePrendreRdv = () => {
    // Track appointment CTA
    trackCTAClick('prise_rdv_expert', true);
    setBookingReferrer('/simulators/optimisation-fiscale');
    navigate("/expert-booking");
  };

  const handleCTAClick = (ctaId: string, isAppointment: boolean) => {
    trackCTAClick(ctaId, isAppointment);
  };

  const progress = (currentStep / STEPS.length) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <SituationFiscaleStep data={data} onChange={setData} />;
      case 2:
        return <DispositifsStep data={data} onChange={setData} />;
      case 3:
        return <MontantsStep data={data} onChange={setData} />;
      case 4:
        return (
          <ResultatsStep 
            data={data} 
            onPrendreRdv={handlePrendreRdv} 
            onSave={handleOpenSaveDialog}
            onCTAClick={handleCTAClick}
          />
        );
      default:
        return null;
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return data.revenu_imposable && data.revenus_professionnels && data.impot_avant;
      case 2:
        return (data.dispositifs_selectionnes || []).length > 0;
      case 3:
        return true;
      default:
        return true;
    }
  };

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
        simulatorName="Optimisation Fiscale"
        simulatorId="optimisation_fiscale"
      />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Intro screen */}
        {showIntro && !isFromHistory ? (
          <OptimisationIntroScreen onStart={() => setShowIntro(false)} />
        ) : (
        <>
        {/* Bandeau simulation chargée */}
        {isFromHistory && loadedSimulationName && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg mb-6 p-3 flex items-center justify-between">
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
          </div>
        )}

        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/employee/simulations')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux simulateurs
          </Button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl hero-gradient mb-2">Optimisation fiscale</h1>
              <p className="text-muted-foreground">
                {STEPS[currentStep - 1].title}
              </p>
              
              {isProfilePrefilled && currentStep === 1 && !isFromHistory && (
                <Alert className="mt-4 border-primary/20 bg-primary/5">
                  <User className="h-4 w-4" />
                  <AlertDescription>
                    Les champs ont été pré-remplis avec les données de votre profil financier.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {currentStep === 4 && isValidated && (
              <Button onClick={handleOpenSaveDialog} className="gap-2">
                <Save className="w-4 h-4" />
                Sauvegarder la simulation
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Étape {currentStep} sur {STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <div className="mb-8">
          {/* Only show results if validated */}
          {currentStep === 4 && !isValidated ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <CheckCircle className="h-16 w-16 text-muted-foreground/50" />
              <p className="text-muted-foreground">Validation en cours...</p>
            </div>
          ) : (
            renderStep()
          )}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>

          {currentStep < STEPS.length && (
            <Button onClick={handleNext} disabled={!canGoNext()}>
              {currentStep === 3 ? "Valider la simulation" : "Suivant"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>

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
  );
}