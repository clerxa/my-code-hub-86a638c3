import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  PiggyBank, Calendar, TrendingUp, Sparkles, Clock, Lightbulb, Percent, Target, ArrowRight, Zap
} from "lucide-react";
import { useSimulationTracking } from "@/hooks/useSimulationTracking";
import { useCTARulesEngine } from "@/hooks/useCTARulesEngine";
import { SimulatorWizard, SimulatorStep } from "@/components/simulators/SimulatorWizard";
import { SimulatorStepField } from "@/components/simulators/SimulatorStepField";
import { SimulatorResultsSection, ResultCard } from "@/components/simulators/SimulatorResultsSection";
import { SimulationValidationOverlay } from "@/components/simulators/SimulationValidationOverlay";
import { SaveSimulationDialog } from "@/components/simulators/SaveSimulationDialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useUnifiedSimulationSave } from "@/hooks/useUnifiedSimulationSave";
import { useSimulationLoader } from "@/hooks/useSimulationLoader";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Taux de référence avec couleurs dark mode
const TAUX_REFERENCE = [
  { taux: 2, label: "Profil prudent", description: "Fonds euro principalement (hypothèse très basse)", risque: "Très faible", couleur: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50" },
  { taux: 6, label: "Profil équilibré", description: "Mix fonds euro & actions", risque: "Modéré", couleur: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50" },
  { taux: 8, label: "Profil dynamique", description: "Majoritairement des actions", risque: "Élevé", couleur: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50" },
];

const SimulateurInteretsComposes = () => {
  const navigate = useNavigate();

  // État du wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  // État du formulaire
  const [montantInitial, setMontantInitial] = useState(5000);
  const [versementMensuel, setVersementMensuel] = useState(200);
  const [dureeAnnees, setDureeAnnees] = useState(20);
  const [tauxInteret, setTauxInteret] = useState(6);

  // Tracking
  const {
    startValidation,
    completeValidation,
    showValidationOverlay,
    validateSimulation,
    markAsSaved,
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
    type: 'interets_composes',
    queryCacheKey: 'simulations',
  });

  // Fonction pour restaurer les données d'une simulation
  const restoreSimulationData = useCallback((data: Record<string, unknown>) => {
    if (data.montant_initial) setMontantInitial(data.montant_initial as number);
    if (data.versement_mensuel) setVersementMensuel(data.versement_mensuel as number);
    if (data.duree_annees) setDureeAnnees(data.duree_annees as number);
    if (data.taux_interet) setTauxInteret(data.taux_interet as number);
    setShowResults(true);
  }, []);

  // Chargement depuis l'URL ou location.state
  const { isLoadingSimulation, loadedSimulationName, isFromHistory } = useSimulationLoader({
    onDataLoaded: (data, name) => {
      restoreSimulationData(data);
      if (name) setSimulationName(name);
    },
  });

  // Calculs
  const resultats = useMemo(() => {
    const tauxMensuel = tauxInteret / 100 / 12;
    const evolutionAnnuelle: { annee: number; capital: number; versements: number; interets: number }[] = [];
    
    let capitalActuel = montantInitial;
    let totalVerse = montantInitial;
    
    for (let annee = 0; annee <= dureeAnnees; annee++) {
      if (annee === 0) {
        evolutionAnnuelle.push({
          annee: 0,
          capital: montantInitial,
          versements: montantInitial,
          interets: 0,
        });
      } else {
        for (let mois = 0; mois < 12; mois++) {
          capitalActuel = capitalActuel * (1 + tauxMensuel) + versementMensuel;
          totalVerse += versementMensuel;
        }
        
        evolutionAnnuelle.push({
          annee,
          capital: Math.round(capitalActuel),
          versements: Math.round(totalVerse),
          interets: Math.round(capitalActuel - totalVerse),
        });
      }
    }
    
    const capitalFinal = evolutionAnnuelle[evolutionAnnuelle.length - 1].capital;
    const totalInterets = evolutionAnnuelle[evolutionAnnuelle.length - 1].interets;
    const totalInvesti = evolutionAnnuelle[evolutionAnnuelle.length - 1].versements;
    
    // Sans versements mensuels
    const capitalSansVersements = Math.round(montantInitial * Math.pow(1 + tauxInteret / 100, dureeAnnees));
    
    return {
      capitalFinal,
      totalInterets,
      totalInvesti,
      evolutionAnnuelle,
      capitalSansVersements,
      multiplicateur: (capitalFinal / totalInvesti).toFixed(1),
    };
  }, [montantInitial, versementMensuel, dureeAnnees, tauxInteret]);

  // CTA intelligents - passer les valeurs d'entrée ET les résultats calculés
  // Les clés doivent correspondre EXACTEMENT à celles configurées dans l'admin (condition_key)
  const { ctas } = useCTARulesEngine("interets_composes", {
    // Entrées utilisateur (clés simples pour l'admin)
    versement_mensuel: versementMensuel,
    montant_initial: montantInitial,
    duree_annees: dureeAnnees,
    taux_interet: tauxInteret,
    // Entrées avec préfixe registre (pour compatibilité)
    ic_versement_mensuel_input: versementMensuel,
    ic_capital_initial_input: montantInitial,
    ic_duree_input: dureeAnnees,
    // Résultats calculés
    capital_final: resultats.capitalFinal,
    total_interets: resultats.totalInterets,
    total_versements: resultats.totalInvesti,
    rendement_total: parseFloat(resultats.multiplicateur),
    ic_capital_final: resultats.capitalFinal,
    ic_total_interets: resultats.totalInterets,
    ic_rendement_total: parseFloat(resultats.multiplicateur),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Validation
  const handleValidate = async () => {
    const formData = {
      montant_initial: montantInitial,
      versement_mensuel: versementMensuel,
      duree_annees: dureeAnnees,
      taux_interet: tauxInteret,
    };

    startValidation();
    
    await validateSimulation({
      simulatorType: "interets_composes",
      simulationData: formData,
      resultsData: resultats,
    });
  };

  const handleValidationComplete = () => {
    completeValidation();
    setShowResults(true);
  };

  const handleReset = () => {
    setShowResults(false);
    setCurrentStep(0);
  };

  // Sauvegarde - passer le nom par défaut directement à openSaveDialog
  const handleSave = () => {
    const now = new Date();
    const defaultName = `Intérêts composés - ${format(now, "dd/MM/yyyy HH:mm")}`;
    const nameToUse = loadedSimulationName || defaultName;
    openSaveDialog(nameToUse);
  };

  const handleConfirmSave = async () => {
    await saveSimulation({
      montant_initial: montantInitial,
      versement_mensuel: versementMensuel,
      duree_annees: dureeAnnees,
      taux_interet: tauxInteret,
      capital_final: resultats.capitalFinal,
      total_interets: resultats.totalInterets,
      total_investi: resultats.totalInvesti,
    });
    markAsSaved();
  };

  // Définition des étapes
  const steps: SimulatorStep[] = [
    {
      id: "intro",
      title: "Les intérêts composés",
      subtitle: "Votre argent qui travaille pour vous",
      icon: Target,
      content: (
        <div className="space-y-6">
          {/* Hero visuel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 p-6 border border-primary/20"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
            
            <div className="relative z-10 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30"
              >
                <Zap className="h-8 w-8 text-white" />
              </motion.div>
              
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                L'effet "boule de neige" financier
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Les intérêts composés génèrent des intérêts sur vos intérêts. 
                C'est la 8ème merveille du monde selon Albert Einstein !
              </p>
            </div>
          </motion.div>

          {/* Ce que vous allez découvrir */}
          <div className="grid gap-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Ce simulateur vous permettra de :
            </h4>
            
            {[
              { icon: TrendingUp, text: "Visualiser la croissance de votre capital dans le temps", delay: 0.1 },
              { icon: PiggyBank, text: "Comparer l'impact de différents montants d'épargne", delay: 0.2 },
              { icon: Sparkles, text: "Découvrir combien d'intérêts vous pouvez générer", delay: 0.3 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: item.delay }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/80 transition-colors"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm">{item.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Informations à préparer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-300 text-sm">Informations à renseigner</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Capital initial, versement mensuel, durée et taux de rendement souhaité
                </p>
              </div>
            </div>
          </motion.div>

          {/* Le CTA texte est supprimé, le bouton Continuer du wizard prend le relais */}
        </div>
      ),
    },
    {
      id: "initial",
      title: "Votre capital initial",
      subtitle: "Le montant que vous investissez au départ",
      icon: PiggyBank,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Capital de départ"
            tooltip="Le montant que vous investissez initialement"
            value={montantInitial}
            onChange={setMontantInitial}
            type="currency"
            showSlider
            sliderMin={0}
            sliderMax={200000}
            sliderStep={1000}
            delay={0}
            highlight
          />

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span>Plus vous commencez tôt, plus l'effet "boule de neige" est puissant !</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "versements",
      title: "Vos versements réguliers",
      subtitle: "Le montant que vous ajoutez chaque mois",
      icon: Calendar,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Versement mensuel"
            tooltip="Le montant que vous ajoutez à votre épargne chaque mois"
            value={versementMensuel}
            onChange={setVersementMensuel}
            type="currency"
            showSlider
            sliderMin={0}
            sliderMax={3000}
            sliderStep={50}
            delay={0}
          />

          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <strong>Versement annuel :</strong> {formatCurrency(versementMensuel * 12)}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "duree",
      title: "Durée de placement",
      subtitle: "Le temps est votre meilleur allié",
      icon: Clock,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Durée de placement"
            tooltip="Plus la durée est longue, plus les intérêts composés travaillent pour vous"
            value={dureeAnnees}
            onChange={setDureeAnnees}
            type="slider"
            min={1}
            max={40}
            step={1}
            delay={0}
            formatDisplay={(v) => `${v} ans`}
          />

          <div className="grid grid-cols-3 gap-2">
            {[10, 20, 30].map((years) => (
              <button
                key={years}
                onClick={() => setDureeAnnees(years)}
                className={cn(
                  "p-3 rounded-lg border text-center transition-all",
                  dureeAnnees === years 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "hover:border-primary/50"
                )}
              >
                <div className="font-bold">{years} ans</div>
              </button>
            ))}
          </div>
        </div>
      ),
      isValid: () => dureeAnnees > 0,
    },
    {
      id: "rendement",
      title: "Taux de rendement",
      subtitle: "Selon le type de placement choisi",
      icon: Percent,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Taux de rendement annuel"
            tooltip="Le rendement dépend du type de placement et du niveau de risque"
            value={tauxInteret}
            onChange={setTauxInteret}
            type="slider"
            min={1}
            max={12}
            step={0.5}
            delay={0}
            formatDisplay={(v) => `${v}%`}
          />

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Rendements de référence :</p>
            {TAUX_REFERENCE.map((ref) => (
              <button
                key={ref.label}
                onClick={() => setTauxInteret(ref.taux)}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-all",
                  tauxInteret === ref.taux && "ring-2 ring-primary border-primary",
                  ref.couleur
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">~{ref.taux}% - {ref.label}</div>
                    <p className="text-xs text-muted-foreground">{ref.description}</p>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        ref.taux === 2 && "border-green-500/50 text-green-700 dark:text-green-300 bg-green-100/50 dark:bg-green-900/30",
                        ref.taux === 6 && "border-blue-500/50 text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/30",
                        ref.taux === 8 && "border-purple-500/50 text-purple-700 dark:text-purple-300 bg-purple-100/50 dark:bg-purple-900/30"
                      )}
                    >
                      Risque : {ref.risque}
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground italic">
            ⚠️ Ces taux sont indicatifs. Les performances passées ne préjugent pas des performances futures.
          </p>
        </div>
      ),
    },
  ];


  // Résultats
  const resultsContent = (
    <SimulatorResultsSection
      mainResult={{
        title: `Votre capital dans ${dureeAnnees} ans`,
        value: resultats.capitalFinal,
        subtitle: `Soit ×${resultats.multiplicateur} votre investissement total`,
        badge: `${tauxInteret}% / an`,
      }}
      ctas={ctas}
      onSave={openSaveDialog}
      onReset={handleReset}
    >
      <div className="grid md:grid-cols-3 gap-4">
        <ResultCard
          title="Total investi"
          value={resultats.totalInvesti}
          icon={PiggyBank}
          delay={0}
        />
        <ResultCard
          title="Intérêts générés"
          value={resultats.totalInterets}
          subtitle="La magie des intérêts composés"
          icon={Sparkles}
          variant="success"
          delay={1}
        />
        <ResultCard
          title="Sans versements mensuels"
          value={resultats.capitalSansVersements}
          subtitle="Juste avec le capital initial"
          icon={TrendingUp}
          delay={2}
        />
      </div>

      {/* Graphique d'évolution */}
      <div className="mt-6 p-4 rounded-lg bg-muted/30">
        <h3 className="font-medium mb-4">Évolution de votre capital</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={resultats.evolutionAnnuelle}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="annee" tickFormatter={(v) => `${v} an${v > 1 ? 's' : ''}`} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
              <RechartsTooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'Capital' ? 'Capital' : name === 'Intérêts' ? 'Intérêts' : name
                ]}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="versements" 
                stackId="1"
                stroke="hsl(25 95% 53%)" 
                fill="hsl(25 95% 53%)"
                fillOpacity={0.4}
                name="Capital"
              />
              <Area 
                type="monotone" 
                dataKey="interets" 
                stackId="1"
                stroke="hsl(142 76% 36%)" 
                fill="hsl(142 76% 36%)"
                fillOpacity={0.5}
                name="Intérêts"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SimulatorResultsSection>
  );

  // Affichage pendant le chargement
  if (isLoadingSimulation) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Chargement de la simulation...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      {/* Bandeau de simulation chargée */}
      {loadedSimulationName && showResults && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
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

      <SimulatorWizard
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onValidate={handleValidate}
        isValidating={showValidationOverlay}
        resultsContent={resultsContent}
        showResults={showResults || isFromHistory}
        title="Simulateur d'Intérêts Composés"
        subtitle="Découvrez la puissance de l'effet boule de neige"
        onBack={() => navigate("/employee/simulations")}
        firstStepButtonText="Commençons la simulation"
      />

      <SimulationValidationOverlay
        isValidating={showValidationOverlay}
        onComplete={handleValidationComplete}
        simulatorName="Intérêts Composés"
        simulatorId="interets_composes"
      />

      <SaveSimulationDialog
        open={showSaveDialog}
        onOpenChange={(open) => { if (!open) closeSaveDialog(); }}
        simulationName={simulationName}
        onSimulationNameChange={setSimulationName}
        onSave={handleConfirmSave}
        isSaving={isSaving}
        showExpertPrompt={showExpertPrompt}
        onCloseExpertPrompt={closeExpertPrompt}
      />
    </>
  );
};

export default SimulateurInteretsComposes;
