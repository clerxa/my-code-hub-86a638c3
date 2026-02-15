import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserCircle, Euro, Calendar, TrendingUp, PiggyBank, Wallet, List } from "lucide-react";
import { usePERCalculations } from "@/hooks/usePERCalculations";
import { useSimulationDefaults, useProductConstants } from "@/contexts/GlobalSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { useCTARulesEngine } from "@/hooks/useCTARulesEngine";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useFinancialProfilePrefill } from "@/hooks/useFinancialProfilePrefill";
import { useSimulationTracking } from "@/hooks/useSimulationTracking";
import { SimulatorWizard, SimulatorStep } from "@/components/simulators/SimulatorWizard";
import { SimulatorStepField } from "@/components/simulators/SimulatorStepField";
import { SimulatorResultsSection, ResultCard } from "@/components/simulators/SimulatorResultsSection";
import { SimulationValidationOverlay } from "@/components/simulators/SimulationValidationOverlay";
import { SaveSimulationDialog } from "@/components/simulators/SaveSimulationDialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useUnifiedSimulationSave } from "@/hooks/useUnifiedSimulationSave";
import { supabase } from "@/integrations/supabase/client";

const SimulateurPER = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { calculerSimulationLocale, calculerPlafondPER, isLoading: isCalculating } = usePERCalculations();
  const simulationDefaults = useSimulationDefaults();
  const productConstants = useProductConstants();
  const { getPrefillData, hasProfile, isLoading: isProfileLoading } = useFinancialProfilePrefill();

  // ID de simulation depuis l'URL
  const simulationId = searchParams.get('sim');
  const [isLoadingSimulation, setIsLoadingSimulation] = useState(!!simulationId);
  const [loadedSimulationName, setLoadedSimulationName] = useState<string | null>(null);

  // État du wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  // État du formulaire
  const [revenuFiscalFoyer, setRevenuFiscalFoyer] = useState(100000);
  const [revenusProfessionnels, setRevenusProfessionnels] = useState(50000);
  const [partsFiscales, setPartsFiscales] = useState(1);
  const [situationFamiliale, setSituationFamiliale] = useState<'celibataire' | 'couple'>('celibataire');
  const [ageActuel, setAgeActuel] = useState(simulationDefaults.default_age_actuel);
  const [ageRetraite, setAgeRetraite] = useState(productConstants.retirement_age_default);
  const [plafondReportable, setPlafondReportable] = useState(0);
  const [versementsPER, setVersementsPER] = useState(simulationDefaults.default_versement_per);
  
  // Hook de sauvegarde unifié
  const {
    showSaveDialog,
    openSaveDialog,
    closeSaveDialog,
    simulationName: nomSimulation,
    setSimulationName: setNomSimulation,
    saveSimulation,
    isSaving,
  } = useUnifiedSimulationSave({
    type: 'per',
    queryCacheKey: ['simulations', 'per_simulations'],
  });
  
  const [profileApplied, setProfileApplied] = useState(false);

  // Tracking
  const {
    startValidation,
    completeValidation,
    markAsSaved,
    trackCTAClick,
    showValidationOverlay,
    simulationLogId,
    validateSimulation,
  } = useSimulationTracking();

  // Helper pour restaurer les données d'une simulation
  const restoreSimulationData = (simData: Record<string, unknown>, name?: string) => {
    if (simData.revenu_fiscal) setRevenuFiscalFoyer(simData.revenu_fiscal as number);
    if (simData.revenus_professionnels) setRevenusProfessionnels(simData.revenus_professionnels as number);
    if (simData.parts_fiscales) setPartsFiscales(simData.parts_fiscales as number);
    if (simData.age_actuel) setAgeActuel(simData.age_actuel as number);
    if (simData.age_retraite) setAgeRetraite(simData.age_retraite as number);
    if (simData.plafond_per_reportable) setPlafondReportable(simData.plafond_per_reportable as number);
    if (simData.versements_per) setVersementsPER(simData.versements_per as number);
    
    setLoadedSimulationName(name || 'Simulation chargée');
    setNomSimulation(name || '');
    setProfileApplied(true);
    setShowResults(true);
  };

  // Chargement depuis l'URL ?sim=xxx ou location.state
  useEffect(() => {
    const loadSimulation = async () => {
      // Priorité 1: données passées via location.state (plus rapide)
      if (location.state?.simulationData) {
        restoreSimulationData(
          location.state.simulationData as Record<string, unknown>,
          location.state.simulationName
        );
        setIsLoadingSimulation(false);
        return;
      }

      // Priorité 2: charger depuis Supabase si on a un ID
      if (!simulationId) {
        setIsLoadingSimulation(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('simulations')
          .select('*')
          .eq('id', simulationId)
          .single();

        if (error) throw error;
        
        if (data && data.data) {
          restoreSimulationData(data.data as Record<string, unknown>, data.name || undefined);
        }
      } catch (error) {
        console.error('Erreur chargement simulation:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la simulation",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSimulation(false);
      }
    };

    loadSimulation();
  }, [simulationId, location.state, toast, setNomSimulation]);

  // Chargement depuis le profil financier (seulement si pas de simulation chargée)
  useEffect(() => {
    if (!isProfileLoading && hasProfile && !profileApplied && !simulationId && !location.state?.simulationData) {
      const data = getPrefillData();
      // Revenus pro individuels pour le plafond PER
      if (data.revenuFiscalAnnuel > 0) setRevenusProfessionnels(data.revenuFiscalAnnuel);
      // Revenu fiscal du foyer pour la TMI (utiliser revenu_fiscal_foyer si disponible)
      if (data.profile?.revenu_fiscal_foyer && data.profile.revenu_fiscal_foyer > 0) {
        setRevenuFiscalFoyer(data.profile.revenu_fiscal_foyer);
      } else if (data.revenuFiscalAnnuel > 0) {
        // Fallback: si pas de revenu foyer, utiliser le revenu individuel
        setRevenuFiscalFoyer(data.revenuFiscalAnnuel);
      }
      if (data.partsFiscales > 0) setPartsFiscales(data.partsFiscales);
      if (data.age) setAgeActuel(data.age);
      if (data.plafondPERReportable > 0) setPlafondReportable(data.plafondPERReportable);
      setProfileApplied(true);
    }
  }, [isProfileLoading, hasProfile, profileApplied, getPrefillData, location.state, simulationId]);

  // Calculs - plafond basé sur les revenus professionnels individuels
  const plafondAnnuel = useMemo(() => calculerPlafondPER(revenusProfessionnels), [revenusProfessionnels, calculerPlafondPER]);
  const plafondTotal = plafondAnnuel + plafondReportable;
  
  // Résultats - TMI basée sur le revenu fiscal du foyer (calcul local pour aperçu en temps réel)
  const resultats = useMemo(() => {
    return calculerSimulationLocale({
      revenu_fiscal: revenuFiscalFoyer,
      parts_fiscales: partsFiscales,
      age_actuel: ageActuel,
      age_retraite: ageRetraite,
      plafond_reportable: plafondReportable,
      versements_per: versementsPER,
    });
  }, [revenuFiscalFoyer, partsFiscales, ageActuel, ageRetraite, plafondReportable, versementsPER, calculerSimulationLocale]);

  // CTA intelligents
  const { ctas } = useCTARulesEngine("per", {
    tmi: resultats?.tmi,
    economie_impots: resultats?.economie_impots,
    effort_reel: resultats?.effort_reel,
    plafond_per_total: resultats?.plafond_per_total,
    versements_per: versementsPER,
    horizon_annees: resultats?.horizon_annees,
  });

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Validation avec effet wow
  const handleValidate = async () => {
    const formData = {
      revenu_fiscal_foyer: revenuFiscalFoyer,
      revenus_professionnels: revenusProfessionnels,
      parts_fiscales: partsFiscales,
      age_actuel: ageActuel,
      age_retraite: ageRetraite,
      plafond_reportable: plafondReportable,
      versements_per: versementsPER,
    };

    startValidation();
    
    await validateSimulation({
      simulatorType: "per",
      simulationData: formData,
      resultsData: resultats,
    });
  };

  const handleValidationComplete = () => {
    completeValidation();
    setShowResults(true);
  };

  // Sauvegarde
  const handleSave = async () => {
    const now = new Date();
    const defaultName = `PER - ${format(now, "dd/MM/yyyy HH:mm")}`;
    openSaveDialog(loadedSimulationName || defaultName);
  };

  const handleConfirmSave = async () => {
    const simulationData = {
      revenu_fiscal: revenuFiscalFoyer,
      revenus_professionnels: revenusProfessionnels,
      parts_fiscales: partsFiscales,
      age_actuel: ageActuel,
      age_retraite: ageRetraite,
      tmi: resultats.tmi,
      plafond_per_annuel: plafondAnnuel,
      plafond_per_reportable: plafondReportable,
      plafond_per_total: plafondTotal,
      versements_per: versementsPER,
      impot_sans_per: resultats.impot_sans_per,
      impot_avec_per: resultats.impot_avec_per,
      economie_impots: resultats.economie_impots,
      effort_reel: resultats.effort_reel,
      optimisation_fiscale: resultats.optimisation_fiscale,
      reduction_impots_max: resultats.reduction_impots_max,
      horizon_annees: resultats.horizon_annees,
      taux_rendement: resultats.taux_rendement,
      capital_futur: resultats.capital_futur,
      gain_financier: resultats.gain_financier,
    };

    await saveSimulation(simulationData);
    
    if (simulationLogId) {
      await markAsSaved();
    }
  };

  const handleCTAClick = async (ctaId: string, isAppointment: boolean) => {
    if (simulationLogId) {
      await trackCTAClick(ctaId, isAppointment);
    }
  };

  const handleReset = () => {
    setShowResults(false);
    setCurrentStep(0);
    setVersementsPER(5000);
  };

  // Définition des étapes
  const steps: SimulatorStep[] = [
    {
      id: "situation",
      title: "Votre situation fiscale",
      subtitle: "Informations pour calculer votre TMI et votre plafond PER",
      icon: Wallet,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Revenu fiscal du foyer"
            tooltip="Revenu net imposable total du foyer fiscal (pour le calcul de la TMI)"
            value={revenuFiscalFoyer}
            onChange={setRevenuFiscalFoyer}
            type="currency"
            showSlider
            sliderMin={20000}
            sliderMax={400000}
            sliderStep={5000}
            delay={0}
            icon={Euro}
          />

          <SimulatorStepField
            label="Vos revenus professionnels nets imposables"
            tooltip="Vos revenus professionnels personnels (salaires, BIC, BNC...) - c'est cette base qui détermine votre plafond PER"
            value={revenusProfessionnels}
            onChange={setRevenusProfessionnels}
            type="currency"
            showSlider
            sliderMin={10000}
            sliderMax={200000}
            sliderStep={2500}
            delay={1}
            icon={Euro}
          />
          
          <SimulatorStepField
            label="Situation familiale"
            type="custom"
            delay={2}
          >
            <RadioGroup 
              value={situationFamiliale} 
              onValueChange={(v) => {
                setSituationFamiliale(v as 'celibataire' | 'couple');
                setPartsFiscales(v === 'couple' ? 2 : 1);
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="celibataire" id="celibataire" />
                <Label htmlFor="celibataire">Célibataire</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="couple" id="couple" />
                <Label htmlFor="couple">Couple (marié/pacsé)</Label>
              </div>
            </RadioGroup>
          </SimulatorStepField>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Votre TMI estimée</span>
              <span className="text-2xl font-bold text-primary">{resultats.tmi}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tranche Marginale d'Imposition (basée sur le revenu du foyer)</p>
          </div>
        </div>
      ),
      isValid: () => revenuFiscalFoyer > 0 && revenusProfessionnels > 0,
    },
    {
      id: "horizon",
      title: "Votre horizon de placement",
      subtitle: "Pour calculer le potentiel de votre épargne",
      icon: Calendar,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Votre âge actuel"
            value={ageActuel}
            onChange={setAgeActuel}
            type="slider"
            min={18}
            max={65}
            step={1}
            delay={0}
            formatDisplay={(v) => `${v} ans`}
          />
          
          <SimulatorStepField
            label="Âge prévu de départ à la retraite"
            value={ageRetraite}
            onChange={setAgeRetraite}
            type="slider"
            min={55}
            max={70}
            step={1}
            delay={1}
            formatDisplay={(v) => `${v} ans`}
          />

          <div className="p-4 rounded-lg bg-secondary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Horizon de placement</span>
              <span className="text-xl font-bold">{ageRetraite - ageActuel} ans</span>
            </div>
          </div>
        </div>
      ),
      isValid: () => ageActuel < ageRetraite,
    },
    {
      id: "plafonds",
      title: "Vos plafonds PER",
      subtitle: "Vérifiez votre capacité de déduction",
      icon: PiggyBank,
      content: (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Plafond PER 2025 (calculé)</span>
              <span className="text-lg font-bold">{formatEuro(plafondAnnuel)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              10% de vos revenus professionnels (min 4 637 €, max 37 094 €)
            </p>
          </div>

          <SimulatorStepField
            label="Plafonds non utilisés (reportables)"
            tooltip="Plafonds non utilisés des 3 dernières années, disponibles sur votre avis d'imposition"
            value={plafondReportable}
            onChange={setPlafondReportable}
            type="currency"
            delay={1}
          />

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="font-medium">Plafond total disponible</span>
              <span className="text-2xl font-bold text-primary">{formatEuro(plafondTotal)}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "versements",
      title: "Votre versement PER",
      subtitle: "Combien souhaitez-vous épargner ?",
      icon: TrendingUp,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Montant à verser sur votre PER"
            value={versementsPER}
            onChange={setVersementsPER}
            type="currency"
            showSlider
            sliderMin={0}
            sliderMax={Math.min(plafondTotal, 50000)}
            sliderStep={500}
            highlight
            delay={0}
          />

          {versementsPER > plafondTotal && (
            <Alert variant="destructive">
              <AlertDescription>
                Attention, vous dépassez votre plafond de {formatEuro(versementsPER - plafondTotal)}. 
                Le montant excédentaire ne sera pas déductible.
              </AlertDescription>
            </Alert>
          )}

        </div>
      ),
      isValid: () => versementsPER > 0,
    },
  ];

  // Résultats
  const resultsContent = (
    <SimulatorResultsSection
      mainResult={{
        title: "Économie d'impôts estimée",
        value: resultats.economie_impots,
        subtitle: `Soit ${((resultats.economie_impots / versementsPER) * 100).toFixed(0)}% de votre versement`,
        badge: `TMI ${resultats.tmi}%`,
      }}
      ctas={ctas}
      onCTAClick={handleCTAClick}
      onSave={handleSave}
      onReset={handleReset}
      isSaving={isSaving}
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ResultCard
          title="Versement PER"
          value={versementsPER}
          icon={PiggyBank}
          delay={0}
        />
        <ResultCard
          title="Effort réel après impôts"
          value={resultats.effort_reel}
          subtitle="Ce que vous débourcez vraiment"
          icon={Wallet}
          variant="highlight"
          delay={1}
        />
        <ResultCard
          title="Capital estimé à la retraite"
          value={resultats.capital_futur}
          subtitle={`Dans ${resultats.horizon_annees} ans (${resultats.taux_rendement}%/an)`}
          icon={TrendingUp}
          variant="success"
          delay={2}
        />
      </div>

      <div className="mt-6 p-4 rounded-lg bg-muted/30">
        <h3 className="font-medium mb-3">Détail de votre fiscalité</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Impôt sans PER</span>
            <span className="font-medium">{formatEuro(resultats.impot_sans_per)}</span>
          </div>
          <div className="flex justify-between">
            <span>Impôt avec PER</span>
            <span className="font-medium">{formatEuro(resultats.impot_avec_per)}</span>
          </div>
          <div className="flex justify-between text-green-600 font-medium pt-2 border-t">
            <span>Économie réalisée</span>
            <span>-{formatEuro(resultats.economie_impots)}</span>
          </div>
        </div>
      </div>
    </SimulatorResultsSection>
  );

  // Empêche toute soumission HTML involontaire (form submit natif)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.warn('[SimulateurPER] Form submit intercepté et bloqué');
  };

  // Affichage pendant le chargement d'une simulation
  if (isLoadingSimulation) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Chargement de la simulation...</p>
        </div>
      </div>
    );
  }

  return (
    <div onSubmit={handleFormSubmit}>
      <Header />
      
      {/* Bandeau de simulation chargée */}
      {loadedSimulationName && showResults && (
        <div className="container mx-auto px-4 pt-4">
          <Alert className="border-blue-500/20 bg-blue-50 dark:bg-blue-950/20">
            <AlertDescription className="flex items-center justify-between">
              <span className="font-medium">📊 Simulation : {loadedSimulationName}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/employee/simulations?tab=historique')}
              >
                Retour à l'historique
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {hasProfile && !showResults && currentStep === 0 && !loadedSimulationName && (
        <div className="container mx-auto px-4 pt-4">
          <Alert className="border-primary/20 bg-primary/5">
            <UserCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="flex items-center justify-between">
              <span>Vos données ont été pré-remplies depuis votre profil financier.</span>
              <Button variant="link" size="sm" onClick={() => navigate('/employee/simulations')}>
                Modifier
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Lien vers historique */}
      {!showResults && currentStep === 0 && (
        <div className="container mx-auto px-4 pt-2 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/employee/simulations?tab=historique")}
          >
            <List className="h-4 w-4 mr-2" />
            Mes simulations
          </Button>
        </div>
      )}

      <SimulatorWizard
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onValidate={handleValidate}
        isValidating={showValidationOverlay}
        resultsContent={resultsContent}
        showResults={showResults}
        title="Simulateur PER"
        subtitle="Calculez vos économies d'impôts et votre capital retraite"
        onBack={() => navigate("/employee/simulations")}
      />

      <SimulationValidationOverlay
        isValidating={showValidationOverlay}
        onComplete={handleValidationComplete}
        simulatorName="Simulateur PER"
        simulatorId="per"
      />

      <SaveSimulationDialog
        open={showSaveDialog}
        // Ne gérer ici que la fermeture (pattern stable, évite les boucles open->onOpenChange->open)
        onOpenChange={(open) => {
          if (!open) closeSaveDialog();
        }}
        simulationName={nomSimulation}
        onSimulationNameChange={setNomSimulation}
        onSave={handleConfirmSave}
        isSaving={isSaving}
      />
    </div>
  );
};

export default SimulateurPER;
