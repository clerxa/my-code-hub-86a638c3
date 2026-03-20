/**
 * Écran 1 — Tableau de bord des plans RSU (vue table premium)
 */

import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import type { RSUPlan } from '@/types/rsu';
import { REGIME_COLORS, REGIME_SHORT_LABELS } from '@/types/rsu';

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtNumber = (v: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v);

interface RSUPlansDashboardProps {
  plans: RSUPlan[];
  onAddPlan: () => void;
  onEditPlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
  onSimulate: () => void;
  onViewPlan?: (id: string) => void;
  onSimulatePlan?: (id: string) => void;
}

function getVestingDateRange(plan: RSUPlan) {
  if (!plan.vestings || plan.vestings.length === 0) return { start: null, end: null };
  const dates = plan.vestings.map(v => v.date).filter(Boolean).sort();
  return { start: dates[0] || null, end: dates[dates.length - 1] || null };
}

function getVestingProgress(plan: RSUPlan): number {
  if (!plan.vestings || plan.vestings.length === 0) return 0;
  const today = new Date();
  const totalActions = plan.vestings.reduce((s, v) => s + v.nb_rsu, 0);
  if (totalActions === 0) return 0;
  const vestedActions = plan.vestings
    .filter(v => new Date(v.date) <= today)
    .reduce((s, v) => s + v.nb_rsu, 0);
  return Math.min(100, Math.round((vestedActions / totalActions) * 100));
}

function getTotalGain(plans: RSUPlan[]) {
  return plans.reduce((s, p) => s + p.gain_acquisition_total, 0);
}

function getTotalActions(plans: RSUPlan[]) {
  return plans.reduce((s, p) => s + p.vestings.reduce((sv, v) => sv + v.nb_rsu, 0), 0);
}

function getAverageVesting(plans: RSUPlan[]) {
  if (plans.length === 0) return 0;
  const total = plans.reduce((s, p) => s + getVestingProgress(p), 0);
  return Math.round(total / plans.length);
}

export function RSUPlansDashboard({
  plans, onAddPlan, onEditPlan, onDeletePlan, onSimulate, onViewPlan, onSimulatePlan,
}: RSUPlansDashboardProps) {
  const totalGain = getTotalGain(plans);
  const totalActions = getTotalActions(plans);
  const avgVesting = getAverageVesting(plans);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Empty state */}
      {plans.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-2xl bg-primary/5 p-5 mb-5">
              <BarChart3 className="h-10 w-10 text-primary/60" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aucun plan RSU</h3>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm">
              Ajoutez vos plans RSU pour suivre le vesting de vos actions et simuler l'impact fiscal.
            </p>
            <Button onClick={onAddPlan} size="lg" className="gap-2 px-8">
              <Plus className="h-4 w-4" />
              Ajouter un plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary + Plans */}
      {plans.length > 0 && (
        <>
          {/* Summary cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <Card className="bg-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Plans actifs</p>
                <p className="text-2xl font-bold tabular-nums">{plans.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Actions totales</p>
                <p className="text-2xl font-bold tabular-nums">{fmtNumber(totalActions)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Vesting moyen</p>
                <p className="text-2xl font-bold tabular-nums">{avgVesting}%</p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Gain d'acquisition</p>
                <p className="text-2xl font-bold tabular-nums">{fmt(totalGain)}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Détail des plans</h2>
            <Button onClick={onAddPlan} variant="outline" size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              Ajouter un plan
            </Button>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[minmax(160px,1.5fr)_110px_70px_130px_minmax(140px,1fr)_minmax(100px,auto)_108px] items-center gap-x-3 px-5 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
            <span>Plan</span>
            <span>Régime</span>
            <span className="text-right">Actions</span>
            <span>Vesting</span>
            <span className="hidden lg:block">Période</span>
            <span className="text-right">Gain acq.</span>
            <span></span>
          </div>

          {/* Plan rows */}
          <div className="space-y-1.5">
            {plans.map((plan, index) => {
              const { start, end } = getVestingDateRange(plan);
              const totalPlanActions = plan.vestings.reduce((s, v) => s + v.nb_rsu, 0);
              const vestingPct = getVestingProgress(plan);

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: 0.15 + index * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Card className="group transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20">
                    <CardContent className="p-0">
                      <div className="grid grid-cols-[minmax(180px,2fr)_100px_80px_140px_160px_120px_auto] items-center gap-x-4 px-5 py-3.5">
                        {/* Plan info */}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm leading-tight text-foreground truncate">{plan.nom}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{plan.annee_attribution} · {plan.devise}</p>
                        </div>

                        {/* Regime badge */}
                        <div>
                          <Badge className={`${REGIME_COLORS[plan.regime]} text-[11px] font-medium px-2 py-0.5 whitespace-nowrap`} variant="secondary">
                            {REGIME_SHORT_LABELS[plan.regime]}
                          </Badge>
                        </div>

                        {/* Actions count */}
                        <p className="text-sm font-semibold tabular-nums text-right">{fmtNumber(totalPlanActions)}</p>

                        {/* Vesting */}
                        <div className="flex items-center gap-2">
                          <Progress value={vestingPct} className="h-1.5 flex-1 max-w-[60px]" />
                          <span className={`text-xs font-bold tabular-nums ${vestingPct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                            {vestingPct}%
                          </span>
                        </div>

                        {/* Période */}
                        <p className="text-xs tabular-nums text-muted-foreground hidden lg:block">
                          {start ? fmtDate(start) : '—'} → {end ? fmtDate(end) : '—'}
                        </p>

                        {/* Gain acq. */}
                        <p className="text-sm font-bold tabular-nums text-foreground text-right">{fmt(plan.gain_acquisition_total)}</p>

                        {/* Actions */}
                        <TooltipProvider delayDuration={200}>
                          <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                  onClick={() => onEditPlan(plan.id)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">Modifier</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
                                  onClick={() => {
                                    if (onSimulatePlan) onSimulatePlan(plan.id);
                                    else onSimulate();
                                  }}
                                >
                                  <TrendingUp className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">Simuler la cession</TooltipContent>
                            </Tooltip>

                            <AlertDialog>
                              <Tooltip>
                                <AlertDialogTrigger asChild>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                </AlertDialogTrigger>
                                <TooltipContent side="bottom">Supprimer</TooltipContent>
                              </Tooltip>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer ce plan ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Le plan « {plan.nom} » sera définitivement supprimé. Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDeletePlan(plan.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
