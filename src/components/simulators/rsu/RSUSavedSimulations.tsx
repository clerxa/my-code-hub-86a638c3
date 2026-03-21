/**
 * Liste des simulations RSU sauvegardées
 * Permet de recharger et relancer le calcul
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, Trash2, Play, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { REGIME_SHORT_LABELS } from '@/types/rsu';
import type { RSUPlan, RSUCessionParams } from '@/types/rsu';
import { loadSimulationsList, deleteSimulationFromDb, type SavedRSUSimulation } from '@/hooks/useRSUPersistence';

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

interface RSUSavedSimulationsProps {
  onLoad: (plans: RSUPlan[], params: RSUCessionParams) => void;
  onBack: () => void;
}

export function RSUSavedSimulations({ onLoad, onBack }: RSUSavedSimulationsProps) {
  const [simulations, setSimulations] = useState<SavedRSUSimulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const sims = await loadSimulationsList();
    setSimulations(sims);
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (simId: string) => {
    await deleteSimulationFromDb(simId);
    setSimulations(prev => prev.filter(s => s.id !== simId));
    toast.success('Simulation supprimée');
  };

  const handleLoad = (sim: SavedRSUSimulation) => {
    onLoad(sim.plans, sim.cessionParams);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-20"
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {simulations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-medium text-muted-foreground">Aucune simulation sauvegardée</p>
            <p className="text-sm text-muted-foreground mt-1">
              Lancez une simulation de cession puis cliquez sur "Sauvegarder" pour la retrouver ici.
            </p>
            <Button variant="outline" onClick={onBack} className="mt-6">
              Retour au dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {simulations.map((sim, i) => {
            const totalGA = sim.plans.reduce((s, p) => s + p.gain_acquisition_total, 0);
            const totalActions = sim.plans.reduce((s, p) => s + p.vestings.reduce((a, v) => a + v.nb_rsu, 0), 0);
            const regimes = [...new Set(sim.plans.map(p => p.regime))];

            return (
              <motion.div
                key={sim.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate">{sim.nom}</h3>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {sim.mode === 'avance' ? 'Avancé' : 'Simple'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                          <Clock className="h-3 w-3" />
                          {fmtDate(sim.created_at)}
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {regimes.map(r => (
                            <Badge key={r} variant="secondary" className="text-[10px]">
                              {REGIME_SHORT_LABELS[r]}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{sim.plans.length} plan{sim.plans.length > 1 ? 's' : ''}</span>
                          <span>{totalActions} actions</span>
                          <span>GA: {fmt(totalGA)}</span>
                          <span>TMI: {sim.tmi}%</span>
                          <span>Prix: {fmt(sim.prix_vente)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleLoad(sim)}
                          className="gap-1.5"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Relancer
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cette simulation ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                La simulation « {sim.nom} » sera définitivement supprimée.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(sim.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
