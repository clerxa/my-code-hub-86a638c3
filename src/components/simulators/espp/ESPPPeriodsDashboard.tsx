/**
 * Dashboard des périodes ESPP — même pattern que RSUPlansDashboard
 */

import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { ESPPPeriod } from '@/types/esppNew';
import { computeIntermediaire } from '@/utils/esppCalculations';

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

interface ESPPPeriodsDashboardProps {
  periods: ESPPPeriod[];
  onAddPeriod: () => void;
  onEditPeriod: (id: string) => void;
  onDeletePeriod: (id: string) => void;
  onSimulate: () => void;
}

export function ESPPPeriodsDashboard({ periods, onAddPeriod, onEditPeriod, onDeletePeriod, onSimulate }: ESPPPeriodsDashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {periods.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune période ESPP</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md">
              Ajoutez vos périodes d'achat ESPP pour simuler l'impact fiscal.
            </p>
            <Button onClick={onAddPeriod} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une période
            </Button>
          </CardContent>
        </Card>
      )}

      {periods.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {periods.length} période{periods.length > 1 ? 's' : ''} ESPP
            </h2>
            <Button onClick={onAddPeriod} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une période
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {periods.map((period, index) => {
              const inter = computeIntermediaire(period);
              return (
                <motion.div
                  key={period.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{period.entreprise_nom || 'Période ESPP'}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {period.entreprise_ticker} · {period.nb_actions_achetees} actions · {period.entreprise_devise}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Rabais estimé</p>
                        <p className="text-xl font-bold">{fmt(inter.rabais_eur)}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Décote {period.taux_rabais}%</span>
                        <span>·</span>
                        <span>{period.date_debut_offre || '—'} → {period.date_achat || '—'}</span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button variant="ghost" size="sm" className="flex-1 gap-1" onClick={() => onEditPeriod(period.id)}>
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
                              <AlertDialogTitle>Supprimer cette période ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette période ESPP sera définitivement supprimée.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeletePeriod(period.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {periods.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Button onClick={onSimulate} size="lg" className="w-full gap-2">
            Calculer ma fiscalité ESPP
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
