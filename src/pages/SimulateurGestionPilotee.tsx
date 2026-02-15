import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PiggyBank, Calendar, TrendingUp, Sparkles, Clock, Lightbulb,
  Shield, Zap, Target, ArrowRight, Info, ShieldCheck, BarChart3, Compass,
} from "lucide-react";
import { useSimulationTracking } from "@/hooks/useSimulationTracking";
import { useCTARulesEngine } from "@/hooks/useCTARulesEngine";
import { SimulatorWizard, SimulatorStep } from "@/components/simulators/SimulatorWizard";
import { SimulatorStepField } from "@/components/simulators/SimulatorStepField";
import { SimulatorResultsSection, ResultCard } from "@/components/simulators/SimulatorResultsSection";
import { SimulationValidationOverlay } from "@/components/simulators/SimulationValidationOverlay";
import { SaveSimulationDialog } from "@/components/simulators/SaveSimulationDialog";
import { SimulatorDisclaimer } from "@/components/simulators/SimulatorDisclaimer";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useUnifiedSimulationSave } from "@/hooks/useUnifiedSimulationSave";
import { useSimulationLoader } from "@/hooks/useSimulationLoader";
import { format } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";

/* ───────────────── CONSTANTES ───────────────── */

const RATES = {
  FONDS_EUROS: { optimiste: 0.035, median: 0.025, pessimiste: 0.015 },
  UC: { optimiste: 0.10, median: 0.07, pessimiste: 0.02 },
};

type ProfileKey = "PRUDENT" | "EQUILIBRE" | "DYNAMIQUE";

const PROFILES: Record<ProfileKey, { fe: number; uc: number; label: string; description: string; risk: string; icon: typeof Shield }> = {
  PRUDENT: { fe: 0.7, uc: 0.3, label: "Prudent", description: "Sécurité renforcée, croissance modérée", risk: "Faible", icon: Shield },
  EQUILIBRE: { fe: 0.5, uc: 0.5, label: "Équilibré", description: "Compromis optimal risque / rendement", risk: "Modéré", icon: BarChart3 },
  DYNAMIQUE: { fe: 0.2, uc: 0.8, label: "Dynamique", description: "Maximum de croissance, plus de volatilité", risk: "Élevé", icon: Zap },
};

type ProductType = "AV" | "PER";

const SCENARIO_COLORS = {
  optimiste: { stroke: "hsl(142 76% 36%)", fill: "hsl(142 76% 36%)" },
  median: { stroke: "hsl(217 91% 60%)", fill: "hsl(217 91% 60%)" },
  pessimiste: { stroke: "hsl(0 84% 60%)", fill: "hsl(0 84% 60%)" },
};

const DONUT_COLORS = ["hsl(217 91% 60%)", "hsl(38 92% 50%)"];

/* ───────────────── MOTEUR DE CALCUL ───────────────── */

interface YearData {
  year: number;
  optimiste: number;
  median: number;
  pessimiste: number;
  invested: number;
  allocationFE: number;
  allocationUC: number;
}

function simulateGrowth(
  initial: number,
  monthly: number,
  duration: number,
  profile: ProfileKey,
  isPER: boolean,
  scenario: "optimiste" | "median" | "pessimiste",
): number[] {
  let totalCapital = initial;
  const results: number[] = [initial];

  for (let year = 1; year <= duration; year++) {
    let currentFE: number, currentUC: number;

    if (isPER) {
      const yearsToEnd = duration - year;
      if (yearsToEnd <= 3) {
        currentFE = 0.8; currentUC = 0.2;
      } else if (yearsToEnd <= 8) {
        currentFE = 0.5; currentUC = 0.5;
      } else {
        currentFE = PROFILES[profile].fe;
        currentUC = PROFILES[profile].uc;
      }
    } else {
      currentFE = PROFILES[profile].fe;
      currentUC = PROFILES[profile].uc;
    }

    const annualRate =
      currentFE * RATES.FONDS_EUROS[scenario] + currentUC * RATES.UC[scenario];
    totalCapital = (totalCapital + monthly * 12) * (1 + annualRate);
    results.push(Math.round(totalCapital));
  }
  return results;
}

function getAllocation(
  year: number,
  duration: number,
  profile: ProfileKey,
  isPER: boolean,
): { fe: number; uc: number } {
  if (isPER) {
    const yearsToEnd = duration - year;
    if (yearsToEnd <= 3) return { fe: 80, uc: 20 };
    if (yearsToEnd <= 8) return { fe: 50, uc: 50 };
  }
  return { fe: PROFILES[profile].fe * 100, uc: PROFILES[profile].uc * 100 };
}

/* ───────────────── COMPOSANT PAGE ───────────────── */

const SimulateurGestionPilotee = () => {
  const navigate = useNavigate();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Form state
  const [capitalInitial, setCapitalInitial] = useState(10000);
  const [versementMensuel, setVersementMensuel] = useState(200);
  const [dureeAnnees, setDureeAnnees] = useState(20);
  const [profile, setProfile] = useState<ProfileKey>("EQUILIBRE");
  const [product, setProduct] = useState<ProductType>("AV");

  // Tracking
  const {
    startValidation,
    completeValidation,
    showValidationOverlay,
    validateSimulation,
    markAsSaved,
  } = useSimulationTracking();

  // Save
  const {
    showSaveDialog,
    openSaveDialog,
    closeSaveDialog,
    simulationName,
    setSimulationName,
    saveSimulation,
    isSaving,
  } = useUnifiedSimulationSave({
    type: "gestion_pilotee",
    queryCacheKey: "simulations",
  });

  // Load
  const restoreSimulationData = useCallback((data: Record<string, unknown>) => {
    if (data.capital_initial) setCapitalInitial(data.capital_initial as number);
    if (data.versement_mensuel) setVersementMensuel(data.versement_mensuel as number);
    if (data.duree_annees) setDureeAnnees(data.duree_annees as number);
    if (data.profile) setProfile(data.profile as ProfileKey);
    if (data.product) setProduct(data.product as ProductType);
    setShowResults(true);
  }, []);

  const { isLoadingSimulation, loadedSimulationName, isFromHistory } = useSimulationLoader({
    onDataLoaded: (data, name) => {
      restoreSimulationData(data);
      if (name) setSimulationName(name);
    },
  });

  // CTAs
  const { ctas } = useCTARulesEngine("gestion_pilotee", {
    versement_mensuel: versementMensuel,
    duree_annees: dureeAnnees,
  });

  // ──────── Calculs ────────
  const resultats = useMemo(() => {
    const optimiste = simulateGrowth(capitalInitial, versementMensuel, dureeAnnees, profile, product === "PER", "optimiste");
    const median = simulateGrowth(capitalInitial, versementMensuel, dureeAnnees, profile, product === "PER", "median");
    const pessimiste = simulateGrowth(capitalInitial, versementMensuel, dureeAnnees, profile, product === "PER", "pessimiste");

    const chartData: YearData[] = [];
    for (let y = 0; y <= dureeAnnees; y++) {
      const invested = capitalInitial + versementMensuel * 12 * y;
      const alloc = getAllocation(y, dureeAnnees, profile, product === "PER");
      chartData.push({
        year: y,
        optimiste: optimiste[y],
        median: median[y],
        pessimiste: pessimiste[y],
        invested,
        allocationFE: alloc.fe,
        allocationUC: alloc.uc,
      });
    }

    const totalInvested = capitalInitial + versementMensuel * 12 * dureeAnnees;
    const finalAlloc = getAllocation(dureeAnnees, dureeAnnees, profile, product === "PER");

    return {
      chartData,
      totalInvested,
      capitalMedian: median[dureeAnnees],
      capitalOptimiste: optimiste[dureeAnnees],
      capitalPessimiste: pessimiste[dureeAnnees],
      gainsMedian: median[dureeAnnees] - totalInvested,
      allocationFE: finalAlloc.fe,
      allocationUC: finalAlloc.uc,
    };
  }, [capitalInitial, versementMensuel, dureeAnnees, profile, product]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(value);

  // ──────── Validation ────────
  const handleValidate = async () => {
    startValidation();
    await validateSimulation({
      simulatorType: "gestion_pilotee",
      simulationData: { capital_initial: capitalInitial, versement_mensuel: versementMensuel, duree_annees: dureeAnnees, profile, product },
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

  const handleSave = () => {
    const defaultName = `Gestion pilotée - ${format(new Date(), "dd/MM/yyyy HH:mm")}`;
    openSaveDialog(loadedSimulationName || defaultName);
  };

  const handleConfirmSave = async () => {
    await saveSimulation({
      capital_initial: capitalInitial,
      versement_mensuel: versementMensuel,
      duree_annees: dureeAnnees,
      profile,
      product,
      capital_median: resultats.capitalMedian,
      capital_optimiste: resultats.capitalOptimiste,
      capital_pessimiste: resultats.capitalPessimiste,
      total_investi: resultats.totalInvested,
    });
    markAsSaved();
  };

  // ──────── Current allocation for donut ────────
  const currentAlloc = getAllocation(
    Math.min(currentStep === 3 ? dureeAnnees : 0, dureeAnnees),
    dureeAnnees,
    profile,
    product === "PER"
  );

  const donutData = [
    { name: "Fonds Euro", value: currentAlloc.fe },
    { name: "Unités de Compte", value: currentAlloc.uc },
  ];

  // ──────── Steps ────────
  const steps: SimulatorStep[] = [
    {
      id: "intro",
      title: "Comprendre la gestion pilotée",
      subtitle: "Un simulateur pédagogique",
      icon: Compass,
      content: (
        <div className="space-y-6">
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
                <Compass className="h-8 w-8 text-white" />
              </motion.div>

              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Comment fonctionne la gestion pilotée ?
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                La gestion pilotée adapte automatiquement la répartition entre sécurité (Fonds Euro) 
                et croissance (Unités de Compte) selon votre profil de risque.
              </p>
            </div>
          </motion.div>

          <div className="grid gap-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Ce simulateur vous permettra de :
            </h4>

            {[
              { icon: BarChart3, text: "Comparer Assurance Vie et PER en gestion pilotée", delay: 0.1 },
              { icon: Shield, text: "Visualiser la sécurisation progressive du PER (gestion à horizon)", delay: 0.2 },
              { icon: TrendingUp, text: "Explorer 3 scénarios de marché : optimiste, médian et pessimiste", delay: 0.3 },
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
                <p className="font-medium text-amber-700 dark:text-amber-300 text-sm">Outil pédagogique</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ce simulateur est à vocation éducative. Il ne constitue pas un conseil en investissement.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      id: "product",
      title: "Type de contrat",
      subtitle: "Assurance Vie ou Plan d'Épargne Retraite",
      icon: ShieldCheck,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              {
                key: "AV" as ProductType,
                title: "Assurance Vie",
                desc: "Répartition fixe selon votre profil. Souplesse de retrait, fiscalité avantageuse après 8 ans.",
                icon: PiggyBank,
              },
              {
                key: "PER" as ProductType,
                title: "Plan d'Épargne Retraite",
                desc: "Gestion à horizon : la part sécurisée augmente automatiquement à l'approche de la retraite.",
                icon: Target,
              },
            ]).map((p) => (
              <button
                key={p.key}
                onClick={() => setProduct(p.key)}
                className={cn(
                  "p-5 rounded-xl border-2 text-left transition-all group",
                  product === p.key
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border hover:border-primary/40"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    product === p.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{p.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
                  </div>
                </div>
                {product === p.key && p.key === "PER" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      <span>La sécurisation progressive sera visible sur le graphique de résultats</span>
                    </div>
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "capital",
      title: "Votre investissement",
      subtitle: "Capital de départ et versements réguliers",
      icon: PiggyBank,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Capital de départ"
            tooltip="Le montant que vous investissez initialement"
            value={capitalInitial}
            onChange={setCapitalInitial}
            type="currency"
            showSlider
            sliderMin={0}
            sliderMax={100000}
            sliderStep={1000}
            delay={0}
            highlight
          />
          <SimulatorStepField
            label="Versement mensuel"
            tooltip="Le montant que vous ajoutez chaque mois à votre contrat"
            value={versementMensuel}
            onChange={setVersementMensuel}
            type="currency"
            showSlider
            sliderMin={0}
            sliderMax={2000}
            sliderStep={25}
            delay={1}
          />
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <strong>Total investi sur {dureeAnnees} ans :</strong>{" "}
              {formatCurrency(capitalInitial + versementMensuel * 12 * dureeAnnees)}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "duree",
      title: "Durée du projet",
      subtitle: "Le temps est votre meilleur allié",
      icon: Clock,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Durée de placement"
            tooltip="Plus la durée est longue, plus l'effet des intérêts composés est puissant"
            value={dureeAnnees}
            onChange={setDureeAnnees}
            type="slider"
            min={1}
            max={40}
            step={1}
            delay={0}
            formatDisplay={(v) => `${v} ans`}
          />
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 20, 30].map((years) => (
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
      id: "profil",
      title: "Votre profil de risque",
      subtitle: "Choisissez votre stratégie d'allocation",
      icon: BarChart3,
      content: (
        <div className="space-y-6">
          <div className="grid gap-3">
            {(Object.entries(PROFILES) as [ProfileKey, typeof PROFILES[ProfileKey]][]).map(([key, p]) => (
              <button
                key={key}
                onClick={() => setProfile(key)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  profile === key
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2.5 rounded-lg",
                    profile === key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{p.label}</h4>
                      <Badge variant="outline" className="text-xs">
                        Risque {p.risk}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{p.description}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground hidden md:block">
                    <div>{p.fe * 100}% Sécurité</div>
                    <div>{p.uc * 100}% Croissance</div>
                  </div>
                </div>

                <AnimatePresence>
                  {profile === key && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 overflow-hidden"
                    >
                      {/* Mini allocation bar */}
                      <div className="flex rounded-full overflow-hidden h-3">
                        <div
                          className="bg-primary/60 transition-all"
                          style={{ width: `${p.fe * 100}%` }}
                        />
                        <div
                          className="bg-amber-500/70 transition-all"
                          style={{ width: `${p.uc * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>🛡️ Fonds Euro {p.fe * 100}%</span>
                        <span>📈 UC {p.uc * 100}%</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>

          {/* Donut preview */}
          <div className="flex items-center justify-center">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // ──────── Résultats ────────
  const resultsContent = (
    <SimulatorResultsSection
      mainResult={{
        title: `Capital estimé (scénario médian) dans ${dureeAnnees} ans`,
        value: resultats.capitalMedian,
        subtitle: `Soit ${formatCurrency(resultats.gainsMedian)} d'intérêts générés · Profil ${PROFILES[profile].label}`,
        badge: `${product === "AV" ? "Assurance Vie" : "PER"} · ${PROFILES[profile].label}`,
      }}
      ctas={ctas}
      onSave={handleSave}
      onReset={handleReset}
    >
      {/* KPI cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <ResultCard
          title="Scénario optimiste"
          value={resultats.capitalOptimiste}
          subtitle="Marchés en hausse"
          icon={TrendingUp}
          variant="success"
          delay={0}
        />
        <ResultCard
          title="Scénario médian"
          value={resultats.capitalMedian}
          subtitle="Moyennes historiques"
          icon={BarChart3}
          variant="highlight"
          delay={1}
        />
        <ResultCard
          title="Scénario pessimiste"
          value={resultats.capitalPessimiste}
          subtitle="Marchés en baisse"
          icon={Shield}
          variant="warning"
          delay={2}
        />
      </div>

      <div className="grid md:grid-cols-4 gap-4 mt-4">
        <ResultCard
          title="Total investi"
          value={resultats.totalInvested}
          icon={PiggyBank}
          delay={3}
        />
        <ResultCard
          title="Gains médians"
          value={resultats.gainsMedian}
          subtitle="Intérêts composés"
          icon={Sparkles}
          variant="success"
          delay={4}
        />
        <ResultCard
          title="Allocation finale"
          value={`${resultats.allocationFE}% / ${resultats.allocationUC}%`}
          subtitle="Sécurité / Croissance"
          icon={BarChart3}
          delay={5}
        />
        <ResultCard
          title="Durée"
          value={`${dureeAnnees} ans`}
          icon={Clock}
          delay={6}
        />
      </div>

      {/* ──────── Graphique 3 scénarios ──────── */}
      <div className="mt-6 p-4 rounded-lg bg-muted/30">
        <h3 className="font-medium mb-1">Évolution du capital selon 3 scénarios</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Les zones colorées représentent la fourchette entre le scénario pessimiste et optimiste
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={resultats.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="year" tickFormatter={(v) => `${v}a`} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
              <RechartsTooltip
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    optimiste: "🟢 Optimiste",
                    median: "🔵 Médian",
                    pessimiste: "🔴 Pessimiste",
                    invested: "💰 Investi",
                  };
                  return [formatCurrency(value), labels[name] || name];
                }}
                labelFormatter={(v) => `Année ${v}`}
              />
              <Legend
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    optimiste: "Optimiste",
                    median: "Médian",
                    pessimiste: "Pessimiste",
                    invested: "Total investi",
                  };
                  return labels[value] || value;
                }}
              />
              <Area
                type="monotone"
                dataKey="invested"
                stroke="hsl(var(--muted-foreground))"
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.1}
                strokeDasharray="5 5"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="pessimiste"
                stroke={SCENARIO_COLORS.pessimiste.stroke}
                fill={SCENARIO_COLORS.pessimiste.fill}
                fillOpacity={0.08}
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="median"
                stroke={SCENARIO_COLORS.median.stroke}
                fill={SCENARIO_COLORS.median.fill}
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="optimiste"
                stroke={SCENARIO_COLORS.optimiste.stroke}
                fill={SCENARIO_COLORS.optimiste.fill}
                fillOpacity={0.1}
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ──────── Donut allocation + horizon PER ──────── */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="p-4 rounded-lg bg-muted/30">
          <h3 className="font-medium mb-2">Répartition de votre allocation</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Fonds Euro (sécurité)", value: resultats.allocationFE },
                    { name: "Unités de Compte (croissance)", value: resultats.allocationUC },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  strokeWidth={0}
                  label={({ name, value }) => `${value}%`}
                >
                  <Cell fill={DONUT_COLORS[0]} />
                  <Cell fill={DONUT_COLORS[1]} />
                </Pie>
                <RechartsTooltip formatter={(v: number, name: string) => [`${v}%`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PER Horizon animation or AV explanation */}
        <div className="p-4 rounded-lg bg-muted/30">
          {product === "PER" ? (
            <>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                Gestion à horizon
                <Badge variant="secondary" className="text-xs">PER</Badge>
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                La part sécurisée augmente automatiquement à l'approche de l'échéance
              </p>
              <div className="space-y-2">
                {[
                  { label: `Années 1 à ${Math.max(dureeAnnees - 8, 1)}`, fe: PROFILES[profile].fe * 100, uc: PROFILES[profile].uc * 100, phase: "Croissance" },
                  { label: `Années ${Math.max(dureeAnnees - 8, 1) + 1} à ${Math.max(dureeAnnees - 3, 1)}`, fe: 50, uc: 50, phase: "Transition" },
                  { label: `Années ${Math.max(dureeAnnees - 3, 1) + 1} à ${dureeAnnees}`, fe: 80, uc: 20, phase: "Sécurisation" },
                ].map((phase, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="space-y-1"
                  >
                    <div className="flex justify-between text-xs">
                      <span>{phase.label}</span>
                      <Badge variant="outline" className="text-xs">{phase.phase}</Badge>
                    </div>
                    <div className="flex rounded-full overflow-hidden h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${phase.fe}%` }}
                        transition={{ delay: i * 0.15 + 0.3, duration: 0.5 }}
                        className="bg-primary/60"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${phase.uc}%` }}
                        transition={{ delay: i * 0.15 + 0.3, duration: 0.5 }}
                        className="bg-amber-500/70"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>🛡️ {phase.fe}%</span>
                      <span>📈 {phase.uc}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className="font-medium mb-2">Allocation fixe</h3>
              <p className="text-xs text-muted-foreground mb-3">
                En Assurance Vie, la répartition reste constante selon votre profil choisi.
              </p>
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: DONUT_COLORS[0] }} />
                  <div>
                    <div className="font-medium text-sm">Fonds Euro · {PROFILES[profile].fe * 100}%</div>
                    <div className="text-xs text-muted-foreground">Capital garanti, rendement modéré (~2.5%)</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: DONUT_COLORS[1] }} />
                  <div>
                    <div className="font-medium text-sm">Unités de Compte · {PROFILES[profile].uc * 100}%</div>
                    <div className="text-xs text-muted-foreground">Potentiel de croissance, risque de perte</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6">
        <SimulatorDisclaimer />
      </div>
    </SimulatorResultsSection>
  );

  // ──────── Rendu ────────
  if (isLoadingSimulation) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
          <p className="text-muted-foreground">Chargement de la simulation...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      {loadedSimulationName && showResults && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <Alert className="border-blue-500/20 bg-blue-50 dark:bg-blue-950/20">
            <AlertDescription className="flex items-center justify-between">
              <span className="font-medium">📊 Simulation : {loadedSimulationName}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/employee/simulations?tab=historique")}
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
        title="Comprendre la Gestion Pilotée"
        subtitle="Simulez et comparez Assurance Vie et PER en gestion pilotée"
        onBack={() => navigate("/employee/simulations")}
        firstStepButtonText="Commençons"
      />

      <SimulationValidationOverlay
        isValidating={showValidationOverlay}
        onComplete={handleValidationComplete}
        simulatorName="Gestion Pilotée"
        simulatorId="gestion_pilotee"
      />

      <SaveSimulationDialog
        open={showSaveDialog}
        onOpenChange={(open) => { if (!open) closeSaveDialog(); }}
        simulationName={simulationName}
        onSimulationNameChange={setSimulationName}
        onSave={handleConfirmSave}
        isSaving={isSaving}
      />
    </>
  );
};

export default SimulateurGestionPilotee;
