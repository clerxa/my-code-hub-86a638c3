import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home, TrendingUp, TrendingDown, Building2, Receipt, Calculator, UserCircle, Euro, Calendar, Percent } from 'lucide-react';
import { useLMNPCalculations, LMNPInputs } from '@/hooks/useLMNPCalculations';
import { useFinancialProfilePrefill } from '@/hooks/useFinancialProfilePrefill';
import { useUnifiedSimulationSave } from '@/hooks/useUnifiedSimulationSave';
import { SaveSimulationDialog } from '@/components/simulators/SaveSimulationDialog';
import { SimulatorWizard, SimulatorStep } from '@/components/simulators/SimulatorWizard';
import { SimulatorStepField } from '@/components/simulators/SimulatorStepField';
import { SimulatorResultsSection, ResultCard } from '@/components/simulators/SimulatorResultsSection';
import { SimulationValidationOverlay } from '@/components/simulators/SimulationValidationOverlay';
import { SimulatorDisclaimer } from '@/components/simulators/SimulatorDisclaimer';
import { useSimulationTracking } from '@/hooks/useSimulationTracking';
import { useCTARulesEngine } from '@/hooks/useCTARulesEngine';
import { useSimulationLoader } from '@/hooks/useSimulationLoader';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

const SimulateurLMNP = () => {
  const navigate = useNavigate();
  const { calculerTotalCharges, calculerSimulationLocale } = useLMNPCalculations();
  const { getPrefillData, hasProfile, isLoading: isProfileLoading } = useFinancialProfilePrefill();

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

  // Save simulation hook (unified)
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
    type: 'lmnp',
    queryCacheKey: ['simulations', 'lmnp_simulations'],
  });

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Form state
  const [inputs, setInputs] = useState<LMNPInputs>({
    recettes: 12000,
    interets_emprunt: 0,
    assurance_pno: 0,
    assurance_gli: 0,
    gestion_locative: 0,
    expert_comptable: 0,
    charges_copro: 0,
    taxe_fonciere: 0,
    cfe: 0,
    travaux_entretien: 0,
    petit_materiel: 0,
    frais_deplacement: 0,
    autre_charge: 0,
    valeur_bien: 150000,
    duree_immo: 30,
    valeur_mobilier: 10000,
    duree_mobilier: 7,
    tmi: 30,
  });

  const [profileApplied, setProfileApplied] = useState(false);

  // Fonction pour restaurer les données d'une simulation
  const restoreSimulationData = useCallback((data: Record<string, unknown>) => {
    setInputs({
      recettes: (data.recettes as number) || 12000,
      interets_emprunt: (data.interets_emprunt as number) || 0,
      assurance_pno: (data.assurance_pno as number) || 0,
      assurance_gli: (data.assurance_gli as number) || 0,
      gestion_locative: (data.gestion_locative as number) || 0,
      expert_comptable: (data.expert_comptable as number) || 0,
      charges_copro: (data.charges_copro as number) || 0,
      taxe_fonciere: (data.taxe_fonciere as number) || 0,
      cfe: (data.cfe as number) || 0,
      travaux_entretien: (data.travaux_entretien as number) || 0,
      petit_materiel: (data.petit_materiel as number) || 0,
      frais_deplacement: (data.frais_deplacement as number) || 0,
      autre_charge: (data.autre_charge as number) || 0,
      valeur_bien: (data.valeur_bien as number) || 150000,
      duree_immo: (data.duree_immo as number) || 30,
      valeur_mobilier: (data.valeur_mobilier as number) || 10000,
      duree_mobilier: (data.duree_mobilier as number) || 7,
      tmi: (data.tmi as number) || 30,
    });
    setProfileApplied(true);
    setShowResults(true);
  }, []);

  // Chargement depuis l'URL ou location.state
  const { isLoadingSimulation, loadedSimulationName, isFromHistory } = useSimulationLoader({
    onDataLoaded: (data, name) => {
      restoreSimulationData(data);
      if (name) setSimulationName(name);
    },
  });

  // Pré-remplir depuis le profil financier (seulement si pas de simulation chargée)
  useEffect(() => {
    if (!isProfileLoading && hasProfile && !profileApplied && !isFromHistory) {
      const data = getPrefillData();
      if (data.tmi > 0) {
        setInputs(prev => ({ ...prev, tmi: data.tmi }));
      }
      setProfileApplied(true);
    }
  }, [isProfileLoading, hasProfile, profileApplied, getPrefillData, isFromHistory]);

  // Calculs
  const totalCharges = useMemo(() => calculerTotalCharges(inputs), [inputs, calculerTotalCharges]);
  const resultats = useMemo(() => calculerSimulationLocale(inputs), [inputs, calculerSimulationLocale]);

  // CTAs
  const { ctas } = useCTARulesEngine('lmnp', {
    recettes: inputs.recettes,
    total_charges: totalCharges,
    resultat_fiscal_reel: resultats.resultat_fiscal_reel,
    resultat_fiscal_micro: resultats.resultat_fiscal_micro,
    meilleur_regime: resultats.meilleur_regime,
    economie: Math.abs(resultats.fiscalite_totale_micro - resultats.fiscalite_totale_reel),
  });

  const updateInput = (key: keyof LMNPInputs, value: number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleValidationComplete = async () => {
    await validateSimulation({
      simulatorType: 'lmnp',
      simulationData: inputs,
      resultsData: {
        total_charges: totalCharges,
        resultat_fiscal_reel: resultats.resultat_fiscal_reel,
        resultat_fiscal_micro: resultats.resultat_fiscal_micro,
        fiscalite_totale_reel: resultats.fiscalite_totale_reel,
        fiscalite_totale_micro: resultats.fiscalite_totale_micro,
        meilleur_regime: resultats.meilleur_regime,
      },
    });
    completeValidation();
  };

  const handleSave = () => {
    const now = new Date();
    const defaultName = `LMNP - ${format(now, "dd/MM/yyyy HH:mm")}`;
    openSaveDialog(loadedSimulationName || defaultName);
  };

  const handleConfirmSave = async () => {
    await saveSimulation({
      recettes: inputs.recettes,
      interets_emprunt: inputs.interets_emprunt,
      assurance_pno: inputs.assurance_pno,
      assurance_gli: inputs.assurance_gli,
      gestion_locative: inputs.gestion_locative,
      expert_comptable: inputs.expert_comptable,
      charges_copro: inputs.charges_copro,
      taxe_fonciere: inputs.taxe_fonciere,
      cfe: inputs.cfe,
      travaux_entretien: inputs.travaux_entretien,
      petit_materiel: inputs.petit_materiel,
      frais_deplacement: inputs.frais_deplacement,
      autre_charge: inputs.autre_charge,
      total_charges: totalCharges,
      valeur_bien: inputs.valeur_bien,
      duree_immo: inputs.duree_immo,
      valeur_mobilier: inputs.valeur_mobilier,
      duree_mobilier: inputs.duree_mobilier,
      tmi: inputs.tmi,
      resultat_avant_amort: resultats.resultat_avant_amort,
      amort_immo: resultats.amort_immo,
      amort_mobilier: resultats.amort_mobilier,
      amort_total: resultats.amort_total,
      resultat_fiscal_reel: resultats.resultat_fiscal_reel,
      resultat_fiscal_micro: resultats.resultat_fiscal_micro,
      ir_reel: resultats.ir_reel,
      ps_reel: resultats.ps_reel,
      ir_micro: resultats.ir_micro,
      ps_micro: resultats.ps_micro,
      fiscalite_totale_reel: resultats.fiscalite_totale_reel,
      fiscalite_totale_micro: resultats.fiscalite_totale_micro,
      meilleur_regime: resultats.meilleur_regime,
      amort_non_deduits: resultats.amort_non_deduits,
    });
    markAsSaved();
  };

  const handleCTAClick = (ctaId: string, isAppointment: boolean) => {
    trackCTAClick(ctaId, isAppointment);
  };

  const handleValidate = () => {
    if (inputs.recettes <= 0) {
      return;
    }
    startValidation();
    setShowResults(true);
  };

  const handleReset = () => {
    setShowResults(false);
    setCurrentStep(0);
  };

  // Wizard steps
  const steps: SimulatorStep[] = [
    {
      id: 'revenus',
      title: 'Revenus locatifs',
      subtitle: 'Renseignez vos recettes locatives annuelles',
      icon: Receipt,
      content: (
        <div className="space-y-6">
          {hasProfile && (
            <Alert className="border-primary/20 bg-primary/5">
              <UserCircle className="h-4 w-4 text-primary" />
              <AlertDescription>
                Votre TMI a été pré-rempli depuis votre profil financier.
              </AlertDescription>
            </Alert>
          )}

          <SimulatorStepField
            label="Recettes locatives annuelles"
            value={inputs.recettes}
            onChange={(v) => updateInput('recettes', v)}
            type="currency"
            icon={Euro}
            tooltip="Total des loyers perçus sur l'année"
            delay={0}
          />

          <SimulatorStepField
            label="Votre TMI"
            value={inputs.tmi}
            onChange={(v) => updateInput('tmi', v)}
            type="slider"
            min={0}
            max={45}
            step={1}
            suffix="%"
            icon={Percent}
            tooltip="Tranche Marginale d'Imposition : 0%, 11%, 30%, 41% ou 45%"
            delay={1}
          />
        </div>
      ),
      isValid: () => inputs.recettes > 0,
    },
    {
      id: 'charges',
      title: 'Charges déductibles',
      subtitle: 'Détaillez vos charges pour le régime réel',
      icon: Calculator,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Intérêts d'emprunt"
            value={inputs.interets_emprunt}
            onChange={(v) => updateInput('interets_emprunt', v)}
            type="currency"
            tooltip="Intérêts du crédit immobilier liés au bien loué"
            delay={0}
          />

          <div className="grid grid-cols-2 gap-4">
            <SimulatorStepField
              label="Assurance PNO"
              value={inputs.assurance_pno}
              onChange={(v) => updateInput('assurance_pno', v)}
              type="currency"
              delay={1}
            />
            <SimulatorStepField
              label="Assurance GLI"
              value={inputs.assurance_gli}
              onChange={(v) => updateInput('assurance_gli', v)}
              type="currency"
              delay={2}
            />
          </div>

          <SimulatorStepField
            label="Frais de gestion locative"
            value={inputs.gestion_locative}
            onChange={(v) => updateInput('gestion_locative', v)}
            type="currency"
            tooltip="Frais d'agence, conciergerie Airbnb, etc."
            delay={3}
          />

          <SimulatorStepField
            label="Expert-comptable"
            value={inputs.expert_comptable}
            onChange={(v) => updateInput('expert_comptable', v)}
            type="currency"
            delay={4}
          />

          <div className="grid grid-cols-2 gap-4">
            <SimulatorStepField
              label="Charges de copropriété"
              value={inputs.charges_copro}
              onChange={(v) => updateInput('charges_copro', v)}
              type="currency"
              delay={5}
            />
            <SimulatorStepField
              label="Taxe foncière"
              value={inputs.taxe_fonciere}
              onChange={(v) => updateInput('taxe_fonciere', v)}
              type="currency"
              delay={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SimulatorStepField
              label="CFE"
              value={inputs.cfe}
              onChange={(v) => updateInput('cfe', v)}
              type="currency"
              delay={7}
            />
            <SimulatorStepField
              label="Travaux d'entretien"
              value={inputs.travaux_entretien}
              onChange={(v) => updateInput('travaux_entretien', v)}
              type="currency"
              delay={8}
            />
          </div>

          <Separator />

          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total des charges</span>
              <span className="text-2xl font-bold text-primary">{formatEuro(totalCharges)}</span>
            </div>
          </div>
        </div>
      ),
      isValid: () => true,
    },
    {
      id: 'amortissements',
      title: 'Amortissements',
      subtitle: 'Calculez vos amortissements déductibles',
      icon: Home,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Valeur amortissable du bien"
            value={inputs.valeur_bien}
            onChange={(v) => updateInput('valeur_bien', v)}
            type="currency"
            icon={Building2}
            tooltip="Valeur du bien hors terrain (généralement 80-85% du prix d'achat)"
            delay={0}
          />

          <SimulatorStepField
            label="Durée d'amortissement immobilier"
            value={inputs.duree_immo}
            onChange={(v) => updateInput('duree_immo', v)}
            type="slider"
            min={20}
            max={40}
            step={1}
            suffix=" ans"
            icon={Calendar}
            delay={1}
          />

          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amortissement annuel immo</span>
              <span className="font-medium">{formatEuro(resultats.amort_immo)}</span>
            </div>
          </div>

          <Separator />

          <SimulatorStepField
            label="Valeur du mobilier"
            value={inputs.valeur_mobilier}
            onChange={(v) => updateInput('valeur_mobilier', v)}
            type="currency"
            tooltip="Mobilier et équipements d'une valeur supérieure à 600€"
            delay={2}
          />

          <SimulatorStepField
            label="Durée d'amortissement mobilier"
            value={inputs.duree_mobilier}
            onChange={(v) => updateInput('duree_mobilier', v)}
            type="slider"
            min={5}
            max={10}
            step={1}
            suffix=" ans"
            delay={3}
          />

          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amortissement annuel mobilier</span>
              <span className="font-medium">{formatEuro(resultats.amort_mobilier)}</span>
            </div>
          </div>

          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total amortissements</span>
              <span className="text-2xl font-bold text-primary">{formatEuro(resultats.amort_total)}</span>
            </div>
          </div>
        </div>
      ),
      isValid: () => true,
    },
  ];

  // Results content
  const economieReel = resultats.fiscalite_totale_micro - resultats.fiscalite_totale_reel;
  const isReelMeilleur = resultats.meilleur_regime === 'reel';

  const resultsContent = (
    <SimulatorResultsSection
      mainResult={{
        label: "Régime fiscal recommandé",
        value: isReelMeilleur ? 'Réel simplifié' : 'Micro-BIC',
        icon: isReelMeilleur ? TrendingUp : TrendingDown,
      }}
      ctas={ctas}
      onCTAClick={handleCTAClick}
      onSave={openSaveDialog}
      onReset={() => {
        setShowResults(false);
        setCurrentStep(0);
        resetValidation();
      }}
      isSaving={isSaving}
    >
      {/* Comparaison des régimes */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className={`p-6 rounded-lg border ${isReelMeilleur ? 'border-primary bg-primary/5' : 'border-muted'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Régime Réel</h3>
            {isReelMeilleur && <Badge className="bg-primary">Recommandé</Badge>}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Résultat fiscal</span>
              <span className="font-medium">{formatEuro(resultats.resultat_fiscal_reel)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IR</span>
              <span>{formatEuro(resultats.ir_reel)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prél. sociaux</span>
              <span>{formatEuro(resultats.ps_reel)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Fiscalité totale</span>
              <span className="text-primary">{formatEuro(resultats.fiscalite_totale_reel)}</span>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${!isReelMeilleur ? 'border-primary bg-primary/5' : 'border-muted'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Micro-BIC</h3>
            {!isReelMeilleur && <Badge className="bg-primary">Recommandé</Badge>}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Résultat fiscal</span>
              <span className="font-medium">{formatEuro(resultats.resultat_fiscal_micro)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IR</span>
              <span>{formatEuro(resultats.ir_micro)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prél. sociaux</span>
              <span>{formatEuro(resultats.ps_micro)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Fiscalité totale</span>
              <span className="text-primary">{formatEuro(resultats.fiscalite_totale_micro)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Économie */}
      {economieReel > 0 && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <span className="font-medium">
              Économie avec le régime réel : <span className="text-emerald-600">{formatEuro(economieReel)}</span> par an
            </span>
          </div>
        </div>
      )}

      {/* Détails */}
      <div className="grid gap-4 md:grid-cols-3">
        <ResultCard
          title="Recettes"
          value={inputs.recettes}
          icon={Receipt}
          delay={0}
        />
        <ResultCard
          title="Charges déductibles"
          value={totalCharges}
          icon={Calculator}
          delay={1}
        />
        <ResultCard
          title="Amortissements"
          value={resultats.amort_total}
          icon={Home}
          delay={2}
        />
      </div>

      {resultats.amort_non_deduits > 0 && (
        <Alert className="mt-4 border-amber-500/20 bg-amber-500/5">
          <AlertDescription>
            <strong>Note :</strong> {formatEuro(resultats.amort_non_deduits)} d'amortissements non déduits cette année 
            (résultat fiscal ne peut pas être négatif). Ces amortissements sont reportables indéfiniment.
          </AlertDescription>
        </Alert>
      )}
    </SimulatorResultsSection>
  );

  // Affichage pendant le chargement d'une simulation
  if (isLoadingSimulation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        <Header />
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Chargement de la simulation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <Header />

      {/* Bandeau de simulation chargée */}
      {loadedSimulationName && showResults && (
        <div className="container mx-auto px-4 pt-4 max-w-4xl">
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

      <SimulationValidationOverlay 
        isValidating={showValidationOverlay} 
        onComplete={handleValidationComplete}
        simulatorName="Simulateur LMNP"
        simulatorId="lmnp"
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <SimulatorWizard
          title="Simulateur LMNP : calculez votre fiscalité"
          subtitle="Comparez le régime réel au micro-BIC et découvrez le plus avantageux"
          steps={steps}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          onValidate={handleValidate}
          showResults={showResults && (isValidated || isFromHistory)}
          resultsContent={resultsContent}
          backPath="/employee/simulations"
        />
      </div>

      <div className="container mx-auto px-4 max-w-4xl pb-8">
        <SimulatorDisclaimer />
      </div>

      <SaveSimulationDialog
        open={showSaveDialog}
        onOpenChange={(open) => {
          if (!open) closeSaveDialog();
        }}
        simulationName={simulationName}
        onSimulationNameChange={setSimulationName}
        onSave={handleConfirmSave}
        isSaving={isSaving}
        showExpertPrompt={showExpertPrompt}
        onCloseExpertPrompt={closeExpertPrompt}
      />
    </div>
  );
};

export default SimulateurLMNP;
