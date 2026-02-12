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
import { useSimulationTracking } from '@/hooks/useSimulationTracking';
import { useCTARulesEngine } from '@/hooks/useCTARulesEngine';
import { useSimulationLoader } from '@/hooks/useSimulationLoader';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const SimulateurCapaciteEmprunt = () => {
  const navigate = useNavigate();
  const { calculerSimulation } = useCapaciteEmpruntCalculations();
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
  
  // Step 2: Charges
  const [creditConso, setCreditConso] = useState(0);
  const [creditAuto, setCreditAuto] = useState(0);
  const [creditImmo, setCreditImmo] = useState(0);
  const [pensionsVersees, setPensionsVersees] = useState(0);
  const [loyerActuel, setLoyerActuel] = useState(1000);
  const [nombreEnfants, setNombreEnfants] = useState(0);
  
  // Step 3: Paramètres du prêt
  const [dureeAnnees, setDureeAnnees] = useState(25);
  const [tauxInteret, setTauxInteret] = useState(3.5);
  const [apportPersonnel, setApportPersonnel] = useState(30000);
  const [fraisNotaire, setFraisNotaire] = useState(8);
  
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
    if (data.pensions_alimentaires) setPensionsVersees(data.pensions_alimentaires as number);
    if (data.loyer_actuel) setLoyerActuel(data.loyer_actuel as number);
    if (data.nombre_enfants) setNombreEnfants(data.nombre_enfants as number);
    if (data.duree_annees) setDureeAnnees(data.duree_annees as number);
    if (data.taux_interet) setTauxInteret(data.taux_interet as number);
    if (data.apport_personnel) setApportPersonnel(data.apport_personnel as number);
    if (data.frais_notaire) setFraisNotaire(data.frais_notaire as number);
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
      if (data.revenuMensuelNet > 0) setSalaires(data.revenuMensuelNet);
      if (data.revenusLocatifs > 0) setRevenusLocatifs(data.revenusLocatifs);
      if (data.autresRevenus > 0) setAutresRevenus(data.autresRevenus);
      if (data.creditConsommation > 0) setCreditConso(data.creditConsommation);
      if (data.creditAuto > 0) setCreditAuto(data.creditAuto);
      if (data.creditImmobilier > 0) setCreditImmo(data.creditImmobilier);
      if (data.pensionsAlimentaires > 0) setPensionsVersees(data.pensionsAlimentaires);
      if (data.loyerActuel > 0) setLoyerActuel(data.loyerActuel);
      if (data.nbEnfants > 0) setNombreEnfants(data.nbEnfants);
      if (data.apportDisponible > 0) setApportPersonnel(data.apportDisponible);
      if (data.dureeEmpruntSouhaitee > 0) setDureeAnnees(data.dureeEmpruntSouhaitee);
      setProfileApplied(true);
    }
  }, [isProfileLoading, hasProfile, profileApplied, getPrefillData, isFromHistory]);
  
  // Calculs
  const revenuMensuelNet = salaires + (revenusLocatifs * 0.7) + revenusCapital + autresRevenus;
  const chargesFixes = creditConso + creditAuto + creditImmo + pensionsVersees;
  
  const resultats = useMemo(() => {
    return calculerSimulation({
      revenuMensuelNet,
      chargesFixes,
      loyerActuel,
      nombreEnfants,
      dureeAnnees,
      tauxInteret,
      apportPersonnel,
      fraisNotaire,
    });
  }, [revenuMensuelNet, chargesFixes, loyerActuel, nombreEnfants, dureeAnnees, tauxInteret, apportPersonnel, fraisNotaire, calculerSimulation]);

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
    if (taux <= 30) return { color: 'text-emerald-600', status: 'Excellent', variant: 'success' as const };
    if (taux <= 33) return { color: 'text-emerald-500', status: 'Bon', variant: 'success' as const };
    if (taux <= 35) return { color: 'text-amber-500', status: 'Limite', variant: 'warning' as const };
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
        loyer_actuel: loyerActuel,
        duree_annees: dureeAnnees,
        taux_interet: tauxInteret,
        apport_personnel: apportPersonnel,
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
      pensions_alimentaires: pensionsVersees,
      loyer_actuel: loyerActuel,
      nombre_enfants: nombreEnfants,
      revenu_mensuel_net: revenuMensuelNet,
      charges_fixes: chargesFixes,
      duree_annees: dureeAnnees,
      taux_interet: tauxInteret,
      taux_assurance: 0.34,
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
      title: 'Vos charges',
      subtitle: 'Renseignez vos charges mensuelles actuelles',
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
            label="Pensions versées"
            value={pensionsVersees}
            onChange={setPensionsVersees}
            type="currency"
            tooltip="Pensions alimentaires que vous versez"
            delay={3}
          />
          
          <SimulatorStepField
            label="Loyer actuel"
            value={loyerActuel}
            onChange={setLoyerActuel}
            type="currency"
            icon={Home}
            tooltip="Sera libéré lors de l'achat"
            delay={4}
          />
          
          <SimulatorStepField
            label="Nombre d'enfants"
            value={nombreEnfants}
            onChange={setNombreEnfants}
            type="number"
            min={0}
            max={10}
            delay={5}
          />
          
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total charges fixes</span>
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
            type="percent"
            min={1}
            max={6}
            step={0.1}
            icon={Percent}
            delay={1}
          />
          
          <SimulatorStepField
            label="Apport personnel"
            value={apportPersonnel}
            onChange={setApportPersonnel}
            type="currency"
            icon={PiggyBank}
            tooltip="Montant que vous pouvez apporter"
            delay={2}
          />
          
          <SimulatorStepField
            label="Frais de notaire"
            value={fraisNotaire}
            onChange={setFraisNotaire}
            type="percent"
            min={2}
            max={12}
            step={0.5}
            tooltip="7-8% dans l'ancien, 2-3% dans le neuf"
            delay={3}
          />
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
      onSave={openSaveDialog}
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
          value={Math.min(resultats.tauxEndettementFutur, 50)} 
          max={50} 
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
