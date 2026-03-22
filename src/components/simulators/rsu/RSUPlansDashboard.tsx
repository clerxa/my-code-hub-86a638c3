/**
 * Écran 1 — Tableau de bord des plans RSU (vue table premium)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Banknote, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import type { RSUPlan, VestingLine } from '@/types/rsu';
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
  onDeclareCession?: (planId: string, nbActions: number) => Promise<void>;
  isDeclaring?: boolean;
  onViewSavedSimulations?: () => void;
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

// ─── FIFO helper for RSU vestings ───
function computeRSUFifoDetail(vestings: VestingLine[], nbToSell: number): { date: string; nb: number }[] {
  const sorted = [...vestings]
    .filter(v => v.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const today = new Date();
  // Only include vested lines
  const available = sorted.filter(v => new Date(v.date) <= today);

  let remaining = nbToSell;
  const result: { date: string; nb: number }[] = [];
  for (const v of available) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, v.nb_rsu);
    result.push({ date: v.date, nb: take });
    remaining -= take;
  }
  return result;
}

function getVestedActions(plan: RSUPlan): number {
  const today = new Date();
  return plan.vestings
    .filter(v => new Date(v.date) <= today)
    .reduce((s, v) => s + v.nb_rsu, 0);
}

// ─── Declare Cession Dialog (FIFO) ───
function RSUDeclareCessionDialog({
  plan,
  onDeclareCession,
  isDeclaring,
}: {
  plan: RSUPlan;
  onDeclareCession: (planId: string, nbActions: number) => Promise<void>;
  isDeclaring: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [nbActions, setNbActions] = useState<string>('');
  const nbParsed = parseInt(nbActions) || 0;
  const vestedActions = getVestedActions(plan);
  const isVestingComplete = getVestingProgress(plan) === 100;

  const fifoDetail = nbParsed > 0 ? computeRSUFifoDetail(plan.vestings, nbParsed) : [];
  const isValid = nbParsed > 0 && nbParsed <= vestedActions;

  const handleSubmit = async () => {
    if (!isValid) return;
    await onDeclareCession(plan.id, nbParsed);
    setOpen(false);
    setNbActions('');
  };

  if (vestedActions <= 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-emerald-600"
            >
              <Banknote className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
        </DialogTrigger>
        <TooltipContent side="bottom">Déclarer une cession</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-600" />
            Déclarer une cession
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{plan.nom}</span>
            {' · '}{vestedActions} action{vestedActions > 1 ? 's' : ''} vestée{vestedActions > 1 ? 's' : ''} disponible{vestedActions > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nb-actions-rsu">Nombre d'actions vendues</Label>
            <Input
              id="nb-actions-rsu"
              type="number"
              min={1}
              max={vestedActions}
              value={nbActions}
              onChange={(e) => setNbActions(e.target.value)}
              placeholder={`Max ${vestedActions}`}
              className="font-mono"
            />
            {nbParsed > vestedActions && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Maximum {vestedActions} actions disponibles
              </p>
            )}
          </div>

          {/* FIFO preview */}
          {fifoDetail.length > 0 && isValid && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2"
            >
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Détail FIFO (First In, First Out)
              </p>
              <p className="text-[10px] text-muted-foreground">
                Les actions les plus anciennes sont cédées en priorité
              </p>
              <div className="space-y-1">
                {fifoDetail.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Vesting du {new Date(d.date).toLocaleDateString('fr-FR')}
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {d.nb} action{d.nb > 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
          <Button
            size="sm"
            disabled={!isValid || isDeclaring}
            onClick={handleSubmit}
            className="gap-1.5"
          >
            {isDeclaring ? 'Enregistrement…' : 'Confirmer la cession'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RSUPlansDashboard({
  plans,
  onAddPlan,
  onEditPlan,
  onDeletePlan,
  onSimulate,
  onViewPlan,
  onSimulatePlan,
  onDeclareCession,
  isDeclaring = false,
  onViewSavedSimulations,
}: RSUPlansDashboardProps) {
  const totalGain = getTotalGain(plans);
  const totalActions = getTotalActions(plans);
  const avgVesting = getAverageVesting(plans);
  const plansTableCols = 'grid-cols-[minmax(260px,2.1fr)_minmax(130px,0.9fr)_minmax(100px,0.8fr)_minmax(180px,1.05fr)_minmax(230px,1.4fr)_minmax(190px,1fr)_148px]';

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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">Détail des plans</h2>
            <div className="flex items-center gap-2">
              {onViewSavedSimulations && (
                <Button onClick={onViewSavedSimulations} variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Mes simulations
                </Button>
              )}
              <Button onClick={onAddPlan} variant="outline" size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                Ajouter un plan
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="min-w-[1360px] w-full">
              {/* Table header */}
              <div className={`grid ${plansTableCols} items-center gap-x-4 px-5 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium`}>
                <span>Plan</span>
                <span>Régime</span>
                <span className="text-right">Actions</span>
                <span>Vesting</span>
                <span>Période</span>
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
                      <div className={`grid ${plansTableCols} items-center gap-x-4 px-5 py-3.5`}>
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
                        <p className="text-xs tabular-nums text-muted-foreground">
                          {start ? fmtDate(start) : '—'} → {end ? fmtDate(end) : '—'}
                        </p>

                        {/* Gain acq. */}
                        <p className="text-sm font-bold tabular-nums text-foreground text-right whitespace-nowrap">{fmt(plan.gain_acquisition_total)}</p>

                        {/* Actions */}
                        <TooltipProvider delayDuration={200}>
                          <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
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

                            {/* Simuler une cession */}
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
                              <TooltipContent side="bottom">Simuler une cession</TooltipContent>
                            </Tooltip>

                            {/* Déclarer une cession (FIFO) */}
                            {onDeclareCession && (
                              <RSUDeclareCessionDialog
                                plan={plan}
                                onDeclareCession={onDeclareCession}
                                isDeclaring={isDeclaring}
                              />
                            )}

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
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
