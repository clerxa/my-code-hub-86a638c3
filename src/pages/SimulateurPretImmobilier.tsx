import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Home, Euro, Percent, Calendar, TrendingUp, Shield, AlertTriangle, CheckCircle, UserCircle } from 'lucide-react';
import { usePretImmobilierCalculations } from '@/hooks/usePretImmobilierCalculations';
import { useFinancialProfilePrefill } from '@/hooks/useFinancialProfilePrefill';
import { useUnifiedSimulationSave } from '@/hooks/useUnifiedSimulationSave';
import { SaveSimulationDialog } from '@/components/simulators/SaveSimulationDialog';
import { SimulatorWizard, SimulatorStep } from '@/components/simulators/SimulatorWizard';
import { SimulatorStepField } from '@/components/simulators/SimulatorStepField';
import { SimulatorResultsSection, ResultCard } from '@/components/simulators/SimulatorResultsSection';
import { SimulationValidationOverlay } from '@/components/simulators/SimulationValidationOverlay';
import { useSimulationTracking } from '@/hooks/useSimulationTracking';
import { useCTARulesEngine } from '@/hooks/useCTARulesEngine';
import { useSimulationLoader } from '@/hooks/useSimulationLoader';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { format } from 'date-fns';

const SimulateurPretImmobilier = () => {
  const navigate = useNavigate();
  const { calculerSimulation } = usePretImmobilierCalculations();
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
    type: 'pret_immobilier',
    queryCacheKey: ['simulations', 'pret_immobilier_simulations'],
  });

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  // Form state
  const [montantProjet, setMontantProjet] = useState(300000);
  const [apportPersonnel, setApportPersonnel] = useState(60000);
  const [dureeAnnees, setDureeAnnees] = useState(20);
  const [tauxInteret, setTauxInteret] = useState(3.2);
  const [tauxAssurance, setTauxAssurance] = useState(0.34);
  const [revenuMensuelNet, setRevenuMensuelNet] = useState<number>(5000);
  const [profileApplied, setProfileApplied] = useState(false);

  // Fonction pour restaurer les données d'une simulation
  const restoreSimulationData = useCallback((data: Record<string, unknown>) => {
    if (data.montant_projet) setMontantProjet(data.montant_projet as number);
    if (data.apport_personnel) setApportPersonnel(data.apport_personnel as number);
    if (data.duree_annees) setDureeAnnees(data.duree_annees as number);
    if (data.taux_interet) setTauxInteret(data.taux_interet as number);
    if (data.taux_assurance) setTauxAssurance(data.taux_assurance as number);
    if (data.revenu_mensuel) setRevenuMensuelNet(data.revenu_mensuel as number);
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
      if (data.apportDisponible > 0) setApportPersonnel(data.apportDisponible);
      if (data.dureeEmpruntSouhaitee > 0) setDureeAnnees(data.dureeEmpruntSouhaitee);
      if (data.revenuMensuelNet > 0) setRevenuMensuelNet(Math.round(data.revenuMensuelNet / 12));
      if (data.budgetAchatImmo && data.budgetAchatImmo > 0) setMontantProjet(data.budgetAchatImmo);
      setProfileApplied(true);
    }
  }, [isProfileLoading, hasProfile, profileApplied, getPrefillData, isFromHistory]);
  
  // Calculs
  const resultats = useMemo(() => {
    return calculerSimulation({
      montantProjet,
      apportPersonnel,
      dureeAnnees,
      tauxInteret,
      tauxAssurance,
      revenuMensuel: revenuMensuelNet || undefined,
    });
  }, [montantProjet, apportPersonnel, dureeAnnees, tauxInteret, tauxAssurance, revenuMensuelNet, calculerSimulation]);

  // CTAs
  const { ctas } = useCTARulesEngine('pret_immobilier', {
    montant_emprunte: resultats.montantEmprunte,
    mensualite: resultats.mensualiteTotale,
    taux_endettement: resultats.tauxEndettement,
    duree: dureeAnnees,
  });

  // Données pour le graphique
  const chartData = useMemo(() => [
    { name: 'Capital', value: resultats.montantEmprunte, fill: 'hsl(var(--primary))' },
    { name: 'Intérêts', value: resultats.coutTotalInterets, fill: 'hsl(var(--chart-2))' },
    { name: 'Assurance', value: resultats.coutTotalAssurance, fill: 'hsl(var(--chart-3))' },
  ], [resultats]);
  
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getEndettementStatus = (taux: number | null) => {
    if (taux === null) return { status: 'Non calculé', variant: 'default' as const };
    if (taux <= 30) return { status: 'Excellent', variant: 'success' as const };
    if (taux <= 35) return { status: 'Limite haute', variant: 'warning' as const };
    return { status: 'Trop élevé', variant: 'warning' as const };
  };

  const endettementStatus = getEndettementStatus(resultats.tauxEndettement);
  const pourcentageApport = (apportPersonnel / montantProjet) * 100;

  const handleValidationComplete = async () => {
    await validateSimulation({
      simulatorType: 'pret_immobilier',
      simulationData: {
        montant_projet: montantProjet,
        apport_personnel: apportPersonnel,
        duree_annees: dureeAnnees,
        taux_interet: tauxInteret,
        taux_assurance: tauxAssurance,
        revenu_mensuel_net: revenuMensuelNet,
      },
      resultsData: {
        montant_emprunte: resultats.montantEmprunte,
        mensualite_totale: resultats.mensualiteTotale,
        cout_total_interets: resultats.coutTotalInterets,
        cout_total_assurance: resultats.coutTotalAssurance,
        cout_global_credit: resultats.coutGlobalCredit,
        taux_endettement: resultats.tauxEndettement,
      },
    });
    completeValidation();
  };

  const handleSave = () => {
    const now = new Date();
    const defaultName = `Prêt immobilier - ${format(now, "dd/MM/yyyy HH:mm")}`;
    openSaveDialog(loadedSimulationName || defaultName);
  };

  const handleConfirmSave = async () => {
    await saveSimulation({
      montant_projet: montantProjet,
      apport_personnel: apportPersonnel,
      duree_annees: dureeAnnees,
      taux_interet: tauxInteret,
      taux_assurance: tauxAssurance,
      revenu_mensuel: revenuMensuelNet,
      montant_emprunte: resultats.montantEmprunte,
      mensualite_totale: resultats.mensualiteTotale,
      cout_total_interets: resultats.coutTotalInterets,
      cout_total_assurance: resultats.coutTotalAssurance,
      cout_global_credit: resultats.coutGlobalCredit,
      taux_endettement: resultats.tauxEndettement,
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
      id: 'projet',
      title: 'Votre projet',
      subtitle: 'Définissez les contours de votre projet immobilier',
      icon: Home,
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
            label="Montant du projet"
            value={montantProjet}
            onChange={setMontantProjet}
            type="currency"
            icon={Euro}
            tooltip="Prix d'achat + frais de notaire et autres frais"
            delay={0}
          />
          
          <SimulatorStepField
            label="Apport personnel"
            value={apportPersonnel}
            onChange={(v) => setApportPersonnel(Math.min(v, montantProjet * 0.9))}
            type="currency"
            icon={Shield}
            delay={1}
          />
          
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Apport représente</span>
              <span className="font-medium">{pourcentageApport.toFixed(1)}% du projet</span>
            </div>
          </div>
          
          <SimulatorStepField
            label="Revenu net mensuel du foyer"
            value={revenuMensuelNet}
            onChange={setRevenuMensuelNet}
            type="currency"
            icon={Euro}
            tooltip="Permet de calculer votre taux d'endettement"
            delay={2}
          />
        </div>
      ),
      isValid: () => montantProjet > 0 && apportPersonnel >= 0,
    },
    {
      id: 'financement',
      title: 'Financement',
      subtitle: 'Paramétrez les conditions de votre prêt',
      icon: TrendingUp,
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
            tooltip="Taux nominal annuel hors assurance"
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
            icon={Shield}
            tooltip="Taux Annuel Effectif de l'Assurance. Varie selon votre âge et état de santé."
            delay={2}
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
        label: "Mensualité totale estimée",
        value: resultats.mensualiteTotale,
        suffix: "/mois",
        icon: Euro,
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
          title="Montant emprunté"
          value={resultats.montantEmprunte}
          icon={Euro}
          delay={0}
        />
        <ResultCard
          title="Mensualité prêt"
          value={resultats.mensualitePret}
          subtitle="hors assurance"
          icon={Euro}
          delay={1}
        />
        <ResultCard
          title="Mensualité assurance"
          value={resultats.mensualiteAssurance}
          icon={Shield}
          delay={2}
        />
        <ResultCard
          title="Coût total des intérêts"
          value={resultats.coutTotalInterets}
          icon={TrendingUp}
          delay={3}
        />
        <ResultCard
          title="Coût total assurance"
          value={resultats.coutTotalAssurance}
          icon={Shield}
          delay={4}
        />
        <ResultCard
          title="Taux d'endettement"
          value={resultats.tauxEndettement ? `${resultats.tauxEndettement.toFixed(1)}%` : 'N/A'}
          subtitle={endettementStatus.status}
          icon={resultats.tauxEndettement && resultats.tauxEndettement <= 35 ? CheckCircle : AlertTriangle}
          variant={endettementStatus.variant}
          delay={5}
        />
      </div>

      {/* Graphique de répartition */}
      <div className="mt-6 p-4 bg-card rounded-lg border">
        <h3 className="font-semibold mb-4">Répartition du coût total</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatEuro(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">Coût global du crédit</p>
          <p className="text-2xl font-bold text-primary">{formatEuro(resultats.coutGlobalCredit)}</p>
        </div>
      </div>

      {resultats.tauxEndettement && resultats.tauxEndettement > 35 && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Votre taux d'endettement dépasse 35%. 
            Augmentez votre apport ou allongez la durée pour réduire les mensualités.
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
        simulatorName="Prêt Immobilier"
        simulatorId="pret_immobilier"
      />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <SimulatorWizard
          title="Le Simulateur de Financement Ultime"
          subtitle="Visualisez le coût réel de votre emprunt immobilier"
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

export default SimulateurPretImmobilier;
