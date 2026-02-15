import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Euro, Percent, Calendar, TrendingUp, 
  AlertTriangle, CheckCircle, Wallet, Home, CreditCard,
  Target, Briefcase, Building, PiggyBank, UserCircle
} from 'lucide-react';
import { useCapaciteEmpruntCalculations } from '@/hooks/useCapaciteEmpruntCalculations';
import { useUnifiedSimulationSave } from '@/hooks/useUnifiedSimulationSave';
import { SaveSimulationDialog } from '@/components/simulators/SaveSimulationDialog';
import { useFinancialProfilePrefill } from '@/hooks/useFinancialProfilePrefill';
import { SimulatorWizard, SimulatorStep } from '@/components/simulators/SimulatorWizard';
import { SimulatorStepField } from '@/components/simulators/SimulatorStepField';
import { SimulatorResultsSection, ResultCard } from '@/components/simulators/SimulatorResultsSection';
import { SimulationValidationOverlay } from '@/components/simulators/SimulationValidationOverlay';
import { SimulatorDisclaimer } from '@/components/simulators/SimulatorDisclaimer';
import { useSimulationTracking } from '@/hooks/useSimulationTracking';
import { useCTARulesEngine } from '@/hooks/useCTARulesEngine';
import { useSimulationLoader } from '@/hooks/useSimulationLoader';
import { useSimulationDefaults } from '@/contexts/GlobalSettingsContext';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const SimulateurCapaciteEmprunt = () => {
  const navigate = useNavigate();
  const { calculerSimulation } = useCapaciteEmpruntCalculations();
  const { getPrefillData, hasProfile, isLoading: isProfileLoading } = useFinancialProfilePrefill();
  const simulationDefaults = useSimulationDefaults();
  
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
  } = useUnifiedSimulationSave({
    type: 'capacite_emprunt',
    queryCacheKey: ['simulations', 'capacite_emprunt_simulations'],
  });

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  // Step 1: Revenus
  const [salaires, setSalaires] = useState(4500);
  const [revenusLocatifs, setRevenusLocatifs] = useState(0);
  const [revenusCapital, setRevenusCapital] = useState(0);
  const [autresRevenus, setAutresRevenus] = useState(0);
  
  // Step 2: Crédits en cours
  const [creditConso, setCreditConso] = useState(0);
  const [creditAuto, setCreditAuto] = useState(0);
  const [creditImmo, setCreditImmo] = useState(0);
  const [autresCredits, setAutresCredits] = useState(0);
  
  // Step 3: Paramètres du prêt
  const [dureeAnnees, setDureeAnnees] = useState(25);
  const [tauxInteret, setTauxInteret] = useState(3.5);
  const [tauxAssurance, setTauxAssurance] = useState(0.34);
  const [apportPersonnel, setApportPersonnel] = useState(30000);
  const [typeBien, setTypeBien] = useState<'ancien' | 'neuf'>('ancien');
  const fraisNotaire = typeBien === 'ancien' ? 8 : 3;
  
  const [profileApplied, setProfileApplied] = useState(false);

  // Fonction pour restaurer les données d'une simulation
  const restoreSimulationData = useCallback((data: Record<string, unknown>) => {
    if (data.salaires) setSalaires(data.salaires as number);
    if (data.revenus_locatifs) setRevenusLocatifs(data.revenus_locatifs as number);
    if (data.revenus_capital) setRevenusCapital(data.revenus_capital as number);
    if (data.autres_revenus) setAutresRevenus(data.autres_revenus as number);
    if (data.credit_conso) setCreditConso(data.credit_conso as number);
    if (data.credit_auto) setCreditAuto(data.credit_auto as number);
    if (data.credit_immo) setCreditImmo(data.credit_immo as number);
    if (data.autres_credits) setAutresCredits(data.autres_credits as number);
    if (data.duree_annees) setDureeAnnees(data.duree_annees as number);
    if (data.taux_interet) setTauxInteret(data.taux_interet as number);
    if (data.taux_assurance) setTauxAssurance(data.taux_assurance as number);
    if (data.apport_personnel) setApportPersonnel(data.apport_personnel as number);
    if (data.type_bien) setTypeBien(data.type_bien as 'ancien' | 'neuf');
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
      // Les revenus du profil sont stockés en annuel → on les mensualise
      if (data.revenuMensuelNet > 0) setSalaires(Math.round(data.revenuMensuelNet / 12));
      if (data.revenusLocatifs > 0) setRevenusLocatifs(Math.round(data.revenusLocatifs / 12));
      if (data.autresRevenus > 0) setAutresRevenus(Math.round(data.autresRevenus / 12));
      // Les crédits en cours sont déjà en mensuel dans le profil
      if (data.creditConsommation > 0) setCreditConso(data.creditConsommation);
      if (data.creditAuto > 0) setCreditAuto(data.creditAuto);
      if (data.creditImmobilier > 0) setCreditImmo(data.creditImmobilier);
      if (data.apportDisponible > 0) setApportPersonnel(data.apportDisponible);
      if (data.dureeEmpruntSouhaitee > 0) setDureeAnnees(data.dureeEmpruntSouhaitee);
      setProfileApplied(true);
    }
  }, [isProfileLoading, hasProfile, profileApplied, getPrefillData, isFromHistory]);
  
  // Calculs
  const revenuMensuelNet = salaires + (revenusLocatifs * 0.7) + revenusCapital + autresRevenus;
  const chargesFixes = creditConso + creditAuto + creditImmo + autresCredits;
  
  const resultats = useMemo(() => {
    return calculerSimulation({
      revenuMensuelNet,
      chargesFixes,
      loyerActuel: 0,
      nombreEnfants: 0,
      dureeAnnees,
      tauxInteret,
      apportPersonnel,
      fraisNotaire,
    });
  }, [revenuMensuelNet, chargesFixes, dureeAnnees, tauxInteret, apportPersonnel, fraisNotaire, calculerSimulation]);

  // CTAs
  const { ctas } = useCTARulesEngine('capacite_emprunt', {
    capacite_emprunt: resultats.capaciteEmprunt,
    taux_endettement: resultats.tauxEndettementFutur,
    apport: apportPersonnel,
    duree: dureeAnnees,
  });
  
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getEndettementStatus = (taux: number) => {
    if (taux <= simulationDefaults.endettement_excellent) return { color: 'text-emerald-600', status: 'Excellent', variant: 'success' as const };
    if (taux <= simulationDefaults.endettement_bon) return { color: 'text-emerald-500', status: 'Bon', variant: 'success' as const };
    if (taux <= simulationDefaults.endettement_limite) return { color: 'text-amber-500', status: 'Limite', variant: 'warning' as const };
    return { color: 'text-destructive', status: 'Trop élevé', variant: 'warning' as const };
  };

  const endettementStatus = getEndettementStatus(resultats.tauxEndettementFutur);

  const handleValidationComplete = async () => {
    await validateSimulation({
      simulatorType: 'capacite_emprunt',
      simulationData: {
        salaires,
        revenus_locatifs: revenusLocatifs,
        autres_revenus: autresRevenus,
        credit_conso: creditConso,
        credit_auto: creditAuto,
        credit_immo: creditImmo,
        autres_credits: autresCredits,
        duree_annees: dureeAnnees,
        taux_interet: tauxInteret,
        taux_assurance: tauxAssurance,
        apport_personnel: apportPersonnel,
        type_bien: typeBien,
      },
      resultsData: {
        capacite_emprunt: resultats.capaciteEmprunt,
        mensualite_maximale: resultats.mensualiteMaximale,
        montant_projet_max: resultats.montantProjetMax,
        taux_endettement_futur: resultats.tauxEndettementFutur,
      },
    });
    completeValidation();
  };

  const handleSave = () => {
    const now = new Date();
    const defaultName = `Capacité d'emprunt - ${format(now, "dd/MM/yyyy HH:mm")}`;
    openSaveDialog(loadedSimulationName || defaultName);
  };

  const handleConfirmSave = async () => {
    await saveSimulation({
      salaires,
      revenus_locatifs: revenusLocatifs,
      revenus_capital: revenusCapital,
      autres_revenus: autresRevenus,
      credit_conso: creditConso,
      credit_auto: creditAuto,
      credit_immo: creditImmo,
      autres_credits: autresCredits,
      revenu_mensuel_net: revenuMensuelNet,
      charges_fixes: chargesFixes,
      duree_annees: dureeAnnees,
      taux_interet: tauxInteret,
      taux_assurance: tauxAssurance,
      apport_personnel: apportPersonnel,
      frais_notaire: fraisNotaire,
      capacite_emprunt: resultats.capaciteEmprunt,
      mensualite_maximale: resultats.mensualiteMaximale,
      montant_projet_max: resultats.montantProjetMax,
      taux_endettement_actuel: resultats.tauxEndettementActuel,
      taux_endettement_futur: resultats.tauxEndettementFutur,
      reste_a_vivre: resultats.resteAVivre,
      reste_a_vivre_futur: resultats.resteAVivreFutur,
      taux_utilisation_capacite: resultats.tauxUtilisationCapacite,
    });
    markAsSaved();
  };

  const handleCTAClick = (ctaId: string, isAppointment: boolean) => {
    trackCTAClick(ctaId, isAppointment);
  };

  const handleValidate = () => {
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
      title: 'Vos revenus',
      subtitle: 'Détaillez vos sources de revenus mensuels',
      icon: Wallet,
      content: (
        <div className="space-y-6">
          {hasProfile && (
            <Alert className="border-primary/20 bg-primary/5">
              <UserCircle className="h-4 w-4 text-primary" />
              <AlertDescription>
                Données pré-remplies depuis votre profil financier
              </AlertDescription>
            </Alert>
          )}
          
          <SimulatorStepField
            label="Salaires et traitements"
            value={salaires}
            onChange={setSalaires}
            type="currency"
            icon={Briefcase}
            tooltip="Revenus nets mensuels de votre activité professionnelle"
            delay={0}
          />
          
          <SimulatorStepField
            label="Revenus locatifs"
            value={revenusLocatifs}
            onChange={setRevenusLocatifs}
            type="currency"
            icon={Building}
            tooltip="Pris en compte à 70% par les banques"
            delay={1}
          />
          
          <SimulatorStepField
            label="Revenus du capital"
            value={revenusCapital}
            onChange={setRevenusCapital}
            type="currency"
            icon={PiggyBank}
            tooltip="Dividendes, intérêts, etc."
            delay={2}
          />
          
          <SimulatorStepField
            label="Autres revenus"
            value={autresRevenus}
            onChange={setAutresRevenus}
            type="currency"
            icon={Euro}
            tooltip="Pensions reçues, allocations, etc."
            delay={3}
          />
          
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total revenus mensuels</span>
              <span className="text-2xl font-bold text-primary">{formatEuro(revenuMensuelNet)}</span>
            </div>
          </div>
        </div>
      ),
      isValid: () => salaires > 0,
    },
    {
      id: 'charges',
      title: 'Vos crédits en cours',
      subtitle: 'Renseignez vos remboursements mensuels actuels',
      icon: CreditCard,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Crédit immobilier existant"
            value={creditImmo}
            onChange={setCreditImmo}
            type="currency"
            icon={Building}
            tooltip="Mensualité d'un prêt immobilier en cours"
            delay={0}
          />
          
          <SimulatorStepField
            label="Crédit consommation"
            value={creditConso}
            onChange={setCreditConso}
            type="currency"
            icon={CreditCard}
            delay={1}
          />
          
          <SimulatorStepField
            label="Crédit automobile"
            value={creditAuto}
            onChange={setCreditAuto}
            type="currency"
            icon={CreditCard}
            delay={2}
          />
          
          <SimulatorStepField
            label="Autres crédits"
            value={autresCredits}
            onChange={setAutresCredits}
            type="currency"
            icon={CreditCard}
            tooltip="Tout autre crédit en cours (LOA, prêt familial, etc.)"
            delay={3}
          />
          
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total crédits en cours</span>
              <span className="text-2xl font-bold text-destructive">{formatEuro(chargesFixes)}</span>
            </div>
          </div>
        </div>
      ),
      isValid: () => true,
    },
    {
      id: 'parametres',
      title: 'Paramètres du prêt',
      subtitle: 'Configurez les conditions de votre emprunt',
      icon: Calendar,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Durée du prêt"
            value={dureeAnnees}
            onChange={setDureeAnnees}
            type="slider"
            min={7}
            max={25}
            step={1}
            suffix=" ans"
            icon={Calendar}
            delay={0}
          />
          
          <SimulatorStepField
            label="Taux d'intérêt"
            value={tauxInteret}
            onChange={setTauxInteret}
            type="slider"
            min={1}
            max={6}
            step={0.05}
            suffix="%"
            icon={Percent}
            delay={1}
          />
          
          <SimulatorStepField
            label="Taux d'assurance (TAEA)"
            value={tauxAssurance}
            onChange={setTauxAssurance}
            type="slider"
            min={0.05}
            max={0.8}
            step={0.01}
            suffix="%"
            icon={Percent}
            tooltip="Taux Annuel Effectif de l'Assurance"
            delay={2}
          />
          
          <SimulatorStepField
            label="Apport personnel"
            value={apportPersonnel}
            onChange={setApportPersonnel}
            type="currency"
            icon={PiggyBank}
            tooltip="Montant que vous pouvez apporter"
            delay={3}
          />
          
          {/* Type de bien : Ancien ou Neuf */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Type de bien</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTypeBien('ancien')}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  typeBien === 'ancien'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <Building className="h-5 w-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Ancien</div>
                <div className="text-xs text-muted-foreground">~8% de frais</div>
              </button>
              <button
                type="button"
                onClick={() => setTypeBien('neuf')}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  typeBien === 'neuf'
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <Home className="h-5 w-5 mx-auto mb-1" />
                <div className="text-sm font-medium">Neuf</div>
                <div className="text-xs text-muted-foreground">~3% de frais</div>
              </button>
            </div>
          </div>
        </div>
      ),
      isValid: () => dureeAnnees > 0 && tauxInteret > 0,
    },
  ];

  // Results content
  const resultsContent = (
    <SimulatorResultsSection
      mainResult={{
        label: "Capacité d'emprunt maximale",
        value: resultats.capaciteEmprunt,
        icon: Target,
      }}
      ctas={ctas}
      onCTAClick={handleCTAClick}
      onSave={handleSave}
      onReset={() => {
        setShowResults(false);
        setCurrentStep(0);
        resetValidation();
      }}
      isSaving={isSaving}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ResultCard
          title="Mensualité maximale"
          value={resultats.mensualiteMaximale}
          subtitle="par mois"
          icon={Euro}
          delay={0}
        />
        <ResultCard
          title="Budget projet max"
          value={resultats.montantProjetMax}
          subtitle="avec apport et frais"
          icon={Home}
          delay={1}
        />
        <ResultCard
          title="Taux d'endettement futur"
          value={`${resultats.tauxEndettementFutur.toFixed(1)}%`}
          subtitle={endettementStatus.status}
          icon={resultats.tauxEndettementFutur <= 35 ? CheckCircle : AlertTriangle}
          variant={endettementStatus.variant}
          delay={2}
        />
        <ResultCard
          title="Reste à vivre actuel"
          value={resultats.resteAVivre}
          subtitle="après charges"
          icon={Wallet}
          delay={3}
        />
        <ResultCard
          title="Reste à vivre futur"
          value={resultats.resteAVivreFutur}
          subtitle="après achat"
          icon={Wallet}
          delay={4}
        />
        <ResultCard
          title="Apport personnel"
          value={apportPersonnel}
          subtitle={`${((apportPersonnel / resultats.montantProjetMax) * 100).toFixed(1)}% du projet`}
          icon={PiggyBank}
          delay={5}
        />
      </div>

      {/* Taux d'endettement gauge */}
      <div className="mt-6 p-4 bg-card rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Taux d'endettement</span>
          <Badge variant={resultats.tauxEndettementFutur <= 35 ? "default" : "destructive"}>
            {resultats.tauxEndettementFutur.toFixed(1)}%
          </Badge>
        </div>
        <Progress 
          value={Math.min((resultats.tauxEndettementFutur / 50) * 100, 100)} 
          className="h-3"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0%</span>
          <span className="text-emerald-500">30%</span>
          <span className="text-amber-500">35%</span>
          <span className="text-destructive">50%</span>
        </div>
      </div>

      {resultats.tauxEndettementFutur > 35 && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Votre taux d'endettement dépasse le seuil HCSF de 35%. 
            Réduisez vos charges ou augmentez votre apport pour améliorer votre dossier.
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
        simulatorName="Capacité d'Emprunt"
        simulatorId="capacite_emprunt"
      />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <SimulatorWizard
          title="Jusqu'où pouvez-vous aller ?"
          subtitle="Découvrez votre capacité d'emprunt maximale"
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
      />
    </div>
  );
};

export default SimulateurCapaciteEmprunt;
