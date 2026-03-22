import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Wallet, ShoppingCart, PiggyBank, ArrowRight, ArrowLeft,
  CheckCircle2, AlertTriangle, TrendingUp, RotateCcw, Info, UserCircle,
  Calendar,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFinancialProfilePrefill } from "@/hooks/useFinancialProfilePrefill";
import { SimulationValidationOverlay } from "@/components/simulators/SimulationValidationOverlay";
import { useAuth } from "@/components/AuthProvider";
import { useExpertBookingUrl } from "@/hooks/useExpertBookingUrl";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useUserRealEstateProperties } from "@/hooks/useUserRealEstateProperties";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const STEPS_CONFIG = [
  {
    key: "revenus" as const,
    label: "Vos revenus",
    icon: Wallet,
    description: "Renseignez vos revenus mensuels nets après prélèvement à la source.",
    targetPct: null,
  },
  {
    key: "incompressibles" as const,
    label: "Vos besoins",
    icon: ShoppingCart,
    description: "Ce sont les dépenses mensuelles que vous ne pouvez pas supprimer : logement, transport, assurances… L'objectif est de les maintenir sous 50 % de vos revenus.",
    targetPct: 50,
  },
  {
    key: "compressibles" as const,
    label: "Vos envies",
    icon: ShoppingCart,
    description: "Les dépenses mensuelles sur lesquelles vous avez un levier : alimentation, loisirs, shopping… Visez 30 % maximum de vos revenus.",
    targetPct: 30,
  },
  {
    key: "epargne" as const,
    label: "Votre épargne",
    icon: PiggyBank,
    description: "L'épargne mensuelle n'est pas ce qui reste — c'est ce que vous décidez de mettre de côté. Visez au moins 20 % de vos revenus.",
    targetPct: 20,
  },
];

const EXPENSE_ITEMS = {
  incompressibles: [
    { key: "logement", label: "Loyer / crédit résidence", emoji: "🏠", defaultVal: 800, max: 10000, tooltip: "Loyer ou mensualité de crédit de votre résidence principale" },
    { key: "copropriete_taxes", label: "Copropriété & taxes", emoji: "🏢", defaultVal: 0, max: 5000, tooltip: "Charges de copropriété, taxe foncière… (mensuel)" },
    { key: "energie", label: "Énergie", emoji: "⚡", defaultVal: 0, max: 2000, tooltip: "Électricité, gaz, chauffage… (mensuel)" },
    { key: "impots", label: "Impôts & prélèvements", emoji: "📋", defaultVal: 200, max: 5000, tooltip: "Impôts non prélevés à la source… (mensuel)" },
    { key: "credit", label: "Crédits conso & auto", emoji: "💳", defaultVal: 150, max: 5000, tooltip: "Crédits consommation, auto, étudiant… (mensuel)" },
    { key: "credit_immo_locatif", label: "Crédits immobilier locatif", emoji: "🏘️", defaultVal: 0, max: 10000, tooltip: "Mensualités de crédit de vos biens locatifs (mensuel)" },
    { key: "transport", label: "Transport", emoji: "🚌", defaultVal: 150, max: 3000, tooltip: "Transport en commun, essence, leasing auto… (mensuel)" },
    { key: "assurances", label: "Assurances", emoji: "🛡️", defaultVal: 100, max: 3000, tooltip: "Habitation, auto, santé complémentaire… (mensuel)" },
    { key: "abonnements", label: "Abonnements & télécom", emoji: "📱", defaultVal: 100, max: 2000, tooltip: "Téléphone, internet, streaming… (mensuel)" },
    { key: "pension_alimentaire", label: "Pension alimentaire", emoji: "👨‍👧", defaultVal: 0, max: 5000, tooltip: "Pension alimentaire versée (mensuel)" },
    { key: "frais_scolarite", label: "Frais de scolarité", emoji: "🎓", defaultVal: 0, max: 5000, tooltip: "Scolarité, crèche, garde d'enfants… (mensuel)" },
  ],
  compressibles: [
    { key: "alimentation", label: "Alimentation", emoji: "🛒", defaultVal: 400, max: 5000, tooltip: "Courses, cantine, livraisons… (mensuel)" },
    { key: "loisirs", label: "Loisirs & sorties", emoji: "🎭", defaultVal: 200, max: 5000, tooltip: "Restaurants, cinéma, sport, voyages… (mensuel)" },
    { key: "shopping", label: "Shopping", emoji: "👜", defaultVal: 150, max: 5000, tooltip: "Vêtements, équipement, déco… (mensuel)" },
    { key: "divers", label: "Divers", emoji: "📦", defaultVal: 100, max: 3000, tooltip: "Cadeaux, imprévus… (mensuel)" },
    { key: "sante", label: "Santé", emoji: "💊", defaultVal: 50, max: 3000, tooltip: "Pharmacie, consultations non remboursées… (mensuel)" },
  ],
  epargne: [
    { key: "epargne_totale", label: "Épargne mensuelle totale", emoji: "🏦", defaultVal: 600, max: 30000, tooltip: "Tout ce que vous mettez de côté chaque mois : livrets, projets, investissements…" },
  ],
};

type StepKey = "revenus" | "incompressibles" | "compressibles" | "epargne";

const fmt = (n: number) => n.toLocaleString("fr-FR") + " €";

/* ------------------------------------------------------------------ */
/*  Slider item                                                        */
/* ------------------------------------------------------------------ */

function BudgetSliderItem({
  emoji,
  label,
  tooltip,
  value,
  max,
  step,
  colorClass,
  onChange,
  fromProfile,
  profileSource,
}: {
  emoji: string;
  label: string;
  tooltip: string;
  value: number;
  max: number;
  step: number;
  colorClass: string;
  onChange: (v: number) => void;
  fromProfile?: boolean;
  profileSource?: string;
}) {
  return (
    <div className="space-y-2 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="text-sm text-foreground flex items-center gap-2 cursor-help">
                <span>{emoji}</span>
                <span>{label}</span>
                <Info className="h-3 w-3 text-muted-foreground/50" />
                {fromProfile && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 rounded-full px-1.5 py-0.5 font-medium">
                          <UserCircle className="h-3 w-3" /> Profil
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px] text-xs">
                        {profileSource || "Valeur importée depuis votre profil financier"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </label>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            step={step}
            value={value}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange(Math.max(0, v));
            }}
            className={`w-24 text-right font-mono text-sm h-8 ${colorClass}`}
          />
          <span className="text-xs text-muted-foreground">€/mois</span>
        </div>
      </div>
      <Slider
        min={0}
        max={max}
        step={step}
        value={[Math.min(value, max)]}
        onValueChange={([v]) => onChange(v)}
        className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

interface BudgetSimulatorProps {
  savedData?: Record<string, any>;
  savedSimId?: string;
  startInResults?: boolean;
  onEdit?: () => void;
}

export function BudgetSimulator({ savedData, savedSimId, startInResults, onEdit }: BudgetSimulatorProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(startInResults ? STEPS_CONFIG.length : 0);
  const [salaire, setSalaire] = useState(2600);
  const [autres, setAutres] = useState(400);
  const [values, setValues] = useState<Record<string, number>>(() => {
    const v: Record<string, number> = {};
    Object.values(EXPENSE_ITEMS).forEach((items) =>
      items.forEach((i) => { v[i.key] = i.defaultVal; })
    );
    return v;
  });

  // Track which fields came from the financial profile + source explanation
  const [profileFields, setProfileFields] = useState<Map<string, string>>(new Map());

  // Validation overlay state
  const [showValidation, setShowValidation] = useState(false);
  const [validationComplete, setValidationComplete] = useState(startInResults || false);

  // Expert booking
  const [companyId, setCompanyId] = useState<string | null>(null);
  const { bookingUrl } = useExpertBookingUrl(companyId);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("company_id").eq("id", user.id).maybeSingle()
        .then(({ data }) => { if (data?.company_id) setCompanyId(data.company_id); });
    }
  }, [user]);

  // Load saved simulation data
  const [savedLoaded, setSavedLoaded] = useState(false);
  useEffect(() => {
    if (savedData && !savedLoaded) {
      if (savedData.salaire != null) setSalaire(savedData.salaire);
      if (savedData.autres != null) setAutres(savedData.autres);
      if (savedData.values) {
        setValues(prev => ({ ...prev, ...savedData.values }));
      }
      setSavedLoaded(true);
    }
  }, [savedData, savedLoaded]);

  // Financial profile prefill
  const { getPrefillData, hasProfile, isLoading: isProfileLoading } = useFinancialProfilePrefill();
  const [profileApplied, setProfileApplied] = useState(false);

  useEffect(() => {
    if (!isProfileLoading && hasProfile && !profileApplied && !savedLoaded) {
      const data = getPrefillData();
      const filledMap = new Map<string, string>();

      // Revenus: priorité au revenu fiscal annuel → mensualiser, sinon revenu mensuel net
      if (data.revenuFiscalAnnuel > 0) {
        const mensuel = Math.round(data.revenuFiscalAnnuel / 12);
        setSalaire(mensuel);
        filledMap.set("salaire", `Revenu fiscal annuel (${data.revenuFiscalAnnuel.toLocaleString("fr-FR")} €) ÷ 12`);
      } else if (data.revenuMensuelNet > 0) {
        setSalaire(data.revenuMensuelNet);
        filledMap.set("salaire", "Salaire net mensuel du profil financier");
      }

      // Autres revenus = revenus locatifs (annuels → mensuels) + autres revenus mensuels
      const locatifsMensuel = Math.round((data.revenusLocatifs || 0) / 12);
      const autresRevenus = locatifsMensuel + (data.autresRevenus || 0);
      if (autresRevenus > 0) {
        setAutres(autresRevenus);
        const parts = [];
        if (locatifsMensuel > 0) parts.push(`Revenus locatifs (${(data.revenusLocatifs || 0).toLocaleString("fr-FR")} €/an ÷ 12)`);
        if (data.autresRevenus > 0) parts.push(`Autres revenus mensuels (${data.autresRevenus.toLocaleString("fr-FR")} €)`);
        filledMap.set("autres", parts.join(" + "));
      }

      // Map detailed charges from profile
      const chargesMap: Record<string, { value: number; source: string }> = {
        logement: {
          value: data.chargesDetailees.loyer || data.loyerActuel || 0,
          source: "Loyer / crédit résidence du profil financier",
        },
        copropriete_taxes: {
          value: data.chargesDetailees.copropriete_taxes || 0,
          source: "Copropriété & taxes du profil financier",
        },
        energie: {
          value: data.chargesDetailees.energie || 0,
          source: "Énergie du profil financier",
        },
        credit: {
          value: (data.chargesDetailees.credit_consommation || 0) + (data.chargesDetailees.lld_loa_auto || 0),
          source: "Crédits consommation + LOA/LLD auto du profil",
        },
        credit_immo_locatif: {
          value: data.chargesDetailees.credit_immobilier || 0,
          source: "Crédits immobilier du profil financier",
        },
        transport: {
          value: data.chargesDetailees.transport_commun || 0,
          source: "Transport en commun du profil",
        },
        assurances: {
          value: (data.chargesDetailees.assurance_habitation || 0) + (data.chargesDetailees.assurance_auto || 0),
          source: "Assurance habitation + auto du profil",
        },
        abonnements: {
          value: (data.chargesDetailees.abonnements || 0) + (data.chargesDetailees.internet || 0) + (data.chargesDetailees.mobile || 0),
          source: "Abonnements + internet + mobile du profil",
        },
        pension_alimentaire: {
          value: data.chargesDetailees.pension_alimentaire || 0,
          source: "Pension alimentaire du profil financier",
        },
        frais_scolarite: {
          value: data.chargesDetailees.frais_scolarite || 0,
          source: "Frais de scolarité du profil financier",
        },
      };

      setValues((prev) => {
        const updated = { ...prev };
        for (const [key, { value, source }] of Object.entries(chargesMap)) {
          if (value > 0) {
            updated[key] = value;
            filledMap.set(key, source);
          }
        }
        // Épargne — source: capacité d'épargne mensuelle du profil financier
        if (data.capaciteEpargneMensuelle > 0) {
          updated.epargne_totale = data.capaciteEpargneMensuelle;
          filledMap.set("epargne_totale", `Capacité d'épargne mensuelle (${data.capaciteEpargneMensuelle.toLocaleString("fr-FR")} €) importée de votre profil`);
        }
        return updated;
      });

      setProfileFields(filledMap);
      setProfileApplied(true);
    }
  }, [isProfileLoading, hasProfile, profileApplied, getPrefillData]);

  const revenus = salaire + autres;
  const totalByCategory = useMemo(() => ({
    incompressibles: EXPENSE_ITEMS.incompressibles.reduce((s, i) => s + (values[i.key] ?? 0), 0),
    compressibles: EXPENSE_ITEMS.compressibles.reduce((s, i) => s + (values[i.key] ?? 0), 0),
    epargne: EXPENSE_ITEMS.epargne.reduce((s, i) => s + (values[i.key] ?? 0), 0),
  }), [values]);

  const solde = revenus - totalByCategory.incompressibles - totalByCategory.compressibles - totalByCategory.epargne;
  const pctByCat = useMemo(() => ({
    incompressibles: revenus > 0 ? (totalByCategory.incompressibles / revenus) * 100 : 0,
    compressibles: revenus > 0 ? (totalByCategory.compressibles / revenus) * 100 : 0,
    epargne: revenus > 0 ? (totalByCategory.epargne / revenus) * 100 : 0,
  }), [revenus, totalByCategory]);

  const updateValue = useCallback((key: string, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const stepConfig = STEPS_CONFIG[currentStep];
  // Steps: 0-3 = input steps, 4 = validation overlay, 5 = results
  const isValidationStep = currentStep === STEPS_CONFIG.length && !validationComplete;
  const isResults = currentStep === STEPS_CONFIG.length && validationComplete;

  const canGoNext = currentStep < STEPS_CONFIG.length;
  const canGoPrev = currentStep > 0 && !isResults;

  // Handle transition to results: trigger validation overlay
  const handleGoToResults = () => {
    setCurrentStep(STEPS_CONFIG.length);
    setShowValidation(true);
  };

  const handleValidationComplete = async () => {
    setShowValidation(false);
    setValidationComplete(true);
    // Auto-save budget simulation
    await autoSaveBudget();
  };

  const autoSaveBudget = async () => {
    if (!user) return;
    const budgetData = {
      salaire,
      autres,
      values,
      revenus,
      totalByCategory,
      pctByCat,
      solde,
    };
    try {
      if (savedSimId) {
        // Update existing
        await supabase
          .from('simulations')
          .update({ data: budgetData as any, updated_at: new Date().toISOString() })
          .eq('id', savedSimId);
      } else {
        // Insert new
        await supabase.from('simulations').insert({
          user_id: user.id,
          type: 'budget',
          name: `ZENITH - ${new Date().toLocaleDateString('fr-FR')}`,
          data: budgetData as any,
        });
      }
      // Invalidate cache so BudgetPage picks up the saved sim
      queryClient.invalidateQueries({ queryKey: ['budget-saved-sim'] });
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
    } catch (e) {
      console.error('Auto-save budget failed:', e);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Profile prefill banner                                           */
  /* ---------------------------------------------------------------- */

  const renderProfileBanner = () => {
    if (profileFields.size === 0) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20"
      >
        <UserCircle className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs text-primary">
          Certaines données ont été pré-remplies depuis votre profil financier. Vous pouvez les ajuster librement.
        </p>
      </motion.div>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Step renderers                                                   */
  /* ---------------------------------------------------------------- */

  const renderRevenus = () => (
    <div className="space-y-6">
      {renderProfileBanner()}
      <BudgetSliderItem
        emoji="💰"
        label="Salaire net mensuel"
        tooltip="Votre salaire net après prélèvement à la source (mensuel)"
        value={salaire}
        max={100000}
        step={50}
        colorClass="text-primary"
        onChange={setSalaire}
        fromProfile={profileFields.has("salaire")}
        profileSource={profileFields.get("salaire")}
      />
      <BudgetSliderItem
        emoji="💎"
        label="Autres revenus mensuels"
        tooltip="Revenus locatifs, placements, pensions, freelance… (mensuel)"
        value={autres}
        max={100000}
        step={50}
        colorClass="text-primary"
        onChange={setAutres}
        fromProfile={profileFields.has("autres")}
        profileSource={profileFields.get("autres")}
      />
      <div className="flex justify-between items-center border-t border-border/40 pt-4 px-3">
        <span className="text-sm text-muted-foreground">Total revenus mensuels</span>
        <span className="text-2xl font-bold text-foreground font-mono">{fmt(revenus)}</span>
      </div>
    </div>
  );

  const renderCategory = (catKey: "incompressibles" | "compressibles" | "epargne") => {
    const items = EXPENSE_ITEMS[catKey];
    const total = totalByCategory[catKey];
    const pct = pctByCat[catKey];
    const target = STEPS_CONFIG.find((s) => s.key === catKey)!.targetPct!;
    const isOk = catKey === "epargne" ? pct >= target : pct <= target;
    const colorClass = catKey === "incompressibles" ? "text-primary" : catKey === "compressibles" ? "text-secondary" : "text-accent";

    return (
      <div className="space-y-4">
        {/* Source info for épargne */}
        {catKey === "epargne" && profileFields.has("epargne_totale") && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20"
          >
            <UserCircle className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-primary">
              Votre épargne est pré-remplie à partir de votre <strong>capacité d'épargne mensuelle</strong> déclarée dans votre profil financier.
            </p>
          </motion.div>
        )}

        {/* Live gauge */}
        <div className="rounded-lg bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOk ? (
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              <span className="text-sm text-foreground font-medium">
                {Math.round(pct)}% de vos revenus
              </span>
            </div>
            <Badge variant={isOk ? "default" : "destructive"} className="font-mono">
              Cible : {target}%
            </Badge>
          </div>
          <Progress value={Math.min(pct, 100)} className="h-2.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{fmt(total)} / mois</span>
            <span>Cible : {fmt(Math.round(revenus * target / 100))} / mois</span>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2">
          {items.map((item) => (
            <BudgetSliderItem
              key={item.key}
              emoji={item.emoji}
              label={item.label}
              tooltip={item.tooltip}
              value={values[item.key] ?? 0}
              max={item.max}
              step={10}
              colorClass={colorClass}
              onChange={(v) => updateValue(item.key, v)}
              fromProfile={profileFields.has(item.key)}
              profileSource={profileFields.get(item.key)}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const categories = [
      { label: "Besoins (incompressibles)", pct: pctByCat.incompressibles, total: totalByCategory.incompressibles, target: 50, color: "bg-primary", textColor: "text-primary" },
      { label: "Envies (compressibles)", pct: pctByCat.compressibles, total: totalByCategory.compressibles, target: 30, color: "bg-secondary", textColor: "text-secondary" },
      { label: "Épargne", pct: pctByCat.epargne, total: totalByCategory.epargne, target: 20, color: "bg-accent", textColor: "text-accent" },
    ];

    const score = categories.reduce((acc, cat) => {
      const isEpargne = cat.target === 20;
      const isOk = isEpargne ? cat.pct >= cat.target : cat.pct <= cat.target;
      return acc + (isOk ? 1 : 0);
    }, 0);

    return (
      <div className="space-y-6">
        {/* Score */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Votre score 50 / 30 / 20</p>
          <div className="flex items-center justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.15, type: "spring" }}
              >
                {i < score ? (
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-destructive/50" />
                )}
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {score === 3
              ? "Félicitations ! Votre budget respecte parfaitement la règle 50/30/20."
              : score === 2
              ? `Presque ! Vos besoins représentent ${Math.round(pctByCat.incompressibles)}%, vos envies ${Math.round(pctByCat.compressibles)}% et votre épargne ${Math.round(pctByCat.epargne)}%. Un dernier ajustement et vous y êtes.`
              : score === 1
              ? `Vos besoins pèsent ${Math.round(pctByCat.incompressibles)}% (cible 50%), vos envies ${Math.round(pctByCat.compressibles)}% (cible 30%) et votre épargne ${Math.round(pctByCat.epargne)}% (cible 20%). Deux catégories nécessitent un rééquilibrage.`
              : `Vos besoins représentent ${Math.round(pctByCat.incompressibles)}%, vos envies ${Math.round(pctByCat.compressibles)}% et votre épargne ${Math.round(pctByCat.epargne)}%. Votre budget s'éloigne significativement de la règle 50/30/20 — des ajustements sont nécessaires.`}
          </p>
        </div>

        {/* Category breakdown */}
        <div className="space-y-4">
          {categories.map((cat) => {
            const isEpargne = cat.target === 20;
            const isOk = isEpargne ? cat.pct >= cat.target : cat.pct <= cat.target;
            return (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-muted/20 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isOk ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
                    <span className="text-sm font-medium text-foreground">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-sm font-bold ${cat.textColor}`}>{Math.round(cat.pct)}%</span>
                    <Badge variant="outline" className="text-xs">cible {cat.target}%</Badge>
                  </div>
                </div>
                <Progress value={Math.min(cat.pct, 100)} className={`h-2 [&>div]:${cat.color}`} />
                <p className="text-xs text-muted-foreground">{fmt(cat.total)} / mois</p>
              </motion.div>
            );
          })}
        </div>

        {/* Solde */}
        <Card className={`${solde >= 0 ? "border-green-500/30" : "border-destructive/30"}`}>
          <CardContent className="pt-5 pb-5 text-center space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Solde disponible mensuel</p>
            <p className={`text-3xl font-bold font-mono ${solde >= 0 ? "text-green-400" : "text-destructive"}`}>
              {solde > 0 ? "+" : ""}{fmt(solde)}
            </p>
            {solde < 0 && (
              <p className="text-sm text-destructive">
                Votre budget est en déficit. Réduisez vos dépenses compressibles ou augmentez vos revenus.
              </p>
            )}
            {solde >= 0 && solde <= revenus * 0.05 && (
              <p className="text-sm text-accent">
                Votre marge est faible. Renforcez votre épargne de précaution.
              </p>
            )}
            {solde > revenus * 0.1 && (
              <p className="text-sm text-green-400">
                Excellent ! Orientez cet excédent vers l'investissement long terme.
              </p>
            )}
          </CardContent>
        </Card>

        {/* CTA Expert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="pt-5 pb-5 text-center space-y-3">
              <Calendar className="h-8 w-8 text-primary mx-auto" />
              <h3 className="text-base font-semibold text-foreground">Envie d'optimiser votre budget ?</h3>
              <p className="text-sm text-muted-foreground">
                Un expert FinCare peut vous accompagner pour rééquilibrer vos finances et construire une stratégie d'épargne adaptée à votre situation.
              </p>
              <Button
                className="gap-2"
                onClick={() => {
                  if (bookingUrl) {
                    window.open(bookingUrl, "_blank");
                  } else {
                    navigate("/employee/expert-booking");
                  }
                }}
              >
                <Calendar className="h-4 w-4" />
                Échanger avec un expert
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit / Reset */}
        <div className="flex justify-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => {
            setCurrentStep(0);
            setValidationComplete(false);
            onEdit?.();
          }}>
            <ArrowLeft className="h-4 w-4" /> Modifier mes données
          </Button>
          <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={() => {
            setCurrentStep(0);
            setValidationComplete(false);
            // Reset to defaults
            setSalaire(2600);
            setAutres(400);
            const v: Record<string, number> = {};
            Object.values(EXPENSE_ITEMS).forEach((items) =>
              items.forEach((i) => { v[i.key] = i.defaultVal; })
            );
            setValues(v);
            onEdit?.();
          }}>
            <RotateCcw className="h-4 w-4" /> Recommencer à zéro
          </Button>
        </div>
      </div>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Validation Overlay */}
      <SimulationValidationOverlay
        isValidating={showValidation}
        onComplete={handleValidationComplete}
        simulatorName="ZENITH by FinCare"
        simulatorId="zenith-budget"
      />

      {/* Step indicator */}
      {!isValidationStep && !isResults && (
        <div className="flex items-center justify-between px-2">
          {STEPS_CONFIG.map((s, i) => (
            <div key={s.key} className="flex items-center gap-0 flex-1 last:flex-none">
              <button
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-2 transition-all ${
                  i === currentStep
                    ? "text-primary"
                    : i < currentStep
                    ? "text-green-400"
                    : "text-muted-foreground/40"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i === currentStep
                      ? "border-primary bg-primary/10 text-primary"
                      : i < currentStep
                      ? "border-green-400 bg-green-400/10 text-green-400"
                      : "border-muted-foreground/20 text-muted-foreground/40"
                  }`}
                >
                  {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s.label}</span>
              </button>
              {i < STEPS_CONFIG.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${
                  i < currentStep ? "bg-green-400/50" : "bg-muted-foreground/10"
                }`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {!isValidationStep && (
        <AnimatePresence mode="wait">
          <motion.div
            key={isResults ? "results" : currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="bg-card/60 border-border/40 backdrop-blur-sm">
              <CardContent className="pt-6 space-y-5">
                {!isResults && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <stepConfig.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">{stepConfig.label}</h2>
                        <p className="text-xs text-muted-foreground">{stepConfig.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {isResults && (
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Votre bilan Zenith</h2>
                      <p className="text-xs text-muted-foreground">Résultat de votre simulation budget 50/30/20</p>
                    </div>
                  </div>
                )}

                {currentStep === 0 && renderRevenus()}
                {currentStep === 1 && renderCategory("incompressibles")}
                {currentStep === 2 && renderCategory("compressibles")}
                {currentStep === 3 && renderCategory("epargne")}
                {isResults && renderResults()}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Navigation */}
      {!isResults && !isValidationStep && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep((p) => p - 1)}
            disabled={!canGoPrev}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Précédent
          </Button>

          <Button
            onClick={() => {
              if (currentStep === STEPS_CONFIG.length - 1) {
                handleGoToResults();
              } else {
                setCurrentStep((p) => p + 1);
              }
            }}
            disabled={!canGoNext}
            className="gap-2"
          >
            {currentStep === STEPS_CONFIG.length - 1 ? (
              <>
                <TrendingUp className="h-4 w-4" /> Voir mon bilan
              </>
            ) : (
              <>
                Suivant <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
