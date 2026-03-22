import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SimulatorHeader } from "@/components/simulators/SimulatorHeader";
import { SimulatorDisclaimer } from "@/components/simulators/SimulatorDisclaimer";
import { SimulationValidationOverlay } from "@/components/simulators/SimulationValidationOverlay";
import { CapaciteEpargneIntroScreen } from "@/components/simulators/capacite-epargne/CapaciteEpargneIntroScreen";
import { useFinancialProfilePrefill } from "@/hooks/useFinancialProfilePrefill";
import { useUserRealEstateProperties } from "@/hooks/useUserRealEstateProperties";
import { useSimulationTracking } from "@/hooks/useSimulationTracking";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ChevronRight, ChevronLeft, Wallet, Home, Car, Zap, Shield,
  Wifi, CreditCard, GraduationCap, Receipt,
  ShoppingBag, Gamepad2, Tv, Gem, PiggyBank, TrendingUp,
  Lightbulb, ArrowRight, PartyPopper, CheckCircle2, Copy, Info,
  Building,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { cn } from "@/lib/utils";
import { useFiscalRules, useSimulationDefaults } from "@/contexts/GlobalSettingsContext";

// ─── Types ──────────────────────────────────────────────
interface FieldConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  placeholder?: string;
  tooltip?: string;
}

// ─── Field definitions per step ──────────────────────────
const STEP_1_FIELDS: FieldConfig[] = [
  { key: "salaire", label: "Salaire net mensuel du foyer", icon: Wallet, placeholder: "3 500" },
  { key: "revenusFonciers", label: "Revenus fonciers mensuels", icon: Building, placeholder: "0" },
  { key: "autresRevenus", label: "Autres revenus", icon: PiggyBank, placeholder: "0" },
];

const STEP_2_FIELDS: FieldConfig[] = [
  // Charges fixes
  { key: "loyer", label: "Loyer / Prêt immobilier", icon: Home, placeholder: "800" },
  { key: "factures", label: "Énergie & factures", icon: Zap, placeholder: "150" },
  { key: "transports", label: "Transports", icon: Car, placeholder: "75" },
  { key: "assurances", label: "Assurances", icon: Shield, placeholder: "50" },
  { key: "telecom", label: "Internet & mobile", icon: Wifi, placeholder: "50" },
  { key: "impots", label: "Impôts mensualisés", icon: Receipt, placeholder: "0", tooltip: "Estimé depuis votre profil ATLAS ou calculé automatiquement." },
  { key: "credits", label: "Crédits en cours", icon: CreditCard, placeholder: "0" },
  { key: "scolarite", label: "Frais de scolarité", icon: GraduationCap, placeholder: "0" },
  { key: "pensionAlimentaire", label: "Pension alimentaire", icon: Receipt, placeholder: "0" },
  { key: "autresCharges", label: "Autres charges fixes", icon: Receipt, placeholder: "0" },
  // Style de vie
  { key: "courses", label: "Courses alimentaires", icon: ShoppingBag, placeholder: "400" },
  { key: "loisirs", label: "Loisirs & sorties", icon: Gamepad2, placeholder: "100" },
  { key: "abonnements", label: "Abonnements (streaming…)", icon: Tv, placeholder: "30" },
  { key: "shopping", label: "Shopping & divers", icon: Gem, placeholder: "50" },
  // Immobilier locatif charges
  { key: "chargesImmoLocatif", label: "Charges immobilier locatif", icon: Building, placeholder: "0", tooltip: "Mensualités de crédit et charges liées à vos biens locatifs." },
];

type FormValues = Record<string, number>;

// ─── Component ──────────────────────────────────────────
const SimulateurCapaciteEpargne = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tax_brackets } = useFiscalRules();
  const simulationDefaults = useSimulationDefaults();
  const { getPrefillData, hasProfile } = useFinancialProfilePrefill();
  const { totals: realEstateTotals } = useUserRealEstateProperties();
  const { validateSimulation } = useSimulationTracking();

  // showIntro → step 0-1 input → validating → results
  const [showIntro, setShowIntro] = useState(true);
  const [step, setStep] = useState(0); // 0 = revenus, 1 = dépenses
  const [isValidating, setIsValidating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [optimisation, setOptimisation] = useState(false);
  const [values, setValues] = useState<FormValues>({});
  const [prefilled, setPrefilled] = useState(false);
  const [prefilledKeys, setPrefilledKeys] = useState<Set<string>>(new Set());
  const [savingToProfile, setSavingToProfile] = useState(false);
  const [atlasImpot, setAtlasImpot] = useState<number | null>(null);

  // Load Atlas tax data
  useEffect(() => {
    if (!user?.id) return;
    const loadAtlas = async () => {
      const { data } = await supabase
        .from("ocr_avis_imposition_analyses" as any)
        .select("impot_net_total")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle() as any;
      if (data?.impot_net_total != null) {
        setAtlasImpot(Math.round((data as any).impot_net_total / 12));
      }
    };
    loadAtlas();
  }, [user?.id]);

  // Prefill from financial profile
  useEffect(() => {
    if (prefilled) return;
    const data = getPrefillData();
    if (!data.profile) return;

    const p = data.profile;
    const newValues: FormValues = {};

    // Salaire net mensuel du foyer
    if (p.revenu_mensuel_net > 0) {
      newValues.salaire = Math.round(p.revenu_mensuel_net / 12);
    } else if (p.revenu_annuel_brut > 0) {
      const brut = (p.revenu_annuel_brut || 0) + (p.revenu_annuel_brut_conjoint || 0);
      newValues.salaire = Math.round((brut * (simulationDefaults.brut_net_ratio / 100)) / 12);
    }

    // Revenus fonciers
    if (p.revenus_locatifs > 0) newValues.revenusFonciers = Math.round(p.revenus_locatifs / 12);

    // Autres revenus
    if (p.autres_revenus_mensuels > 0) newValues.autresRevenus = p.autres_revenus_mensuels;

    // Charges fixes
    if (p.loyer_actuel > 0 || p.credits_immobilier > 0)
      newValues.loyer = (p.loyer_actuel || 0) + (p.credits_immobilier || 0);
    if (p.charges_energie > 0) newValues.factures = p.charges_energie;
    if (p.charges_transport_commun > 0 || p.charges_lld_loa_auto > 0 || p.charges_assurance_auto > 0)
      newValues.transports = (p.charges_transport_commun || 0) + (p.charges_lld_loa_auto || 0) + (p.charges_assurance_auto || 0);
    if (p.charges_assurance_habitation > 0) newValues.assurances = p.charges_assurance_habitation;
    if ((p.charges_internet || 0) + (p.charges_mobile || 0) > 0)
      newValues.telecom = (p.charges_internet || 0) + (p.charges_mobile || 0);
    if (p.credits_consommation > 0 || p.credits_auto > 0)
      newValues.credits = (p.credits_consommation || 0) + (p.credits_auto || 0);
    if (p.charges_frais_scolarite > 0) newValues.scolarite = p.charges_frais_scolarite;
    if (p.pensions_alimentaires > 0) newValues.pensionAlimentaire = p.pensions_alimentaires;
    if (p.charges_autres > 0) newValues.autresCharges = p.charges_autres;
    if (p.charges_copropriete_taxes > 0) newValues.autresCharges = (newValues.autresCharges || 0) + p.charges_copropriete_taxes;

    // Abonnements from profile
    if (p.charges_abonnements > 0) newValues.abonnements = p.charges_abonnements;

    // Charges immobilier locatif from real estate portfolio
    const immoLocatifTotal = (realEstateTotals.mensualitesTotal || 0) + (realEstateTotals.chargesTotal || 0);
    if (immoLocatifTotal > 0) {
      newValues.chargesImmoLocatif = immoLocatifTotal;
    }

    setPrefilledKeys(new Set(Object.keys(newValues)));
    setValues(newValues);
    setPrefilled(true);
  }, [getPrefillData, prefilled, simulationDefaults.brut_net_ratio]);

  // Apply atlas impot once loaded
  useEffect(() => {
    if (atlasImpot != null && !values.impots) {
      setValues(prev => ({ ...prev, impots: atlasImpot }));
      setPrefilledKeys(prev => new Set([...prev, "impots"]));
    }
  }, [atlasImpot]);

  // ─── Calculations ─────────────────────────────────────
  const calculations = useMemo(() => {
    const sum = (keys: string[]) => keys.reduce((acc, k) => acc + (values[k] || 0), 0);

    const revenus = sum(STEP_1_FIELDS.map(f => f.key));
    let depenses = sum(STEP_2_FIELDS.map(f => f.key));

    if (optimisation) {
      // Reduce "envies" portion (courses, loisirs, abonnements, shopping) by optimisation rate
      const enviesKeys = ["courses", "loisirs", "abonnements", "shopping"];
      const enviesTotal = sum(enviesKeys);
      const reduction = Math.round(enviesTotal * (simulationDefaults.optimisation_reduction_rate / 100));
      depenses -= reduction;
    }

    const epargne = Math.max(0, revenus - depenses);
    const projectionAnnuelle = epargne * 12;

    // Split for chart: fixed charges vs lifestyle
    const chargesFixesKeys = ["loyer", "factures", "transports", "assurances", "telecom", "impots", "credits", "scolarite", "pensionAlimentaire", "autresCharges", "chargesImmoLocatif"];
    const enviesKeys = ["courses", "loisirs", "abonnements", "shopping"];
    const besoins = sum(chargesFixesKeys);
    let envies = sum(enviesKeys);
    if (optimisation) envies = Math.round(envies * (1 - simulationDefaults.optimisation_reduction_rate / 100));

    const pctBesoins = revenus > 0 ? Math.round((besoins / revenus) * 100) : 0;
    const pctEnvies = revenus > 0 ? Math.round((envies / revenus) * 100) : 0;
    const pctEpargne = revenus > 0 ? Math.round((epargne / revenus) * 100) : 0;

    return { revenus, depenses, besoins, envies, epargne, projectionAnnuelle, pctBesoins, pctEnvies, pctEpargne };
  }, [values, optimisation, simulationDefaults.optimisation_reduction_rate]);

  // Track on results
  useEffect(() => {
    if (showResults && calculations.revenus > 0) {
      validateSimulation({
        simulatorType: "capacite_epargne",
        simulationData: { ...values },
        resultsData: { ...calculations },
      });
    }
  }, [showResults]);

  // ─── Navigation ───────────────────────────────────────
  const handleNext = () => {
    if (step < 1) {
      setStep(1);
    } else {
      setIsValidating(true);
    }
  };

  const handleValidationComplete = () => {
    setIsValidating(false);
    setShowResults(true);
  };

  const handlePrev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleChange = (key: string, val: string) => {
    const num = val === "" ? 0 : parseFloat(val);
    if (!isNaN(num)) setValues(prev => ({ ...prev, [key]: num }));
  };

  const handleSaveToProfile = async () => {
    if (!user?.id) return;
    setSavingToProfile(true);
    try {
      const { error } = await supabase
        .from("user_financial_profiles")
        .update({ capacite_epargne_mensuelle: calculations.epargne })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Capacité d'épargne enregistrée dans votre profil financier !");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSavingToProfile(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString("fr-FR");

  // ─── Donut Data ──────────────────────────────────────
  const donutData = [
    { name: "Charges fixes", value: calculations.besoins || 1, fill: "hsl(var(--primary))" },
    { name: "Style de vie", value: calculations.envies || 1, fill: "hsl(38 92% 50%)" },
    { name: "Épargne", value: calculations.epargne || 1, fill: "hsl(142 71% 45%)" },
  ];

  const stepFields = [STEP_1_FIELDS, STEP_2_FIELDS];
  const stepTitles = ["Revenus du foyer", "Vos dépenses mensuelles"];
  const stepSubtitles = [
    "Les entrées d'argent mensuelles de votre foyer",
    "Charges fixes, crédits, impôts et dépenses courantes",
  ];

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  // Show intro screen
  if (showIntro) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 max-w-3xl py-6">
          <SimulatorHeader
            title="Capacité d'Épargne"
            description="Découvrez votre potentiel de liberté financière"
            onBack={() => navigate('/employee/simulations')}
          />
          <CapaciteEpargneIntroScreen onStart={() => setShowIntro(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SimulationValidationOverlay
        isValidating={isValidating}
        onComplete={handleValidationComplete}
        simulatorName="Capacité d'Épargne"
        simulatorId="capacite_epargne"
      />

      <div className="container mx-auto px-4 max-w-3xl py-6">
        <SimulatorHeader
          title="Capacité d'Épargne"
          description="Découvrez votre potentiel de liberté financière"
          onBack={() => navigate('/employee/simulations')}
        />

        {hasProfile && !showResults && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <Badge variant="outline" className="gap-1.5 text-xs border-primary/30 text-primary bg-primary/5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Données pré-remplies depuis votre profil financier
            </Badge>
          </motion.div>
        )}

        {/* ─── Input Steps (0-1) ──────────────────────── */}
        {!showResults && (
          <>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {[0, 1].map(i => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    i === step ? "bg-primary text-primary-foreground" :
                    i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  {i < 1 && <div className={cn("flex-1 h-0.5 rounded", i < step ? "bg-primary/40" : "bg-muted")} />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="mb-5">
                      <h2 className="text-lg font-bold">{stepTitles[step]}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{stepSubtitles[step]}</p>
                    </div>
                    <TooltipProvider>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {stepFields[step].map(field => {
                        const Icon = field.icon;
                        const isPrefilled = prefilledKeys.has(field.key);
                        return (
                          <div key={field.key} className="space-y-1.5">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              {field.label}
                              {field.tooltip && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[250px] text-xs">
                                    {field.tooltip}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </Label>
                            <div className="relative">
                              <Input
                                type="number"
                                inputMode="numeric"
                                value={values[field.key] || ""}
                                onChange={e => handleChange(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className="pr-8"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                            </div>
                            {isPrefilled && (
                              <p className="text-[11px] text-primary/70 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Récupéré du profil
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    </TooltipProvider>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      {step > 0 ? (
                        <Button variant="outline" onClick={handlePrev} className="gap-2">
                          <ChevronLeft className="h-4 w-4" /> Précédent
                        </Button>
                      ) : <div />}
                      <Button onClick={handleNext} className="gap-2">
                        {step === 1 ? "Calculer ma capacité" : "Suivant"}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6">
              <SimulatorDisclaimer />
            </div>
          </>
        )}

        {/* ─── Results ──────────────────────── */}
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Hero Result */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 text-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <PartyPopper className="h-12 w-12 mx-auto text-primary mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">Votre potentiel de liberté financière</p>
                  <h2 className="text-5xl font-bold text-primary mb-1">
                    {fmt(calculations.epargne)} €<span className="text-lg text-muted-foreground font-normal"> /mois</span>
                  </h2>
                  <p className="text-lg text-muted-foreground mt-2">
                    Soit <span className="font-semibold text-foreground">{fmt(calculations.projectionAnnuelle)} €</span> par an
                  </p>
                </motion.div>
              </div>
            </Card>

            {/* Donut + Gauge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Répartition de vos revenus</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {donutData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number) => `${fmt(value)} €`}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--popover))",
                            color: "hsl(var(--popover-foreground))",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Charges fixes", value: calculations.besoins, pct: calculations.pctBesoins, color: "bg-primary" },
                      { label: "Style de vie", value: calculations.envies, pct: calculations.pctEnvies, color: "bg-amber-500" },
                      { label: "Épargne", value: calculations.epargne, pct: calculations.pctEpargne, color: "bg-emerald-500" },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", item.color)} />
                          <span>{item.label}</span>
                        </div>
                        <span className="font-medium">{fmt(item.value)} € ({item.pct}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Jauge {simulationDefaults.budget_rule_besoins}/{simulationDefaults.budget_rule_envies}/{simulationDefaults.budget_rule_epargne}</h3>
                  <div className="space-y-5">
                    {[
                      { label: "Charges fixes", actual: calculations.pctBesoins, ideal: simulationDefaults.budget_rule_besoins, color: "bg-primary" },
                      { label: "Style de vie", actual: calculations.pctEnvies, ideal: simulationDefaults.budget_rule_envies, color: "bg-amber-500" },
                      { label: "Épargne", actual: calculations.pctEpargne, ideal: simulationDefaults.budget_rule_epargne, color: "bg-emerald-500" },
                    ].map(g => (
                      <div key={g.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{g.label}</span>
                          <span className={cn(
                            "text-xs font-semibold",
                            g.label === "Épargne"
                              ? g.actual >= g.ideal ? "text-emerald-600" : "text-amber-600"
                              : g.actual <= g.ideal ? "text-emerald-600" : "text-amber-600"
                          )}>
                            {g.actual}% vs {g.ideal}% recommandé
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-muted relative overflow-hidden">
                          <motion.div
                            className={cn("h-full rounded-full", g.color)}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(g.actual, 100)}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                          <div
                            className="absolute top-0 h-full w-0.5 bg-foreground/50"
                            style={{ left: `${g.ideal}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Optimization toggle */}
                  <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Mode "Et si ?"</p>
                        <p className="text-xs text-muted-foreground">Réduire le style de vie de 10%</p>
                      </div>
                      <Switch checked={optimisation} onCheckedChange={setOptimisation} />
                    </div>
                    {optimisation && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 pt-3 border-t">
                        <p className="text-sm">
                          En optimisant, vous pourriez épargner{" "}
                          <span className="font-bold text-emerald-600">{fmt(calculations.epargne)} €/mois</span>{" "}
                          soit <span className="font-bold text-emerald-600">{fmt(calculations.projectionAnnuelle)} €/an</span>
                        </p>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Copy to Profile CTA */}
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-background">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 flex-shrink-0">
                    <Copy className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Enregistrer dans mon profil</h3>
                    <p className="text-sm text-muted-foreground">
                      Copiez votre capacité d'épargne de <strong className="text-foreground">{fmt(calculations.epargne)} €/mois</strong> dans votre profil financier pour enrichir vos autres simulations.
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveToProfile}
                    disabled={savingToProfile}
                    className="gap-2 flex-shrink-0"
                  >
                    {savingToProfile ? "Enregistrement…" : "Copier dans mon profil"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Expert Advice */}
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 flex-shrink-0 h-fit">
                    <Lightbulb className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Conseil d'Expert</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Le secret n'est pas de limiter vos envies, mais de <strong className="text-foreground">vous payer en premier</strong>.
                      Programmez un virement automatique de <strong className="text-primary">{fmt(calculations.epargne)} €</strong> dès
                      le lendemain de votre paie. Ce montant sera ainsi « invisible » et votre budget quotidien s'adaptera naturellement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between pb-20">
              <Button variant="outline" onClick={() => { setShowResults(false); setStep(0); }} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Nouvelle simulation
              </Button>
              <Button onClick={() => navigate("/employee/simulateurs")} className="gap-2">
                Retour aux simulateurs <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <SimulatorDisclaimer />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SimulateurCapaciteEpargne;
