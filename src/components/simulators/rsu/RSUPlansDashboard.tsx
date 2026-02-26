/**
 * Écran 1 — Tableau de bord des plans RSU
 */

import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { RSUPlan } from '@/types/rsu';
import { REGIME_LABELS, REGIME_COLORS } from '@/types/rsu';

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

interface RSUPlansDashboardProps {
  plans: RSUPlan[];
  onAddPlan: () => void;
  onEditPlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
  onSimulate: () => void;
}

export function RSUPlansDashboard({ plans, onAddPlan, onEditPlan, onDeletePlan, onSimulate }: RSUPlansDashboardProps) {
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
              Ajoutez vos plans RSU pour simuler l'impact fiscal de la cession de vos actions.
            </p>
            <Button onClick={onAddPlan} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plans list */}
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

          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{plan.nom}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Attribution {plan.annee_attribution} · {plan.devise}
                        </p>
                      </div>
                      <Badge className={REGIME_COLORS[plan.regime]}>
                        {plan.regime}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Gain d'acquisition total</p>
                      <p className="text-xl font-bold">{fmt(plan.gain_acquisition_total)}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{plan.vestings.length} période{plan.vestings.length > 1 ? 's' : ''} de vesting</span>
                      <span>·</span>
                      <span>{plan.vestings.reduce((s, v) => s + v.nb_rsu, 0)} actions</span>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="ghost" size="sm" className="flex-1 gap-1" onClick={() => onEditPlan(plan.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1">
                            <Trash2 className="h-3.5 w-3.5" />
                            Supprimer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce plan ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Le plan « {plan.nom} » sera définitivement supprimé.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeletePlan(plan.id)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* CTA simulate */}
      {plans.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button onClick={onSimulate} size="lg" className="w-full gap-2">
            Simuler la cession
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
