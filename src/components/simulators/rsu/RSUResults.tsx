/**
 * Écran 4 — Résultats de la simulation RSU
 * Affichage conditionnel selon le régime fiscal :
 *   CAS 1 — Plan qualifié (AGA) : tout est payé à la cession
 *   CAS 2 — Plan non qualifié : charge sur bulletin + cash cession
 */

import { motion } from 'framer-motion';
import {
  TrendingUp, Landmark, Wallet, AlertTriangle, ExternalLink, RotateCcw,
  Save, ArrowDown, Minus, Info, ChevronDown, ChevronUp, Receipt,
  Calendar, DollarSign, FileWarning, BadgeCheck
} from 'lucide-react';
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

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

interface RSUResultsProps {
  result: RSUSimulationResult;
  onReset: () => void;
  onSave?: () => void;
}

// ────────────────────────────────────────────────────────
// Shared: Waterfall row
// ────────────────────────────────────────────────────────
function WaterfallRow({
  label, value, isPositive, isTotal, delay, description,
}: {
  label: string; value: number; isPositive?: boolean; isTotal?: boolean; delay: number; description?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-center justify-between py-3 px-4 rounded-lg ${
        isTotal ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50 transition-colors'
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
          <p className={`text-sm ${isTotal ? 'font-bold text-foreground' : 'font-medium text-foreground/90'}`}>{label}</p>
          {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <p className={`tabular-nums font-bold ${
        isTotal ? 'text-lg text-primary' : isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
      }`}>
        {isPositive || isTotal ? '' : '−'}{fmt(Math.abs(value))}
      </p>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────
// Shared: Plan detail card
// ────────────────────────────────────────────────────────
function PlanDetailCard({ plan, index }: { plan: RSUPlanResult; index: number }) {
  const [open, setOpen] = useState(false);
  const totalImpots = plan.ir_gain_acquisition + plan.ir_pv_cession + plan.ps_gain_acquisition + plan.ps_pv_cession + plan.contribution_salariale + plan.csg_crds;
  const tauxEffectif = (plan.gain_acquisition_eur + plan.pv_cession_eur) > 0
    ? (totalImpots / (plan.gain_acquisition_eur + plan.pv_cession_eur)) * 100 : 0;

  return (
    <motion.div {...anim(0.6 + index * 0.08)}>
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
                <div className="flex justify-between"><span className="text-muted-foreground">Gain d'acquisition</span><span className="font-medium tabular-nums">{fmt(plan.gain_acquisition_eur)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Plus-value de cession</span><span className="font-medium tabular-nums">{fmt(plan.pv_cession_eur)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IR gain d'acquisition</span><span className="font-medium tabular-nums text-red-600 dark:text-red-400">−{fmt(plan.ir_gain_acquisition)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IR plus-value cession</span><span className="font-medium tabular-nums text-red-600 dark:text-red-400">−{fmt(plan.ir_pv_cession)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">PS gain d'acquisition</span><span className="font-medium tabular-nums text-red-600 dark:text-red-400">−{fmt(plan.ps_gain_acquisition)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">PS plus-value cession</span><span className="font-medium tabular-nums text-red-600 dark:text-red-400">−{fmt(plan.ps_pv_cession)}</span></div>
                {plan.contribution_salariale > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Contribution salariale</span><span className="font-medium tabular-nums text-red-600 dark:text-red-400">−{fmt(plan.contribution_salariale)}</span></div>
                )}
                {plan.csg_crds > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">CSG/CRDS</span><span className="font-medium tabular-nums text-red-600 dark:text-red-400">−{fmt(plan.csg_crds)}</span></div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// CAS 1 — PLAN QUALIFIÉ (R1 / R2)
// Toute la fiscalité est payée à la cession
// ════════════════════════════════════════════════════════
function QualifiedResults({ result, onReset, onSave }: RSUResultsProps) {
  const totalGA = result.plans.reduce((s, p) => s + p.gain_acquisition_eur, 0);
  const totalPV = result.plans.reduce((s, p) => s + p.pv_cession_eur, 0);
  const totalIR_GA = result.plans.reduce((s, p) => s + p.ir_gain_acquisition, 0);
  const totalPS_GA = result.plans.reduce((s, p) => s + p.ps_gain_acquisition, 0);
  const totalIR_PV = result.plans.reduce((s, p) => s + p.ir_pv_cession, 0);
  const totalPS_PV = result.plans.reduce((s, p) => s + p.ps_pv_cession, 0);

  // Get abattement from plan data (use first plan's value for display — they should be the same for single-plan sim)
  const abattementPct = result.plans.length > 0 ? result.plans[0].abattement_duree_detention : 0;
  const hasAbattement = abattementPct > 0;

  const donutData = [
    { name: 'Cash net reçu', value: result.gain_net_total },
    { name: 'Impôt sur le revenu', value: result.total_ir },
    { name: 'Prélèvements sociaux', value: result.total_ps + result.total_csg_crds },
    { name: 'Contribution salariale', value: result.total_contribution_salariale },
  ].filter(d => d.value > 0);

  const netRatio = result.gain_brut_total > 0 ? (result.gain_net_total / result.gain_brut_total) * 100 : 0;

  return (
    <>
      {/* Hero — Cash net reçu après cession */}
      <motion.div {...anim(0.1)}>
        <Card className="overflow-hidden border-primary/20">
          <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
            <CardContent className="py-8 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium mb-4">
                <BadgeCheck className="h-3.5 w-3.5" />
                Plan qualifié — AGA loi Macron
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Cash net reçu après cession</p>
              <p className="text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums text-foreground" style={{ lineHeight: '1.1' }}>
                {fmt(result.gain_net_total)}
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <Badge variant="outline" className="text-xs tabular-nums">{pct(netRatio)} perçu</Badge>
                <Badge variant="outline" className="text-xs tabular-nums">{pct(result.taux_effectif)} taux effectif</Badge>
              </div>
              <div className="max-w-xs mx-auto mt-4">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Impôts & charges</span>
                  <span>Cash net</span>
                </div>
                <Progress value={netRatio} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
                Pour un plan qualifié, aucune fiscalité n'est due au vesting. Tout est réglé au moment de la vente, quand le cash est disponible.
              </p>
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Waterfall — Décomposition linéaire avec split GA / PV */}
      <motion.div {...anim(0.25)}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-primary" />
              Décomposition du calcul
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {/* --- Gains bruts --- */}
            <WaterfallRow label="Gain d'acquisition total" description="Valeur des actions au moment du vesting" value={totalGA} isPositive delay={0.3} />
            <WaterfallRow label="Plus-value de cession" description="Différence entre prix de vente et valeur au vesting" value={totalPV} isPositive delay={0.35} />
            <div className="border-t my-2" />
            <WaterfallRow label="Gain brut total" value={result.gain_brut_total} isPositive delay={0.4} />

            {/* --- Fiscalité sur le gain d'acquisition --- */}
            <div className="mt-4 mb-2 px-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <Landmark className="h-3.5 w-3.5" />
                Fiscalité sur le gain d'acquisition
              </p>
              {hasAbattement && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Abattement pour durée de détention appliqué{abattementPct > 0 ? ` (${(abattementPct * 100).toFixed(0)}%)` : ''} — base imposable IR réduite à {fmt(totalGA * (1 - abattementPct))}
                </p>
              )}
              {!hasAbattement && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  Aucun abattement applicable — vente moins de 2 ans après fin de conservation
                </p>
              )}
            </div>
            <WaterfallRow label="IR sur gain d'acquisition" description={`Barème progressif${hasAbattement ? ' (après abattement)' : ' (sans abattement)'}`} value={totalIR_GA} delay={0.45} />
            <WaterfallRow label="PS sur gain d'acquisition" description="Prélèvements sociaux (17,2% sur l'assiette brute)" value={totalPS_GA} delay={0.5} />
            {result.total_contribution_salariale > 0 && (
              <WaterfallRow label="Contribution salariale" description="10% applicable au-delà de 300 000 €" value={result.total_contribution_salariale} delay={0.55} />
            )}

            {/* --- Fiscalité sur la plus-value de cession --- */}
            {totalPV > 0 && (
              <>
                <div className="mt-4 mb-2 px-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Fiscalité sur la plus-value de cession
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Prélèvement forfaitaire unique (PFU / flat tax 30%)
                  </p>
                </div>
                <WaterfallRow label="IR sur PV de cession" description="Flat tax 12,8%" value={totalIR_PV} delay={0.6} />
                <WaterfallRow label="PS sur PV de cession" description="17,2%" value={totalPS_PV} delay={0.65} />
              </>
            )}

            <div className="border-t my-3" />
            <WaterfallRow label="Cash net reçu" value={result.gain_net_total} isTotal delay={0.7} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Donut */}
      <DonutChart data={donutData} delay={0.5} />
    </>
  );
}

// ════════════════════════════════════════════════════════
// CAS 2 — PLAN NON QUALIFIÉ (R3)
// Charge sur bulletin (vesting) + cash à la cession
// ════════════════════════════════════════════════════════
function NonQualifiedResults({ result }: RSUResultsProps) {
  const plan = result.plans[0]; // simulation isolée par plan
  const pvBrute = plan.pv_cession_eur;
  const irPV = plan.ir_pv_cession;
  const psPV = plan.ps_pv_cession;
  const cashNetCession = pvBrute - irPV - psPV;

  const gainAcqBrut = plan.gain_acquisition_eur;
  const cotisations = plan.contribution_salariale;
  const irGA = plan.ir_gain_acquisition;
  const psGA = plan.ps_gain_acquisition;
  const ponctionBulletin = cotisations + irGA + psGA;

  const isVenteImmediate = pvBrute <= 0;

  return (
    <>
      {/* Bloc 1 — Cash reçu lors de la vente (hero) */}
      <motion.div {...anim(0.1)}>
        <Card className={`overflow-hidden ${isVenteImmediate ? 'border-amber-300/50 dark:border-amber-700/50' : 'border-primary/20'}`}>
          <div className={isVenteImmediate ? 'bg-gradient-to-br from-amber-50 via-amber-25 to-transparent dark:from-amber-950/20 dark:via-transparent' : 'bg-gradient-to-br from-primary/5 via-primary/3 to-transparent'}>
            <CardContent className="py-8 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium mb-4">
                <FileWarning className="h-3.5 w-3.5" />
                Plan non qualifié — RSU étranger
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Cash net reçu lors de la vente</p>
              <p className={`text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums ${
                isVenteImmediate ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
              }`} style={{ lineHeight: '1.1' }}>
                {fmt(Math.max(0, cashNetCession))}
              </p>

              {isVenteImmediate && (
                <div className="mt-4 p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 max-w-md mx-auto">
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                    Vous vendez au prix du vesting. Aucun gain de cession — seule la charge sur votre bulletin de salaire est à anticiper.
                  </p>
                </div>
              )}

              {!isVenteImmediate && (
                <p className="text-xs text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
                  Ce montant correspond au cash réellement perçu sur votre compte après prélèvements sur la plus-value de cession.
                </p>
              )}
            </CardContent>
          </div>
        </Card>
      </motion.div>

      {/* Bloc 1 — Détail waterfall PV cession */}
      {!isVenteImmediate && (
        <motion.div {...anim(0.2)}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Détail du cash de cession
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <WaterfallRow label="Plus-value de cession brute" description="Écart entre le prix de vente et la valeur au vesting" value={pvBrute} isPositive delay={0.25} />
              <div className="border-t my-2" />
              <WaterfallRow label="IR sur PV (flat tax 12,8%)" value={irPV} delay={0.3} />
              <WaterfallRow label="Prélèvements sociaux sur PV (17,2%)" value={psPV} delay={0.35} />
              <div className="border-t my-2" />
              <WaterfallRow label="Cash net reçu" value={Math.max(0, cashNetCession)} isTotal delay={0.4} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Bloc 2 — Charge fiscale sur le bulletin de salaire */}
      <motion.div {...anim(isVenteImmediate ? 0.2 : 0.35)}>
        <Card className={`overflow-hidden ${isVenteImmediate ? 'border-red-300/50 dark:border-red-700/50 ring-1 ring-red-200/50 dark:ring-red-800/30' : 'border-red-200/50 dark:border-red-800/30'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-300">
              <Receipt className="h-4 w-4" />
              Charge fiscale sur votre bulletin de salaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <WaterfallRow label="Gain d'acquisition brut" description="Valeur des actions le jour du vesting" value={gainAcqBrut} isPositive delay={isVenteImmediate ? 0.25 : 0.4} />
            <div className="border-t my-2" />
            {cotisations > 0 && (
              <WaterfallRow label="Cotisations salariales" value={cotisations} delay={isVenteImmediate ? 0.3 : 0.45} />
            )}
            <WaterfallRow label="IR retenu à la source (impact taux PAS)" value={irGA} delay={isVenteImmediate ? 0.35 : 0.5} />
            <WaterfallRow label="Prélèvements sociaux" value={psGA} delay={isVenteImmediate ? 0.4 : 0.55} />
            <div className="border-t my-2" />
            <WaterfallRow label="Ponction nette sur bulletin" value={ponctionBulletin} isTotal delay={isVenteImmediate ? 0.45 : 0.6} />
          </CardContent>
          <div className="px-6 pb-4">
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                Ce montant ne correspond à aucun cash reçu. Il réduit votre salaire net du mois de vesting.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Bloc 3 — Synthèse chronologique */}
      <motion.div {...anim(isVenteImmediate ? 0.4 : 0.5)}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Synthèse chronologique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2.5 px-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Événement</th>
                    <th className="text-right py-2.5 px-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Cash reçu</th>
                    <th className="text-right py-2.5 px-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">Charge fiscale</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-dashed hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                        <span className="font-medium">Vesting</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">0 €</td>
                    <td className="py-3 px-3 text-right tabular-nums text-red-600 dark:text-red-400 font-medium">−{fmt(ponctionBulletin)}</td>
                  </tr>
                  <tr className="border-b border-dashed hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="font-medium">Cession</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                      {isVenteImmediate ? '0 €' : `+${fmt(pvBrute)}`}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-red-600 dark:text-red-400 font-medium">
                      {(irPV + psPV) > 0 ? `−${fmt(irPV + psPV)}` : '—'}
                    </td>
                  </tr>
                  <tr className="bg-muted/40">
                    <td className="py-3 px-3 font-bold">Net réel</td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold text-primary">
                      {fmt(Math.max(0, cashNetCession))}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold text-red-600 dark:text-red-400">
                      −{fmt(ponctionBulletin + irPV + psPV)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

// ────────────────────────────────────────────────────────
// Shared: Donut chart
// ────────────────────────────────────────────────────────
function DonutChart({ data, delay }: { data: { name: string; value: number }[]; delay: number }) {
  return (
    <motion.div {...anim(delay)}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Répartition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-44 h-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {data.map((_, i) => (
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
              {data.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
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
  );
}

// ════════════════════════════════════════════════════════
// MAIN — Routing conditionnel
// ════════════════════════════════════════════════════════
export function RSUResults({ result, onReset, onSave }: RSUResultsProps) {
  const expertUrl = 'https://www.perlib.fr/prendre-rdv?utm_source=fincare_app&utm_campaign=simulateur_rsu';

  // Déterminer le type de plan (simulation isolée = 1 plan)
  const isNonQualifie = result.plans.length > 0 && result.plans.every(p => p.regime === 'R3');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Routing conditionnel */}
      {isNonQualifie ? (
        <NonQualifiedResults result={result} onReset={onReset} onSave={onSave} />
      ) : (
        <QualifiedResults result={result} onReset={onReset} onSave={onSave} />
      )}

      {/* Plan-by-plan detail */}
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

      {/* Avertissement seuil 300k (qualifié seulement) */}
      {!isNonQualifie && result.seuil_300k_applique && (
        <motion.div {...anim(0.8)}>
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                Le seuil de 300 000 € s'applique à votre situation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
              <p>Votre gain d'acquisition dépasse 300 000 €. La <strong>Tranche A</strong> (jusqu'à 300 000 €) bénéficie du régime avantageux avec abattement de 50%. La <strong>Tranche B</strong> (au-delà) est imposée comme un salaire, sans abattement.</p>
              <p className="font-medium">Consultez un expert Perlib pour optimiser le timing de vos cessions.</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Disclaimer */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="py-4">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Estimation indicative et pédagogique. Ne constitue pas un conseil fiscal. Les résultats sont basés sur les règles fiscales générales applicables aux résidents fiscaux français et peuvent varier selon votre situation personnelle. Perlib recommande de consulter un expert avant toute décision.
          </p>
        </CardContent>
      </Card>

      {/* CTAs */}
      <motion.div {...anim(0.9)} className="flex flex-col sm:flex-row gap-3 pt-2">
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
