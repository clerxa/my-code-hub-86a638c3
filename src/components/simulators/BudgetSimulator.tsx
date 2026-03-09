import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CATEGORIES = {
  incompressibles: {
    label: "Dépenses incompressibles",
    targetPct: 50,
    colorClass: "bg-primary",
    textClass: "text-primary",
    items: [
      { key: "logement", label: "🏠 Logement", defaultVal: 800 },
      { key: "impots", label: "📋 Impôts & prélèvements", defaultVal: 200 },
      { key: "credit", label: "💳 Remboursement crédit", defaultVal: 150 },
      { key: "transport", label: "🚌 Transport fixe", defaultVal: 150 },
      { key: "assurances", label: "🛡️ Assurances", defaultVal: 100 },
      { key: "abonnements", label: "📱 Abonnements", defaultVal: 100 },
    ],
  },
  compressibles: {
    label: "Dépenses compressibles",
    targetPct: 30,
    colorClass: "bg-secondary",
    textClass: "text-secondary",
    items: [
      { key: "alimentation", label: "🛒 Alimentation", defaultVal: 400 },
      { key: "loisirs", label: "🎭 Loisirs & sorties", defaultVal: 200 },
      { key: "shopping", label: "👜 Shopping", defaultVal: 150 },
      { key: "divers", label: "📦 Divers", defaultVal: 100 },
      { key: "sante", label: "💊 Santé", defaultVal: 50 },
    ],
  },
  epargne: {
    label: "Capacité d'épargne",
    targetPct: 20,
    colorClass: "bg-accent",
    textClass: "text-accent",
    items: [
      { key: "ep_precaution", label: "🏦 Épargne de précaution", defaultVal: 200 },
      { key: "ep_projets", label: "🎯 Épargne projets", defaultVal: 200 },
      { key: "investissement", label: "📈 Investissement long terme", defaultVal: 200 },
    ],
  },
} as const;

type CatKey = keyof typeof CATEGORIES;

const fmt = (n: number) => n.toLocaleString("fr-FR") + " €";

export function BudgetSimulator() {
  const [salaire, setSalaire] = useState(2600);
  const [autres, setAutres] = useState(400);
  const [values, setValues] = useState<Record<string, number>>(() => {
    const v: Record<string, number> = {};
    Object.values(CATEGORIES).forEach((cat) =>
      cat.items.forEach((i) => {
        v[i.key] = i.defaultVal;
      })
    );
    return v;
  });
  const [activeTab, setActiveTab] = useState<CatKey>("incompressibles");

  const revenus = salaire + autres;
  const totalIncomp = CATEGORIES.incompressibles.items.reduce((s, i) => s + (values[i.key] ?? 0), 0);
  const totalComp = CATEGORIES.compressibles.items.reduce((s, i) => s + (values[i.key] ?? 0), 0);
  const totalEp = CATEGORIES.epargne.items.reduce((s, i) => s + (values[i.key] ?? 0), 0);
  const solde = revenus - totalIncomp - totalComp - totalEp;
  const pctIncomp = revenus > 0 ? (totalIncomp / revenus) * 100 : 0;
  const pctComp = revenus > 0 ? (totalComp / revenus) * 100 : 0;
  const pctEp = revenus > 0 ? (totalEp / revenus) * 100 : 0;

  const totals: Record<CatKey, number> = { incompressibles: totalIncomp, compressibles: totalComp, epargne: totalEp };
  const pcts: Record<CatKey, number> = { incompressibles: pctIncomp, compressibles: pctComp, epargne: pctEp };

  const updateValue = (key: string, val: number) => {
    setValues((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const renderAdvice = (catKey: CatKey, pct: number) => {
    const cat = CATEGORIES[catKey];
    const target = cat.targetPct;
    let icon: string;
    let msg: string;
    let colorCls: string;

    if (catKey === "epargne") {
      if (pct >= 20) {
        icon = "🌟"; msg = "Excellent ! Vous atteignez l'objectif des 20%."; colorCls = "text-accent";
      } else if (pct >= 10) {
        icon = "✅"; msg = "Bon début, mais visez 20% pour sécuriser vos projets."; colorCls = "text-green-400";
      } else {
        icon = "⚠️"; msg = "Votre épargne est insuffisante. Réduisez vos dépenses compressibles."; colorCls = "text-destructive";
      }
    } else {
      if (pct <= target) {
        icon = "✅"; msg = `Vous êtes dans la cible (≤${target}%).`; colorCls = "text-green-400";
      } else {
        icon = "⚠️"; msg = `Vous dépassez la cible de ${target}%. Cherchez des postes à réduire.`; colorCls = "text-destructive";
      }
    }
    return (
      <div className="rounded-lg bg-muted/30 px-3 py-2 text-xs">
        <span className={colorCls}>{icon} {msg}</span>
        <span className="text-muted-foreground"> · Cible : {target}% ({fmt(Math.round(revenus * target / 100))})</span>
      </div>
    );
  };

  const scoreItems = useMemo(() => {
    return (Object.keys(CATEGORIES) as CatKey[]).map((k) => ({
      key: k,
      label: CATEGORIES[k].label,
      pct: pcts[k],
      target: CATEGORIES[k].targetPct,
      textClass: CATEGORIES[k].textClass,
      ok:
        k === "epargne" ? pcts[k] >= CATEGORIES[k].targetPct : pcts[k] <= CATEGORIES[k].targetPct,
    }));
  }, [pcts]);

  return (
    <div className="space-y-6">
      {/* Bloc Revenus */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="bg-card/60 border-border/40 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenus mensuels</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-foreground">Salaire net</label>
                  <span className="font-mono text-primary font-bold">{fmt(salaire)}</span>
                </div>
                <input type="range" min={0} max={10000000} step={50} value={salaire} onChange={(e) => setSalaire(Number(e.target.value))} className="w-full accent-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-foreground">Autres revenus</label>
                  <span className="font-mono text-primary font-bold">{fmt(autres)}</span>
                </div>
                <input type="range" min={0} max={100000} step={50} value={autres} onChange={(e) => setAutres(Number(e.target.value))} className="w-full accent-primary" />
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-border/40 pt-4">
              <span className="text-sm text-muted-foreground">Total revenus</span>
              <span className="text-2xl font-bold text-foreground font-mono">{fmt(revenus)}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Onglets catégories */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CatKey)}>
          <TabsList className="w-full">
            <TabsTrigger value="incompressibles" className="flex-1 text-xs sm:text-sm">Incompressibles</TabsTrigger>
            <TabsTrigger value="compressibles" className="flex-1 text-xs sm:text-sm">Compressibles</TabsTrigger>
            <TabsTrigger value="epargne" className="flex-1 text-xs sm:text-sm">Épargne</TabsTrigger>
          </TabsList>

          {(Object.keys(CATEGORIES) as CatKey[]).map((catKey) => {
            const cat = CATEGORIES[catKey];
            const total = totals[catKey];
            const pct = pcts[catKey];

            return (
              <TabsContent key={catKey} value={catKey}>
                <Card className="bg-card/60 border-border/40 backdrop-blur-sm">
                  <CardContent className="pt-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{cat.label}</p>
                        <p className={`font-mono text-xl font-bold ${cat.textClass}`}>{fmt(total)}</p>
                      </div>
                      <Badge variant="outline" className={cat.textClass}>{Math.round(pct)}%</Badge>
                    </div>

                    {renderAdvice(catKey, pct)}

                    {/* Items */}
                    <div className="space-y-3">
                      {cat.items.map((item) => (
                        <div key={item.key} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-sm text-foreground flex-1">{item.label}</label>
                            <input
                              type="number"
                              min={0}
                              step={10}
                              value={values[item.key] ?? 0}
                              onChange={(e) => updateValue(item.key, Number(e.target.value))}
                              className={`w-[72px] bg-muted/30 border border-border/40 rounded px-2 py-1 text-right font-mono text-sm ${cat.textClass} focus:outline-none focus:ring-1 focus:ring-primary/50`}
                            />
                          </div>
                          <input
                            type="range"
                            min={0}
                            ma20000* 3}
                            step={10}
                            value={values[item.key] ?? 0}
                            onChange={(e) => updateValue(item.key, Number(e.target.value))}
                            className="w-full accent-primary h-1"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </motion.div>

      {/* Bilan mensuel */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <Card className={`bg-card/60 backdrop-blur-sm ${solde >= 0 ? "border-green-500/30" : "border-destructive/30"}`}>
          <CardContent className="pt-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bilan mensuel</p>

            {/* Progress bars */}
            <div className="space-y-3">
              {([
                { label: "Incompressibles", pct: pctIncomp, total: totalIncomp, colorClass: "bg-primary" },
                { label: "Compressibles", pct: pctComp, total: totalComp, colorClass: "bg-secondary" },
                { label: "Épargne", pct: pctEp, total: totalEp, colorClass: "bg-accent" },
              ] as const).map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{row.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{Math.round(row.pct)}%</Badge>
                      <span className="font-mono text-muted-foreground">{fmt(row.total)}</span>
                    </div>
                  </div>
                  <Progress value={Math.min(row.pct, 100)} className={`h-2 [&>div]:${row.colorClass}`} />
                </div>
              ))}
            </div>

            {/* Solde */}
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground mb-1">Solde disponible</p>
              <p className={`text-3xl font-bold font-mono ${solde >= 0 ? "text-green-400" : "text-destructive"}`}>
                {solde > 0 ? "+" : ""}{fmt(solde)}
              </p>
            </div>

            {/* Messages conditionnels */}
            {solde < 0 && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                Votre budget est en déficit de {fmt(Math.abs(solde))}. Réduisez vos dépenses compressibles.
              </div>
            )}
            {solde >= 0 && solde <= revenus * 0.05 && (
              <div className="rounded-lg bg-accent/10 border border-accent/20 p-3 text-sm text-accent">
                Votre marge est faible. Renforcez votre épargne de précaution.
              </div>
            )}
            {solde > revenus * 0.1 && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400">
                Excellent ! Orientez cet excédent vers l'investissement long terme.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Score 50/30/20 */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
        <Card className="bg-card/60 border-border/40 backdrop-blur-sm">
          <CardContent className="pt-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Règle 50/30/20 — votre score
            </p>
            <div className="space-y-4">
              {scoreItems.map((s) => (
                <div key={s.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">
                      {s.ok ? "✅" : "⚠️"} {s.label}
                    </span>
                    <span className={`font-mono ${s.textClass}`}>
                      {Math.round(s.pct)}% / cible {s.target}%
                    </span>
                  </div>
                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full ${CATEGORIES[s.key].colorClass}`}
                      style={{ width: `${Math.min((s.pct / (s.target * 1.5)) * 100, 100)}%` }}
                    />
                    <div
                      className="absolute inset-y-0 w-0.5 bg-foreground/60"
                      style={{ left: `${(s.target / (s.target * 1.5)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA Perlib */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
        <Card className="bg-gradient-to-r from-primary/20 via-secondary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6 space-y-4 text-center">
            <p className="text-lg font-semibold text-foreground">
              Optimisez votre budget avec un conseiller Perlib
            </p>
            <p className="text-sm text-muted-foreground">
              Nos experts analysent votre situation et vous proposent des stratégies patrimoniales personnalisées.
            </p>
            <Button
              variant="default"
              onClick={() => window.open("https://calendly.com/perlib", "_blank")}
            >
              Prendre rendez-vous →
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
