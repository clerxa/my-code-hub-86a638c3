import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Wallet, ShoppingCart, PiggyBank, ArrowRight, ArrowLeft,
  CheckCircle2, AlertTriangle, TrendingUp, RotateCcw, Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    description: "Ce sont les dépenses que vous ne pouvez pas supprimer : logement, transport, assurances… L'objectif est de les maintenir sous 50 % de vos revenus.",
    targetPct: 50,
  },
  {
    key: "compressibles" as const,
    label: "Vos envies",
    icon: ShoppingCart,
    description: "Les dépenses sur lesquelles vous avez un levier : alimentation, loisirs, shopping… Visez 30 % maximum de vos revenus.",
    targetPct: 30,
  },
  {
    key: "epargne" as const,
    label: "Votre épargne",
    icon: PiggyBank,
    description: "L'épargne n'est pas ce qui reste — c'est ce que vous décidez de mettre de côté. Visez au moins 20 % de vos revenus.",
    targetPct: 20,
  },
];

const EXPENSE_ITEMS = {
  incompressibles: [
    { key: "logement", label: "Logement", emoji: "🏠", defaultVal: 800, tooltip: "Loyer ou mensualité de crédit immobilier" },
    { key: "impots", label: "Impôts & prélèvements", emoji: "📋", defaultVal: 200, tooltip: "Impôts non prélevés à la source, taxe foncière mensuelle…" },
    { key: "credit", label: "Remboursement crédit", emoji: "💳", defaultVal: 150, tooltip: "Crédits conso, auto, étudiant…" },
    { key: "transport", label: "Transport fixe", emoji: "🚌", defaultVal: 150, tooltip: "Abonnement transport, essence, leasing…" },
    { key: "assurances", label: "Assurances", emoji: "🛡️", defaultVal: 100, tooltip: "Habitation, auto, santé complémentaire…" },
    { key: "abonnements", label: "Abonnements", emoji: "📱", defaultVal: 100, tooltip: "Téléphone, internet, streaming…" },
  ],
  compressibles: [
    { key: "alimentation", label: "Alimentation", emoji: "🛒", defaultVal: 400, tooltip: "Courses, cantine, livraisons…" },
    { key: "loisirs", label: "Loisirs & sorties", emoji: "🎭", defaultVal: 200, tooltip: "Restaurants, cinéma, sport, voyages…" },
    { key: "shopping", label: "Shopping", emoji: "👜", defaultVal: 150, tooltip: "Vêtements, équipement, déco…" },
    { key: "divers", label: "Divers", emoji: "📦", defaultVal: 100, tooltip: "Cadeaux, imprévus…" },
    { key: "sante", label: "Santé", emoji: "💊", defaultVal: 50, tooltip: "Pharmacie, consultations non remboursées…" },
  ],
  epargne: [
    { key: "ep_precaution", label: "Épargne de précaution", emoji: "🏦", defaultVal: 200, tooltip: "Livret A, LDDS — votre matelas de sécurité" },
    { key: "ep_projets", label: "Épargne projets", emoji: "🎯", defaultVal: 200, tooltip: "Vacances, apport immobilier, achat important…" },
    { key: "investissement", label: "Investissement long terme", emoji: "📈", defaultVal: 200, tooltip: "PEA, assurance-vie, SCPI…" },
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
}: {
  emoji: string;
  label: string;
  tooltip: string;
  value: number;
  max: number;
  step: number;
  colorClass: string;
  onChange: (v: number) => void;
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
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value))))}
            className={`w-24 text-right font-mono text-sm h-8 ${colorClass}`}
          />
          <span className="text-xs text-muted-foreground">€</span>
        </div>
      </div>
      <Slider
        min={0}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function BudgetSimulator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [salaire, setSalaire] = useState(2600);
  const [autres, setAutres] = useState(400);
  const [values, setValues] = useState<Record<string, number>>(() => {
    const v: Record<string, number> = {};
    Object.values(EXPENSE_ITEMS).forEach((items) =>
      items.forEach((i) => { v[i.key] = i.defaultVal; })
    );
    return v;
  });

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
  const isResults = currentStep === STEPS_CONFIG.length;

  const canGoNext = currentStep < STEPS_CONFIG.length;
  const canGoPrev = currentStep > 0;

  /* ---------------------------------------------------------------- */
  /*  Step renderers                                                   */
  /* ---------------------------------------------------------------- */

  const renderRevenus = () => (
    <div className="space-y-6">
      <BudgetSliderItem
        emoji="💰"
        label="Salaire net mensuel"
        tooltip="Votre salaire net après prélèvement à la source"
        value={salaire}
        max={100000}
        step={50}
        colorClass="text-primary"
        onChange={setSalaire}
      />
      <BudgetSliderItem
        emoji="💎"
        label="Autres revenus"
        tooltip="Revenus locatifs, placements, pensions, freelance…"
        value={autres}
        max={500000}
        step={50}
        colorClass="text-primary"
        onChange={setAutres}
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
            <span>{fmt(total)} alloués</span>
            <span>Cible : {fmt(Math.round(revenus * target / 100))}</span>
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
              max={20000}
              step={10}
              colorClass={colorClass}
              onChange={(v) => updateValue(item.key, v)}
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
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Solde disponible</p>
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

        {/* Reset */}
        <div className="flex justify-center">
          <Button variant="outline" className="gap-2" onClick={() => setCurrentStep(0)}>
            <RotateCcw className="h-4 w-4" /> Recommencer la simulation
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
      {/* Step indicator */}
      {!isResults && (
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
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
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

      {/* Navigation */}
      {!isResults && (
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
            onClick={() => setCurrentStep((p) => p + 1)}
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
