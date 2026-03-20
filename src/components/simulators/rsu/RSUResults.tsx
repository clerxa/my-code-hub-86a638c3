/**
 * Écran 4 — Résultats de la simulation RSU (UX premium)
 * Waterfall visuel gain brut → déductions → gain net
 */

import { motion } from 'framer-motion';
import { TrendingUp, Landmark, Wallet, AlertTriangle, ExternalLink, RotateCcw, Save, ArrowDown, Minus, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';
import type { RSUSimulationResult, RSUPlanResult } from '@/types/rsu';
import { REGIME_COLORS } from '@/types/rsu';
import { setBookingReferrer } from '@/hooks/useBookingReferrer';

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const pct = (v: number) => `${v.toFixed(1)}%`;

const DONUT_COLORS = [
  'hsl(var(--primary))',
  'hsl(45, 93%, 47%)',
  'hsl(330, 81%, 60%)',
  'hsl(142, 71%, 45%)',
];

interface RSUResultsProps {
  result: RSUSimulationResult;
  onReset: () => void;
  onSave?: () => void;
}

function WaterfallRow({
  label,
  value,
  isPositive,
  isTotal,
  delay,
  description,
}: {
  label: string;
  value: number;
  isPositive?: boolean;
  isTotal?: boolean;
  delay: number;
  description?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-center justify-between py-3 px-4 rounded-lg ${
        isTotal
          ? 'bg-primary/5 border border-primary/20'
          : 'hover:bg-muted/50 transition-colors'
      }`}
    >
      <div className="flex items-center gap-3">
        {!isTotal && (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
            isPositive ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Minus className="h-3 w-3 text-red-500 dark:text-red-400" />
            )}
          </div>
        )}
        <div>
          <p className={`text-sm ${isTotal ? 'font-bold text-foreground' : 'font-medium text-foreground/90'}`}>
            {label}
          </p>
          {description && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <p className={`tabular-nums font-bold ${
        isTotal
          ? 'text-lg text-primary'
          : isPositive
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400'
      }`}>
        {isPositive || isTotal ? '' : '−'}{fmt(Math.abs(value))}
      </p>
    </motion.div>
  );
}

function PlanDetailCard({ plan, index }: { plan: RSUPlanResult; index: number }) {
  const [open, setOpen] = useState(false);
  const totalImpots = plan.ir_gain_acquisition + plan.ir_pv_cession + plan.ps_gain_acquisition + plan.ps_pv_cession + plan.contribution_salariale + plan.csg_crds;
  const tauxEffectif = (plan.gain_acquisition_eur + plan.pv_cession_eur) > 0
    ? (totalImpots / (plan.gain_acquisition_eur + plan.pv_cession_eur)) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: 0.6 + index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="overflow-hidden">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full text-left">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={REGIME_COLORS[plan.regime]} variant="secondary">{plan.regime}</Badge>
                    <div>
                      <p className="font-semibold text-sm">{plan.plan_nom}</p>
                      <p className="text-xs text-muted-foreground">{plan.nb_actions_total} actions · {plan.devise}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Gain net</p>
                      <p className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(plan.gain_net)}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Taux effectif</p>
                      <p className="font-semibold tabular-nums text-sm">{pct(tauxEffectif)}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </CardContent>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-1 border-t pt-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gain d'acquisition</span>
                  <span className="font-medium tabular-nums">{fmt(plan.gain_acquisition_eur)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plus-value de cession</span>
                  <span className="font-medium tabular-nums">{fmt(plan.pv_cession_eur)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IR gain d'acquisition</span>
                  <span className="font-medium tabular-nums text-red-600 dark:text-red-400">−{fmt(plan.ir_gain_acquisition)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IR plus-value cession</span>
                  <span className="font-medium tabular-nums text-red-600 dark:text-red-400">−{fmt(plan.ir_pv_cession)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PS gain d'acquisition</span>
                  <span className="font-medium tabular-nums text-red-600 dark:text-red-400">−{fmt(plan.ps_gain_acquisition)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PS plus-value cession</span>
                  <span className="font-medium tabular-nums text-red-600 dark:text-red-400">−{fmt(plan.ps_pv_cession)}</span>
                </div>
                {plan.contribution_salariale > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contribution salariale</span>
                    <span className="font-medium tabular-nums text-red-600 dark:text-red-400">−{fmt(plan.contribution_salariale)}</span>
                  </div>
                )}
                {plan.csg_crds > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CSG/CRDS</span>
                    <span className="font-medium tabular-nums text-red-600 dark:text-red-400">−{fmt(plan.csg_crds)}</span>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
}

export function RSUResults({ result, onReset, onSave }: RSUResultsProps) {
  const donutData = [
    { name: 'Gain net', value: result.gain_net_total },
    { name: 'Impôt sur le revenu', value: result.total_ir },
    { name: 'Prélèvements sociaux', value: result.total_ps + result.total_csg_crds },
    { name: 'Contribution salariale', value: result.total_contribution_salariale },
  ].filter(d => d.value > 0);

  const expertUrl = 'https://www.perlib.fr/prendre-rdv?utm_source=fincare_app&utm_campaign=simulateur_rsu';
  const netRatio = result.gain_brut_total > 0 ? (result.gain_net_total / result.gain_brut_total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Hero KPI — Gain net */}
      <motion.div
        initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="overflow-hidden border-primary/20">
          <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
            <CardContent className="py-8 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Gain net estimé après cession</p>
              <p className="text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums text-foreground"
                 style={{ lineHeight: '1.1' }}>
                {fmt(result.gain_net_total)}
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <Badge variant="outline" className="text-xs tabular-nums">
                  {pct(netRatio)} perçu
                </Badge>
                <Badge variant="outline" className="text-xs tabular-nums">
                  {pct(result.taux_effectif)} taux effectif
                </Badge>
              </div>
              <div className="max-w-xs mx-auto mt-4">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Impôts & charges</span>
                  <span>Gain net</span>
                </div>
                <Progress value={netRatio} className="h-2" />
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Waterfall breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-primary" />
              Décomposition du calcul
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <WaterfallRow
              label="Gain d'acquisition total"
              description="Somme des gains au moment du vesting de chaque plan"
              value={result.plans.reduce((s, p) => s + p.gain_acquisition_eur, 0)}
              isPositive
              delay={0.3}
            />
            <WaterfallRow
              label="Plus-value de cession"
              description="Différence entre le prix de vente et la valeur au vesting"
              value={result.plans.reduce((s, p) => s + p.pv_cession_eur, 0)}
              isPositive
              delay={0.35}
            />
            <div className="border-t my-2" />
            <WaterfallRow
              label="Gain brut total"
              value={result.gain_brut_total}
              isPositive
              delay={0.4}
            />
            <div className="border-t my-2" />
            <WaterfallRow
              label="Impôt sur le revenu"
              description="Barème progressif appliqué au gain d'acquisition et flat tax sur la PV"
              value={result.total_ir}
              delay={0.45}
            />
            <WaterfallRow
              label="Prélèvements sociaux"
              description="CSG, CRDS et prélèvements sociaux (17,2%)"
              value={result.total_ps + result.total_csg_crds}
              delay={0.5}
            />
            {result.total_contribution_salariale > 0 && (
              <WaterfallRow
                label="Contribution salariale"
                description="10% applicable aux plans qualifiés R1 (post 30/12/2016)"
                value={result.total_contribution_salariale}
                delay={0.55}
              />
            )}
            <div className="border-t my-2" />
            <WaterfallRow
              label="Gain net estimé"
              value={result.gain_net_total}
              isTotal
              delay={0.6}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Donut chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Répartition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-44 h-44 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {donutData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip
                      formatter={(value: number) => fmt(value)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 flex-1">
                {donutData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Plan-by-plan detail (collapsible) */}
      {result.plans.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Détail par plan
          </h3>
          {result.plans.map((plan, i) => (
            <PlanDetailCard key={plan.plan_id} plan={plan} index={i} />
          ))}
        </div>
      )}

      {/* Avertissement seuil 300k */}
      {result.seuil_300k_applique && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                Le seuil de 300 000 € s'applique à votre situation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
              <p>
                Votre gain d'acquisition dépasse 300 000 €. La <strong>Tranche A</strong> (jusqu'à 300 000 €) bénéficie du régime avantageux avec abattement de 50%. La <strong>Tranche B</strong> (au-delà) est imposée comme un salaire, sans abattement.
              </p>
              <p className="font-medium">
                Consultez un expert Perlib pour optimiser le timing de vos cessions.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Disclaimer */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="py-4">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Estimation indicative et pédagogique. Ne constitue pas un conseil fiscal. Les résultats sont basés sur les règles fiscales générales applicables aux résidents fiscaux français et peuvent varier selon votre situation personnelle. Perlib recommande de consulter un expert avant toute décision. Sources : articles L225-197-1 du Code de commerce, 200 A et 150-0 A du CGI.
          </p>
        </CardContent>
      </Card>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="flex flex-col sm:flex-row gap-3 pt-2"
      >
        <Button asChild className="flex-1 gap-2" size="lg">
          <a href={expertUrl} target="_blank" rel="noopener noreferrer" onClick={() => setBookingReferrer('/mes-plans-rsu')}>
            <ExternalLink className="h-4 w-4" />
            Optimiser avec un expert Perlib
          </a>
        </Button>
        {onSave && (
          <Button variant="secondary" onClick={onSave} className="flex-1 gap-2" size="lg">
            <Save className="h-4 w-4" />
            Sauvegarder
          </Button>
        )}
        <Button variant="outline" onClick={onReset} className="flex-1 gap-2" size="lg">
          <RotateCcw className="h-4 w-4" />
          Nouvelle simulation
        </Button>
      </motion.div>
    </motion.div>
  );
}
