/**
 * Écran 1 — Tableau de bord des plans RSU (vue table)
 */

import { motion } from 'framer-motion';
import { Plus, Eye, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import type { RSUPlan } from '@/types/rsu';
import { REGIME_COLORS } from '@/types/rsu';

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

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
  if (!plan.vestings || plan.vestings.length === 0) return { start: '—', end: '—' };
  const dates = plan.vestings.map(v => v.date).filter(Boolean).sort();
  return {
    start: dates[0] ? fmtDate(dates[0]) : '—',
    end: dates[dates.length - 1] ? fmtDate(dates[dates.length - 1]) : '—',
  };
}

export function RSUPlansDashboard({
  plans, onAddPlan, onEditPlan, onDeletePlan, onSimulate, onViewPlan, onSimulatePlan,
}: RSUPlansDashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Empty state */}
      {plans.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun plan RSU</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md">
              Ajoutez vos plans RSU pour gérer et simuler l'impact fiscal de vos actions.
            </p>
            <Button onClick={onAddPlan} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plans table */}
      {plans.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {plans.length} plan{plans.length > 1 ? 's' : ''} RSU
            </h2>
            <Button onClick={onAddPlan} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un plan
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Régime</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    <TableHead>Début vesting</TableHead>
                    <TableHead>Fin vesting</TableHead>
                    <TableHead className="text-right">Gain d'acquisition</TableHead>
                    <TableHead className="text-right sr-only">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan, index) => {
                    const { start, end } = getVestingDateRange(plan);
                    const totalActions = plan.vestings.reduce((s, v) => s + v.nb_rsu, 0);

                    return (
                      <motion.tr
                        key={plan.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{plan.nom}</p>
                            <p className="text-xs text-muted-foreground">{plan.annee_attribution} · {plan.devise}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={REGIME_COLORS[plan.regime]} variant="secondary">
                            {plan.regime}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {totalActions}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">{start}</TableCell>
                        <TableCell className="text-sm tabular-nums">{end}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {fmt(plan.gain_acquisition_total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider delayDuration={200}>
                            <div className="flex items-center justify-end gap-1">
                              {onViewPlan && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewPlan(plan.id)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Voir</TooltipContent>
                                </Tooltip>
                              )}

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditPlan(plan.id)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Modifier</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      if (onSimulatePlan) onSimulatePlan(plan.id);
                                      else onSimulate();
                                    }}
                                  >
                                    <TrendingUp className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Simuler la cession</TooltipContent>
                              </Tooltip>

                              <AlertDialog>
                                <Tooltip>
                                  <AlertDialogTrigger asChild>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                  </AlertDialogTrigger>
                                  <TooltipContent>Supprimer</TooltipContent>
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
                                    <AlertDialogAction onClick={() => onDeletePlan(plan.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </motion.div>
  );
}
